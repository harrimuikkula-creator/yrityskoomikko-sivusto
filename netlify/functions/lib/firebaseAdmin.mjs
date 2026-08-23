import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON')
  }
}

export function getAdminDb() {
  const serviceAccount = getServiceAccount()
  if (!serviceAccount) return null

  if (!getApps().length) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId:
        serviceAccount.project_id ||
        process.env.VITE_FIREBASE_PROJECT_ID ||
        process.env.FIREBASE_PROJECT_ID,
    })
  }

  return getFirestore()
}

export async function incrementSiteVisitCount() {
  const db = getAdminDb()
  if (!db) return null

  const ref = db.doc('siteStats/visits')
  await ref.set({ totalVisits: FieldValue.increment(1) }, { merge: true })
  const snap = await ref.get()
  const totalVisits = snap.data()?.totalVisits
  return Number.isFinite(totalVisits) ? totalVisits : null
}
