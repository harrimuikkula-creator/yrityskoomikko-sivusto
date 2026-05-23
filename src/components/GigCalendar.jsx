import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { useLanguage } from '../i18n/LanguageContext'
import { db, ensureFirebaseSession, isFirebaseConfigured } from '../lib/firebase'
import SectionHeading from './ui/SectionHeading'

function getMonthFormatter(dateLocale) {
  return new Intl.DateTimeFormat(dateLocale, {
    month: 'long',
    year: 'numeric',
  })
}

function formatDate(dateValue, dateLocale) {
  if (!dateValue) return ''
  if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
    const date = dateValue.toDate()
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString(dateLocale)
  }

  const asText = String(dateValue)
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(asText)) return asText

  const date = new Date(asText)
  if (Number.isNaN(date.getTime())) return asText
  return date.toLocaleDateString(dateLocale)
}

function parseGigDate(dateValue) {
  if (!dateValue) return null
  if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
    const timestampDate = dateValue.toDate()
    if (Number.isNaN(timestampDate.getTime())) return null
    return new Date(
      timestampDate.getFullYear(),
      timestampDate.getMonth(),
      timestampDate.getDate(),
    )
  }

  const asText = String(dateValue).trim()
  const finnishDateMatch = asText.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)

  if (finnishDateMatch) {
    const day = Number(finnishDateMatch[1])
    const month = Number(finnishDateMatch[2])
    const year = Number(finnishDateMatch[3])
    return new Date(year, month - 1, day)
  }

  const isoDateMatch = asText.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (isoDateMatch) {
    const year = Number(isoDateMatch[1])
    const month = Number(isoDateMatch[2])
    const day = Number(isoDateMatch[3])
    return new Date(year, month - 1, day)
  }

  const parsed = new Date(asText)
  if (Number.isNaN(parsed.getTime())) return null
  return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

function dayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function normalizeTicketUrl(url) {
  const trimmed = String(url ?? '').trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function TicketLink({ ticketUrl, label, className = '' }) {
  const href = normalizeTicketUrl(ticketUrl)
  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener"
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-gold-400 transition-colors hover:text-gold-300 ${className}`}
    >
      {label}
      <svg
        className="h-3.5 w-3.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
        />
      </svg>
    </a>
  )
}

function formatVenueName(venue, clubName) {
  const v = String(venue ?? '').trim()
  const c = String(clubName ?? '').trim()
  if (v && c && v.toLowerCase() !== c.toLowerCase()) return `${v} — ${c}`
  return v || c || '-'
}

function buildGigDisplayFields({
  eventType: rawEventType,
  festivalName: rawFestivalName,
  venue,
  clubName,
  city: rawCity,
  ticketUrl: rawTicketUrl,
  privateLabel,
}) {
  const eventType = rawEventType === 'private' ? 'private' : 'public'
  const isPrivate = eventType === 'private'
  const festivalName = String(rawFestivalName ?? '').trim() || null
  const city = rawCity?.trim() || '-'
  const venueName = formatVenueName(venue, clubName)

  let displayPlace = venueName
  let displaySubtitle = null

  if (isPrivate) {
    displayPlace = privateLabel
  } else if (festivalName) {
    displayPlace = festivalName
    if (venueName !== '-') {
      displaySubtitle = venueName
    }
  }

  return {
    eventType,
    isPrivate,
    isFestival: Boolean(festivalName),
    festivalName,
    place: venueName,
    displayPlace,
    displaySubtitle,
    city,
    ticketUrl: isPrivate ? null : normalizeTicketUrl(rawTicketUrl),
  }
}

function normalizeFallbackGig(gig, dateLocale, privateLabel) {
  const eventText = gig.event ?? ''
  const [place, city] = eventText.split('—').map((part) => part.trim())

  return {
    id: `${gig.date}-${eventText}`,
    date: formatDate(gig.date, dateLocale),
    parsedDate: parseGigDate(gig.date),
    ...buildGigDisplayFields({
      eventType: gig.eventType,
      festivalName: gig.festivalName,
      venue: place || eventText,
      city,
      ticketUrl: gig.ticketUrl,
      privateLabel,
    }),
  }
}

function normalizeFirestoreGig(doc, dateLocale, privateLabel) {
  const data = doc.data()

  return {
    id: doc.id,
    date: formatDate(data.date, dateLocale),
    parsedDate: parseGigDate(data.date),
    ...buildGigDisplayFields({
      eventType: data.eventType,
      festivalName: data.festivalName,
      venue: data.venue,
      clubName: data.clubName,
      city: data.city,
      ticketUrl: data.ticketUrl,
      privateLabel,
    }),
  }
}

function CityBadge({ city }) {
  const hasCity = city && city !== '-'

  return (
    <span
      className={`inline-flex items-center rounded-sm px-3 py-1 text-xs font-semibold uppercase tracking-wider ${
        hasCity
          ? 'bg-gold-400/15 text-gold-300'
          : 'bg-olive-800 text-cream-muted'
      }`}
    >
      {city || '-'}
    </span>
  )
}

function GigCalendarEntry({ gig, calendar, compact = false }) {
  const hasCity = gig.city && gig.city !== '-'
  const placeLabel = gig.isPrivate
    ? calendar.event
    : gig.festivalName
      ? calendar.festival
      : calendar.venue

  if (compact) {
    return (
      <li className="min-w-0">
        {gig.isFestival && (
          <span className="mb-0.5 block truncate text-[9px] font-semibold uppercase tracking-wide text-gold-400/90 sm:text-[10px]">
            {calendar.festival}
          </span>
        )}
        <span className="block truncate text-[10px] font-medium leading-tight text-gold-300 sm:text-xs">
          {gig.displayPlace}
        </span>
        {gig.displaySubtitle && (
          <span className="block truncate text-[10px] leading-tight text-olive-400 sm:text-xs">
            {gig.displaySubtitle}
          </span>
        )}
        {hasCity && (
          <span className="block truncate text-[10px] leading-tight text-olive-400 sm:text-xs">
            {gig.city}
          </span>
        )}
      </li>
    )
  }

  return (
    <li className="grid gap-4 border-b border-olive-800/60 pb-5 last:border-b-0 last:pb-0 sm:grid-cols-2 sm:gap-6">
      <div>
        <span className="text-xs font-semibold uppercase tracking-wider text-olive-400">
          {placeLabel}
        </span>
        <p className="mt-1 text-base font-medium text-cream">{gig.displayPlace}</p>
        {gig.displaySubtitle && (
          <p className="mt-1 text-sm text-cream-muted">{gig.displaySubtitle}</p>
        )}
      </div>
      <div className="sm:text-right">
        <span className="text-xs font-semibold uppercase tracking-wider text-olive-400">
          {calendar.city}
        </span>
        <div className="mt-1 sm:flex sm:justify-end">
          <CityBadge city={gig.city} />
        </div>
      </div>
      {gig.ticketUrl && (
        <div className="sm:col-span-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-olive-400">
            {calendar.ticketSales}
          </span>
          <div className="mt-1">
            <TicketLink ticketUrl={gig.ticketUrl} label={calendar.tickets} />
          </div>
        </div>
      )}
    </li>
  )
}

function ViewToggle({ view, onChange, calendar }) {
  const options = [
    { id: 'list', label: calendar.viewList },
    { id: 'calendar', label: calendar.viewCalendar },
  ]

  return (
    <div
      className="inline-flex rounded-sm border border-olive-800 bg-olive-900/40 p-1"
      role="tablist"
      aria-label={calendar.viewAriaLabel}
    >
      {options.map((option) => {
        const isActive = view === option.id
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.id)}
            className={`rounded-sm px-4 py-2 text-sm font-semibold tracking-wide transition-colors ${
              isActive
                ? 'bg-gold-400/20 text-gold-300'
                : 'text-cream-muted hover:text-cream'
            }`}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function GigListRow({ gig, calendar }) {
  const hasCity = gig.city && gig.city !== '-'

  return (
    <li className="grid gap-1.5 px-4 py-2.5 transition-colors hover:bg-olive-900/40 sm:grid-cols-[7.5rem_1fr_auto] sm:items-center sm:gap-3 md:px-5">
      <time className="text-xs font-semibold tabular-nums text-gold-400 sm:text-sm">
        {gig.date}
      </time>
      <div className="min-w-0">
        {gig.isFestival && (
          <span className="mb-0.5 inline-flex rounded-sm bg-gold-400/15 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider text-gold-300">
            {calendar.festival}
          </span>
        )}
        <p className="text-sm font-medium leading-snug text-cream">{gig.displayPlace}</p>
        {gig.displaySubtitle && (
          <p className="text-xs leading-snug text-cream-muted">{gig.displaySubtitle}</p>
        )}
        {hasCity && (
          <p className="mt-0.5 text-xs text-olive-400 sm:hidden">{gig.city}</p>
        )}
        {gig.ticketUrl && (
          <TicketLink
            ticketUrl={gig.ticketUrl}
            label={calendar.tickets}
            className="mt-1 text-xs"
          />
        )}
      </div>
      {hasCity && (
        <p className="hidden text-right text-xs font-medium text-gold-300/90 sm:block">
          {gig.city}
        </p>
      )}
    </li>
  )
}

function GigListView({ monthlyGroups, calendar }) {
  const collapsedInit = useRef(false)
  const [collapsedMonths, setCollapsedMonths] = useState(() => new Set())

  useEffect(() => {
    if (collapsedInit.current || monthlyGroups.length <= 1) return
    collapsedInit.current = true
    setCollapsedMonths(
      new Set(monthlyGroups.slice(1).map((group) => group.monthKey)),
    )
  }, [monthlyGroups])

  function toggleMonth(monthKey) {
    setCollapsedMonths((prev) => {
      const next = new Set(prev)
      if (next.has(monthKey)) next.delete(monthKey)
      else next.add(monthKey)
      return next
    })
  }

  if (monthlyGroups.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-cream-muted md:px-5">{calendar.empty}</p>
    )
  }

  return (
    <div>
      <div className="hidden border-b border-olive-800 bg-olive-900/30 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-olive-500 sm:grid sm:grid-cols-[7.5rem_1fr_auto] sm:gap-3 md:px-5">
        <span>{calendar.dateColumn}</span>
        <span>{calendar.placeColumn}</span>
        <span className="text-right">{calendar.cityColumn}</span>
      </div>

      {monthlyGroups.map((group) => {
        const isCollapsed = collapsedMonths.has(group.monthKey)
        const panelId = `gig-month-${group.monthKey}`

        return (
          <div
            key={group.monthKey}
            className="border-b border-olive-800 last:border-b-0"
          >
            <button
              type="button"
              aria-expanded={!isCollapsed}
              aria-controls={panelId}
              onClick={() => toggleMonth(group.monthKey)}
              className="flex w-full items-center gap-3 bg-olive-900/60 px-4 py-2.5 text-left transition-colors hover:bg-olive-900/80 md:px-5"
            >
              <svg
                className={`h-4 w-4 shrink-0 text-gold-400 transition-transform ${
                  isCollapsed ? '' : 'rotate-90'
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
              <span className="min-w-0 flex-1 text-sm font-semibold uppercase tracking-wider text-olive-300">
                {group.monthLabel}
              </span>
              <span className="shrink-0 text-xs text-olive-500">
                {calendar.gigsInMonth(group.gigs.length)}
              </span>
              <span className="sr-only">
                {isCollapsed ? calendar.expandMonth : calendar.collapseMonth}
              </span>
            </button>

            {!isCollapsed && (
              <ul id={panelId} className="divide-y divide-olive-800/80">
                {group.gigs.map((gig) => (
                  <GigListRow key={gig.id} gig={gig} calendar={calendar} />
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

function getCalendarDays(year, month) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startWeekday = (new Date(year, month, 1).getDay() + 6) % 7
  const days = []

  for (let i = startWeekday - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), inMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), inMonth: true })
  }
  let nextDay = 1
  while (days.length % 7 !== 0) {
    days.push({ date: new Date(year, month + 1, nextDay++), inMonth: false })
  }

  return days
}

function GigCalendarView({ upcomingGigs, startOfToday, calendar }) {
  const monthFormatter = useMemo(
    () => getMonthFormatter(calendar.dateLocale),
    [calendar.dateLocale],
  )
  const initialMonth = useMemo(() => {
    const firstDated = upcomingGigs.find((g) => g.parsedDate)
    if (firstDated?.parsedDate) {
      return new Date(
        firstDated.parsedDate.getFullYear(),
        firstDated.parsedDate.getMonth(),
        1,
      )
    }
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  }, [upcomingGigs])

  const [visibleMonth, setVisibleMonth] = useState(initialMonth)
  const [selectedDayKey, setSelectedDayKey] = useState(null)

  useEffect(() => {
    setVisibleMonth(initialMonth)
    setSelectedDayKey(null)
  }, [initialMonth])

  const gigsByDay = useMemo(() => {
    const map = new Map()
    for (const gig of upcomingGigs) {
      if (!gig.parsedDate) continue
      const key = dayKey(gig.parsedDate)
      if (!map.has(key)) map.set(key, [])
      map.get(key).push(gig)
    }
    return map
  }, [upcomingGigs])

  const year = visibleMonth.getFullYear()
  const month = visibleMonth.getMonth()
  const calendarDays = getCalendarDays(year, month)
  const monthLabel = monthFormatter.format(visibleMonth)
  const todayKey = dayKey(startOfToday)

  const selectedGigs = selectedDayKey ? gigsByDay.get(selectedDayKey) ?? [] : []

  function goToMonth(offset) {
    setVisibleMonth(new Date(year, month + offset, 1))
    setSelectedDayKey(null)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-olive-800 bg-olive-900/60 px-4 py-4 sm:px-6">
        <button
          type="button"
          onClick={() => goToMonth(-1)}
          className="rounded-sm border border-olive-700 px-3 py-2 text-sm text-cream-muted transition-colors hover:border-gold-400/50 hover:text-gold-300"
          aria-label={calendar.prevMonth}
        >
          ←
        </button>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-olive-300 sm:text-base">
          {monthLabel}
        </h3>
        <button
          type="button"
          onClick={() => goToMonth(1)}
          className="rounded-sm border border-olive-700 px-3 py-2 text-sm text-cream-muted transition-colors hover:border-gold-400/50 hover:text-gold-300"
          aria-label={calendar.nextMonth}
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 border-b border-olive-800 bg-olive-900/30">
        {calendar.weekdays.map((label) => (
          <div
            key={label}
            className="px-1 py-3 text-center text-xs font-semibold uppercase tracking-wider text-olive-400"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map(({ date, inMonth }) => {
          const key = dayKey(date)
          const dayGigs = gigsByDay.get(key) ?? []
          const hasGigs = dayGigs.length > 0
          const isToday = key === todayKey
          const isSelected = key === selectedDayKey
          const isPast = date < startOfToday && inMonth

          return (
            <button
              key={`${key}-${inMonth}`}
              type="button"
              onClick={() => hasGigs && setSelectedDayKey(isSelected ? null : key)}
              disabled={!hasGigs}
              className={`min-h-[96px] border-b border-r border-olive-800 p-1.5 text-left transition-colors sm:min-h-[112px] sm:p-2 ${
                inMonth ? 'bg-olive-950/20' : 'bg-olive-950/60'
              } ${hasGigs ? 'cursor-pointer hover:bg-olive-900/50' : 'cursor-default'} ${
                isSelected ? 'bg-gold-400/10 ring-1 ring-inset ring-gold-400/40' : ''
              }`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold sm:text-sm ${
                  isToday
                    ? 'bg-gold-400 text-olive-950'
                    : inMonth
                      ? isPast
                        ? 'text-olive-500'
                        : 'text-cream'
                      : 'text-olive-600'
                }`}
              >
                {date.getDate()}
              </span>
              {hasGigs && (
                <ul className="mt-1 space-y-1">
                  {dayGigs.slice(0, 2).map((gig) => (
                    <GigCalendarEntry
                      key={gig.id}
                      gig={gig}
                      calendar={calendar}
                      compact
                    />
                  ))}
                  {dayGigs.length > 2 && (
                    <li className="text-[10px] text-olive-400 sm:text-xs">
                      {calendar.moreCount(dayGigs.length - 2)}
                    </li>
                  )}
                </ul>
              )}
            </button>
          )
        })}
      </div>

      {selectedGigs.length > 0 && (
        <div className="border-t border-olive-800 bg-olive-900/40 px-6 py-5">
          <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-olive-400">
            {selectedGigs[0].date}
          </h4>
          <ul>
            {selectedGigs.map((gig) => (
              <GigCalendarEntry key={gig.id} gig={gig} calendar={calendar} />
            ))}
          </ul>
        </div>
      )}

      {upcomingGigs.some((g) => !g.parsedDate) && (
        <p className="border-t border-olive-800 px-6 py-4 text-xs text-cream-muted">
          {calendar.unplacedGigs}
        </p>
      )}
    </div>
  )
}

export default function GigCalendar() {
  const { content } = useLanguage()
  const { calendar } = content
  const fallbackGigs = []
  const [gigs, setGigs] = useState(() =>
    fallbackGigs.map((gig) =>
      normalizeFallbackGig(gig, calendar.dateLocale, calendar.private),
    ),
  )
  const [syncFailed, setSyncFailed] = useState(false)
  const [configMissing, setConfigMissing] = useState(!isFirebaseConfigured)
  const [view, setView] = useState('list')

  const today = new Date()
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const upcomingGigs = useMemo(
    () =>
      gigs
        .filter((gig) => !gig.parsedDate || gig.parsedDate >= startOfToday)
        .sort((a, b) => {
          if (!a.parsedDate && !b.parsedDate) return 0
          if (!a.parsedDate) return 1
          if (!b.parsedDate) return -1
          return a.parsedDate.getTime() - b.parsedDate.getTime()
        }),
    [gigs, startOfToday],
  )

  const monthFormatter = useMemo(
    () => getMonthFormatter(calendar.dateLocale),
    [calendar.dateLocale],
  )

  const monthlyGroups = useMemo(
    () =>
      upcomingGigs.reduce((acc, gig) => {
        const monthLabel = gig.parsedDate
          ? monthFormatter.format(gig.parsedDate)
          : calendar.otherGigs
        const monthKey = gig.parsedDate
          ? `${gig.parsedDate.getFullYear()}-${gig.parsedDate.getMonth()}`
          : 'other'
        const lastGroup = acc[acc.length - 1]

        if (!lastGroup || lastGroup.monthKey !== monthKey) {
          acc.push({ monthLabel, monthKey, gigs: [gig] })
        } else {
          lastGroup.gigs.push(gig)
        }

        return acc
      }, []),
    [upcomingGigs, monthFormatter, calendar.otherGigs],
  )

  useEffect(() => {
    const fetchFirestoreGigs = async () => {
      const gigsQuery = query(collection(db, 'gigs'), orderBy('date', 'asc'))
      const snapshot = await getDocs(gigsQuery)
      return snapshot.docs.map((doc) =>
        normalizeFirestoreGig(doc, calendar.dateLocale, calendar.private),
      )
    }

    const loadGigs = async () => {
      if (!db) {
        setConfigMissing(true)
        setSyncFailed(false)
        return
      }

      setConfigMissing(false)

      try {
        const fetchedGigs = await fetchFirestoreGigs()
        setGigs(fetchedGigs)
        setSyncFailed(false)
      } catch (error) {
        try {
          await ensureFirebaseSession()
          const fetchedGigs = await fetchFirestoreGigs()
          setGigs(fetchedGigs)
          setSyncFailed(false)
        } catch (authError) {
          setSyncFailed(true)
          console.warn('Gig sync failed, using fallback data.', { error, authError })
        }
      }
    }

    loadGigs()
  }, [calendar.dateLocale, calendar.private])

  const isEmpty = upcomingGigs.length === 0

  return (
    <section id="kalenteri" className="section-padding">
      <div className="mx-auto max-w-content">
        <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow={calendar.eyebrow}
            title={calendar.title}
            subtitle={calendar.subtitle}
            className="mb-0"
          />
          <ViewToggle view={view} onChange={setView} calendar={calendar} />
        </div>

        {calendar.imageSrc && (
          <figure className="relative mb-10 overflow-hidden rounded-sm border border-olive-800 bg-olive-900 shadow-xl shadow-black/30 md:mb-12">
            <img
              src={calendar.imageSrc}
              alt={calendar.imageAlt}
              className="aspect-[16/10] w-full object-cover object-[center_35%] sm:aspect-[21/9]"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-olive-950/70 via-olive-950/10 to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute bottom-0 left-0 h-1 w-24 bg-gold-400/60"
              aria-hidden
            />
          </figure>
        )}

        <div className="overflow-hidden rounded-sm border border-olive-800">
          {configMissing ? (
            <p className="border-b border-olive-800 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
              {calendar.configMissing}
            </p>
          ) : null}
          {syncFailed && !configMissing && fallbackGigs.length === 0 ? (
            <p className="border-b border-olive-800 bg-amber-500/10 px-6 py-4 text-sm text-amber-200">
              {calendar.syncFailed}
            </p>
          ) : null}

          {isEmpty ? (
            <p className="px-6 py-8 text-sm text-cream-muted">{calendar.empty}</p>
          ) : view === 'list' ? (
            <GigListView monthlyGroups={monthlyGroups} calendar={calendar} />
          ) : (
            <GigCalendarView
              upcomingGigs={upcomingGigs}
              startOfToday={startOfToday}
              calendar={calendar}
            />
          )}
        </div>

        {calendar.disclaimer && (
          <p className="mt-4 max-w-2xl text-xs leading-relaxed text-olive-400 md:text-sm">
            {calendar.disclaimer}
          </p>
        )}
      </div>
    </section>
  )
}
