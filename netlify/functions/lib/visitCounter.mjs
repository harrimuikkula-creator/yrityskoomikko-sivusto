/**
 * Increment persistent visit counter.
 * Tries Netlify Blobs first (works on Netlify without extra setup),
 * then Firestore Admin if FIREBASE_SERVICE_ACCOUNT_JSON is configured.
 * @returns {Promise<number|null>}
 */
export async function incrementVisitCount() {
  const viaBlobs = await incrementViaBlobs()
  if (viaBlobs !== null) return viaBlobs

  const viaFirestore = await incrementViaFirestore()
  if (viaFirestore !== null) return viaFirestore

  return null
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
