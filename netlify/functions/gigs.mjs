import { getAdminDb } from './lib/firebaseAdmin.mjs'
import { PUBLIC_CALENDAR_COLLECTION, toPublicGigRecord } from '../../src/lib/publicCalendarGig.js'

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

    const snapshot = await db
      .collection(PUBLIC_CALENDAR_COLLECTION)
      .where('ownerId', '==', ownerId)
      .get()

    const gigs = snapshot.docs
      .map((doc) => toPublicGigRecord(doc.id, doc.data()))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))

    return json(200, { gigs, source: 'publicCalendarGigs', count: gigs.length })
  } catch (error) {
    console.error('gigs function failed', error)
    return json(500, {
      error: error?.message || 'Failed to load gigs',
    })
  }
}
