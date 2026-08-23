/**
 * Increment persistent visit counter.
 * Tries Netlify Blobs first, then Firestore REST (no service account),
 * then Firestore Admin if FIREBASE_SERVICE_ACCOUNT_JSON is configured.
 * @returns {Promise<number|null>}
 */
export async function incrementVisitCount() {
  const viaBlobs = await incrementViaBlobs()
  if (viaBlobs !== null) return viaBlobs

  const viaRest = await incrementViaFirestoreRest()
  if (viaRest !== null) return viaRest

  const viaFirestore = await incrementViaFirestore()
  if (viaFirestore !== null) return viaFirestore

  return null
}

async function incrementViaFirestoreRest() {
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
      const createResponse = await fetch(
        `${base}/siteStats?documentId=visits&key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: { totalVisits: { integerValue: '1' } },
          }),
        },
      )
      if (!createResponse.ok) {
        console.warn('visit counter: Firestore REST create failed', createResponse.status)
        return null
      }
      return 1
    }

    if (!readResponse.ok) {
      console.warn('visit counter: Firestore REST read failed', readResponse.status)
      return null
    }

    const doc = await readResponse.json()
    const current = Number(doc?.fields?.totalVisits?.integerValue || '0')
    const next = (Number.isFinite(current) ? current : 0) + 1

    const patchResponse = await fetch(
      `${docUrl}&updateMask.fieldPaths=totalVisits`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: { totalVisits: { integerValue: String(next) } },
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

async function incrementViaBlobs() {
  try {
    const { getStore } = await import('@netlify/blobs')
    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID
    const token = process.env.NETLIFY_BLOB_READ_WRITE_TOKEN

    const store =
      siteID && token
        ? getStore({ name: 'site-stats', siteID, token })
        : getStore('site-stats')

    const previous = Number((await store.get('total-visits', { type: 'text' })) || '0')
    const totalVisits = (Number.isFinite(previous) ? previous : 0) + 1
    await store.set('total-visits', String(totalVisits))
    return totalVisits
  } catch (error) {
    console.warn('visit counter: Netlify Blobs unavailable', error?.message || error)
    return null
  }
}

async function incrementViaFirestore() {
  try {
    const { incrementSiteVisitCount } = await import('./firebaseAdmin.mjs')
    return await incrementSiteVisitCount()
  } catch (error) {
    console.warn('visit counter: Firestore unavailable', error?.message || error)
    return null
  }
}
