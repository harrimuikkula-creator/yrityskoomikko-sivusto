import { getStore } from '@netlify/blobs'

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
    body: JSON.stringify(body),
  }
}

async function sendDiscordVisitAlert({ totalVisits, pageUrl, referrer, userAgent }) {
  const webhookUrl = process.env.VITE_GIG_SYNC_ALERT_WEBHOOK_URL
  if (!webhookUrl) return false

  const timestamp = new Date().toISOString()
  const payload = {
    username: 'Kävijäseuranta',
    content: '👀 Uusi kävijä sivustolla',
    embeds: [
      {
        title: 'Sivustokäynti',
        color: 5793266,
        fields: [
          { name: 'Kävijöitä yhteensä', value: String(totalVisits), inline: true },
          { name: 'Aika', value: timestamp, inline: true },
          { name: 'Sivu', value: pageUrl || '-' },
          { name: 'Referrer', value: referrer || 'suora / tuntematon' },
          {
            name: 'Laite',
            value: (userAgent || '-').slice(0, 180),
          },
        ],
        footer: { text: 'yrityskoomikko-sivusto • visits' },
        timestamp,
      },
    ],
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return response.ok
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {})
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    let pageUrl = ''
    let referrer = ''
    try {
      const parsed = JSON.parse(event.body || '{}')
      pageUrl = String(parsed.pageUrl || '').slice(0, 500)
      referrer = String(parsed.referrer || '').slice(0, 500)
    } catch {
      // ignore malformed body
    }

    const store = getStore('site-stats')
    const previous = Number((await store.get('total-visits', { type: 'text' })) || '0')
    const totalVisits = (Number.isFinite(previous) ? previous : 0) + 1
    await store.set('total-visits', String(totalVisits))

    const userAgent = event.headers['user-agent'] || event.headers['User-Agent'] || ''
    await sendDiscordVisitAlert({
      totalVisits,
      pageUrl,
      referrer,
      userAgent,
    })

    return json(200, { totalVisits })
  } catch (error) {
    console.error('record-visit failed', error)
    return json(500, { error: error?.message || 'Failed to record visit' })
  }
}
