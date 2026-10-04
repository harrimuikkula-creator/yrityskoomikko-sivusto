import { getAdminDb } from './lib/firebaseAdmin.mjs'
import { PUBLIC_CALENDAR_COLLECTION, mergeGigSources } from '../../src/lib/publicCalendarGig.js'

const GIGS_COLLECTION = 'gigs'

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'no-store',
    },
    body: JSON.stringify(body),
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {})
  }
  if (event.httpMethod !== 'GET') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const db = getAdminDb()
    if (!db) {
      return json(503, {
        error: 'FIREBASE_SERVICE_ACCOUNT_JSON missing',
        hint: 'Add a Firebase service account JSON in Netlify env to serve gigs without client Firestore rules.',
      })
    }

    const ownerId = (
      process.env.VITE_FIREBASE_OWNER_UID ||
      process.env.FIREBASE_OWNER_UID ||
      ''
    ).trim()
    if (!ownerId) {
      return json(500, { error: 'FIREBASE_OWNER_UID / VITE_FIREBASE_OWNER_UID missing' })
    }

    const [fullSnap, publicSnap] = await Promise.all([
      db.collection(GIGS_COLLECTION).where('ownerId', '==', ownerId).get(),
      db.collection(PUBLIC_CALENDAR_COLLECTION).where('ownerId', '==', ownerId).get(),
    ])

    const gigs = mergeGigSources(
      fullSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
      publicSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
    )

    return json(200, { gigs, source: 'gigs+publicCalendarGigs', count: gigs.length })
  } catch (error) {
    console.error('gigs function failed', error)
    return json(500, {
      error: error?.message || 'Failed to load gigs',
    })
  }
}
