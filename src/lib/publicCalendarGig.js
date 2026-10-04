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
  const hidden = isPublicDetailsHidden(data)
  const record = {
    id: text(id || data.id),
    date: normalizeGigDate(data.date),
    city: text(data.city),
    hidePublicDetails: hidden,
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

export function buildPublicGigView(record) {
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
