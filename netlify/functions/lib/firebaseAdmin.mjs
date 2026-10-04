import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { nextVisitStats, parseVisitStats } from './visitStats.mjs'

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

export async function incrementSiteVisitCount(place = {}) {
  const db = getAdminDb()
  if (!db) return null

  const ref = db.doc('siteStats/visits')
  const snap = await ref.get()
  const data = snap.data() || {}
  const previous = parseVisitStats(data.breakdown, data.totalVisits)
  if (Number.isFinite(Number(data.totalVisits))) previous.totalVisits = Number(data.totalVisits)
  const next = nextVisitStats(previous, place)
  await ref.set(
    {
      totalVisits: next.totalVisits,
      breakdown: JSON.stringify({
        countries: next.countries,
        cities: next.cities,
      }),
    },
    { merge: true },
  )
  return next
}
