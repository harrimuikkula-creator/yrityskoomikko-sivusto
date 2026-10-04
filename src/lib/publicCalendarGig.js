export const PUBLIC_CALENDAR_COLLECTION = 'publicCalendarGigs'

const FINLAND_COUNTRY_ALIASES = new Set(['finland', 'suomi', 'fi', 'fin'])

export function isPublicDetailsHidden(data) {
  return data?.hidePublicDetails === true
}

function text(value) {
  return String(value ?? '').trim()
}

export function normalizeGigDate(value) {
  if (!value) return ''
  if (typeof value === 'string') return value
  if (typeof value.toDate === 'function') {
    const date = value.toDate()
    if (Number.isNaN(date.getTime())) return ''
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${date.getFullYear()}-${month}-${day}`
  }
  return String(value)
}

export function formatCity(rawCity) {
  const trimmed = text(rawCity)
  if (!trimmed || trimmed === '-') return '-'

  const parts = trimmed.split(',').map((part) => part.trim()).filter(Boolean)
  if (parts.length === 1) return parts[0]

  const [city, ...countryParts] = parts
  const country = countryParts.join(', ')
  if (FINLAND_COUNTRY_ALIASES.has(country.toLowerCase())) return city
  return `${city}, ${country}`
}

export function formatVenueName(venue, clubName) {
  const v = text(venue)
  const c = text(clubName)
  if (v && c && v.toLowerCase() !== c.toLowerCase()) return `${v} — ${c}`
  return v || c || ''
}

export function normalizeStartTime(value) {
  const time = text(value)
  return /^\d{2}:\d{2}$/.test(time) ? time : ''
}

/**
 * Public calendar row. Hidden gigs keep only id, date and city.
 * Venue, club, time, tickets and festival are omitted, not blanked into the UI.
 */
export function toPublicGigRecord(id, data = {}) {
  if (data?.bookingStatus === 'applied') return null
  const hidden = isPublicDetailsHidden(data)
  const record = {
    id: text(id || data.id),
    date: normalizeGigDate(data.date),
    city: text(data.city),
    hidePublicDetails: hidden,
    eventType: data.eventType === 'private' ? 'private' : 'public',
  }
  if (hidden) return record

  return {
    ...record,
    startTime: normalizeStartTime(data.startTime),
    venue: text(data.venue),
    clubName: text(data.clubName),
    location: text(data.location),
    ticketUrl: text(data.ticketUrl),
    festivalName: text(data.festivalName),
  }
}

/**
 * Full gig list, with the public feed hiding details when hidePublicDetails is set.
 * Applied gigs are left out. A public-only row is kept.
 */
export function mergeGigSources(fullGigs = [], publicGigs = []) {
  const hiddenIds = new Set(
    publicGigs.filter((gig) => isPublicDetailsHidden(gig)).map((gig) => text(gig.id)),
  )
  const byId = new Map()

  for (const gig of fullGigs) {
    const id = text(gig.id)
    const hidden = hiddenIds.has(id) || isPublicDetailsHidden(gig)
    const source = hidden
      ? {
          date: gig.date,
          city: gig.city,
          hidePublicDetails: true,
          bookingStatus: gig.bookingStatus,
        }
      : gig
    const record = toPublicGigRecord(id, source)
    if (record) byId.set(record.id, record)
  }

  for (const gig of publicGigs) {
    const id = text(gig.id)
    const existing = byId.get(id)
    if (isPublicDetailsHidden(gig)) {
      const record = toPublicGigRecord(id, {
        date: gig.date || existing?.date,
        city: gig.city || existing?.city,
        hidePublicDetails: true,
      })
      if (record) byId.set(record.id, record)
      continue
    }
    if (existing) continue
    const record = toPublicGigRecord(id, gig)
    if (record) byId.set(record.id, record)
  }

  return [...byId.values()].sort((a, b) => String(a.date).localeCompare(String(b.date)))
}

export function buildPublicGigView(record, { privateLabel = 'Yksityinen' } = {}) {
  const hidden = isPublicDetailsHidden(record)
  const city = formatCity(record?.city)

  if (hidden) {
    return {
      detailsHidden: true,
      isPrivate: false,
      isFestival: false,
      festivalName: null,
      displayPlace: city === '-' ? '' : city,
      displaySubtitle: null,
      city,
      showCityColumn: false,
      startTime: null,
      ticketUrl: null,
    }
  }

  if (record?.eventType === 'private') {
    return {
      detailsHidden: false,
      isPrivate: true,
      isFestival: false,
      festivalName: null,
      displayPlace: privateLabel,
      displaySubtitle: null,
      city,
      showCityColumn: city !== '-',
      startTime: null,
      ticketUrl: null,
    }
  }

  const venueName = formatVenueName(record?.venue, record?.clubName)
  const location = text(record?.location)
  const festivalName = text(record?.festivalName) || null
  const startTime = normalizeStartTime(record?.startTime) || null
  const ticketUrl = text(record?.ticketUrl) || null
  const cityLabel = city === '-' ? '' : city
  const locationLabel =
    location &&
    location.toLowerCase() !== venueName.toLowerCase() &&
    location.toLowerCase() !== cityLabel.toLowerCase()
      ? location
      : ''
  const hasVenue = Boolean(venueName || locationLabel)

  let displayPlace = venueName || locationLabel
  let displaySubtitle = venueName && locationLabel ? locationLabel : null
  if (festivalName) {
    displayPlace = festivalName
    const detail = [venueName, locationLabel].filter(Boolean).join(' · ')
    displaySubtitle = detail || null
  } else if (!displayPlace) {
    displayPlace = cityLabel
  }

  return {
    detailsHidden: false,
    isPrivate: false,
    isFestival: Boolean(festivalName),
    festivalName,
    displayPlace,
    displaySubtitle,
    city,
    showCityColumn: hasVenue && city !== '-',
    startTime,
    ticketUrl,
  }
}
