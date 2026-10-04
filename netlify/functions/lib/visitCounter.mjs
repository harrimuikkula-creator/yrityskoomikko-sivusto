import { nextVisitStats, parseVisitStats } from './visitStats.mjs'

/**
 * Increment persistent visit counter and city/country totals.
 * Tries Netlify Blobs first, then Firestore REST (no service account),
 * then Firestore Admin if FIREBASE_SERVICE_ACCOUNT_JSON is configured.
 * @returns {Promise<{ totalVisits: number, countries: object, cities: object }|null>}
 */

export async function incrementVisitCount(place = {}) {
  const viaBlobs = await incrementViaBlobs(place)
  if (viaBlobs !== null) return viaBlobs

  const viaRest = await incrementViaFirestoreRest(place)
  if (viaRest !== null) return viaRest

  const viaFirestore = await incrementViaFirestore(place)
  if (viaFirestore !== null) return viaFirestore

  return null
}

async function incrementViaFirestoreRest(place) {
  const apiKey = (
    process.env.VITE_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    ''
  ).trim()
  const projectId = (
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID ||
    ''
  ).trim()

  if (!apiKey || !projectId) return null

  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`
  const docUrl = `${base}/siteStats/visits?key=${encodeURIComponent(apiKey)}`

  try {
    const readResponse = await fetch(docUrl)
    if (readResponse.status === 404) {
      const created = nextVisitStats(parseVisitStats(null, 0), place)
      const createResponse = await fetch(
        `${base}/siteStats?documentId=visits&key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: firestoreStatsFields(created),
          }),
        },
      )
      if (!createResponse.ok) {
        console.warn('visit counter: Firestore REST create failed', createResponse.status)
        return null
      }
      return created
    }

    if (!readResponse.ok) {
      console.warn('visit counter: Firestore REST read failed', readResponse.status)
      return null
    }

    const doc = await readResponse.json()
    const current = Number(doc?.fields?.totalVisits?.integerValue || '0')
    const stored = parseVisitStats(doc?.fields?.breakdown?.stringValue, current)
    stored.totalVisits = Number.isFinite(current) ? current : stored.totalVisits
    const next = nextVisitStats(stored, place)

    const patchResponse = await fetch(
      `${docUrl}&updateMask.fieldPaths=totalVisits&updateMask.fieldPaths=breakdown`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: firestoreStatsFields(next),
        }),
      },
    )

    if (!patchResponse.ok) {
      console.warn('visit counter: Firestore REST patch failed', patchResponse.status)
      return null
    }

    return next
  } catch (error) {
    console.warn('visit counter: Firestore REST unavailable', error?.message || error)
    return null
  }
}

async function incrementViaBlobs(place) {
  try {
    const { getStore } = await import('@netlify/blobs')
    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID
    const token = process.env.NETLIFY_BLOB_READ_WRITE_TOKEN

    const store =
      siteID && token
        ? getStore({ name: 'site-stats', siteID, token })
        : getStore('site-stats')

    const stored = await store.get('visit-stats', { type: 'text' })
    const legacyTotal = Number((await store.get('total-visits', { type: 'text' })) || '0')
    const previous = parseVisitStats(stored, legacyTotal)
    if (!stored && Number.isFinite(legacyTotal)) previous.totalVisits = legacyTotal
    const next = nextVisitStats(previous, place)
    await store.set('visit-stats', JSON.stringify(next))
    await store.set('total-visits', String(next.totalVisits))
    return next
  } catch (error) {
    console.warn('visit counter: Netlify Blobs unavailable', error?.message || error)
    return null
  }
}

async function incrementViaFirestore(place) {
  try {
    const { incrementSiteVisitCount } = await import('./firebaseAdmin.mjs')
    return await incrementSiteVisitCount(place)
  } catch (error) {
    console.warn('visit counter: Firestore unavailable', error?.message || error)
    return null
  }
}

function firestoreStatsFields(stats) {
  return {
    totalVisits: { integerValue: String(stats.totalVisits) },
    breakdown: {
      stringValue: JSON.stringify({
        countries: stats.countries,
        cities: stats.cities,
      }),
    },
  }
}
