import { getAdminDb } from './lib/firebaseAdmin.mjs'

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=60',
    },
    body: JSON.stringify(body),
  }
}

function serializeDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString()
  }
  if (value instanceof Date) return value.toISOString()
  return value
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
      .collection('gigs')
      .where('ownerId', '==', ownerId)
      .orderBy('date', 'asc')
      .get()

    const gigs = snapshot.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        date: serializeDate(data.date),
        eventType: data.eventType ?? 'public',
        festivalName: data.festivalName ?? '',
        venue: data.venue ?? '',
        clubName: data.clubName ?? '',
        city: data.city ?? '',
        ticketUrl: data.ticketUrl ?? '',
      }
    })

    return json(200, { gigs, source: 'admin', count: gigs.length })
  } catch (error) {
    console.error('gigs function failed', error)
    return json(500, {
      error: error?.message || 'Failed to load gigs',
    })
  }
}
