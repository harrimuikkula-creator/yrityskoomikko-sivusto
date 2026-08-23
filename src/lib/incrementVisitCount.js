import { doc, runTransaction } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Increment public site visit counter in Firestore (siteStats/visits).
 * @returns {Promise<number|null>}
 */
export async function incrementClientVisitCount() {
  if (!db) return null

  const ref = doc(db, 'siteStats', 'visits')
  try {
    return await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref)
      const current = snap.exists() ? Number(snap.data().totalVisits) : 0
      const next = (Number.isFinite(current) ? current : 0) + 1
      transaction.set(ref, { totalVisits: next }, { merge: true })
      return next
    })
  } catch (error) {
    console.warn('Client visit counter failed.', error)
    return null
  }
}
