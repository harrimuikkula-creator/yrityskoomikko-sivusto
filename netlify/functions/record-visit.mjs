import { incrementVisitCount } from './lib/visitCounter.mjs'
import {
  getDiscordWebhookUrl,
  postDiscordEmbed,
} from './lib/discordWebhook.mjs'

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
  const timestamp = new Date().toISOString()
  const countLabel =
    totalVisits === null ? '— (laskuri ei käytössä)' : String(totalVisits)

  return postDiscordEmbed({
    username: 'Kävijäseuranta',
    content: '👀 Uusi kävijä sivustolla',
    title: 'Sivustokäynti',
    color: 5793266,
    fields: [
      { name: 'Kävijöitä yhteensä', value: countLabel, inline: true },
      { name: 'Aika', value: timestamp, inline: true },
      { name: 'Sivu', value: pageUrl || '-' },
      { name: 'Referrer', value: referrer || 'suora / tuntematon' },
      { name: 'Laite', value: (userAgent || '-').slice(0, 180) },
    ],
    footerText: 'yrityskoomikko-sivusto • visits',
  })
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

    let totalVisits = null
    try {
      totalVisits = await incrementVisitCount()
    } catch (counterError) {
      console.warn('record-visit: visit counter failed', counterError)
    }

    const userAgent = event.headers['user-agent'] || event.headers['User-Agent'] || ''
    const discordOk = await sendDiscordVisitAlert({
      totalVisits,
      pageUrl,
      referrer,
      userAgent,
    })

    if (!discordOk && !getDiscordWebhookUrl()) {
      return json(503, { error: 'Discord webhook not configured' })
    }

    return json(200, { ok: true, totalVisits, discord: discordOk })
  } catch (error) {
    console.error('record-visit failed', error)
    return json(500, { error: error?.message || 'Failed to record visit' })
  }
}
