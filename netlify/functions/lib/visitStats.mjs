const UNKNOWN_COUNTRY = 'Ei tiedossa'
const UNKNOWN_CITY = 'Ei kaupunkia'

export function nextVisitStats(previous, place = {}) {
  const totalVisits = (Number.isFinite(Number(previous?.totalVisits)) ? Number(previous.totalVisits) : 0) + 1
  const countries = sanitizeCounts(previous?.countries)
  const cities = sanitizeCounts(previous?.cities)
  const country = label(place.country) || UNKNOWN_COUNTRY
  const city = label(place.city) || UNKNOWN_CITY
  countries[country] = (countries[country] || 0) + 1
  cities[city] = (cities[city] || 0) + 1
  return { totalVisits, countries, cities }
}

export function emptyVisitStats(totalVisits = 0) {
  return {
    totalVisits: Number.isFinite(Number(totalVisits)) ? Number(totalVisits) : 0,
    countries: {},
    cities: {},
  }
}

export function parseVisitStats(raw, fallbackTotal = 0) {
  if (!raw) return emptyVisitStats(fallbackTotal)
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
    const total = Number(parsed?.totalVisits)
    return {
      totalVisits: Number.isFinite(total) ? total : Number(fallbackTotal) || 0,
      countries: sanitizeCounts(parsed?.countries),
      cities: sanitizeCounts(parsed?.cities),
    }
  } catch {
    return emptyVisitStats(fallbackTotal)
  }
}

function sanitizeCounts(counts) {
  if (!counts || typeof counts !== 'object') return {}
  const clean = {}
  for (const [name, count] of Object.entries(counts)) {
    const labelText = label(name)
    const value = Number(count)
    if (!labelText || !Number.isFinite(value) || value <= 0) continue
    clean[labelText] = value
  }
  return clean
}

function label(value) {
  return String(value || '').trim().slice(0, 80)
}
