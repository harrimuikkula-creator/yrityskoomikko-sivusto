import { incrementVisitCount } from './lib/visitCounter.mjs'

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

function getWebhookUrl() {
  return (
    process.env.VITE_GIG_SYNC_ALERT_WEBHOOK_URL ||
    process.env.GIG_SYNC_ALERT_WEBHOOK_URL ||
    ''
  ).trim()
}

function getMention() {
  return (
    process.env.VITE_GIG_SYNC_ALERT_MENTION ||
    process.env.GIG_SYNC_ALERT_MENTION ||
    ''
  ).trim()
}

async function sendDiscordVisitAlert({ totalVisits, pageUrl, referrer, userAgent }) {
  const webhookUrl = getWebhookUrl()
  if (!webhookUrl) {
    console.warn('record-visit: webhook URL not configured')
    return false
  }

  const timestamp = new Date().toISOString()
  const mention = getMention()
  const countLabel =
    totalVisits === null ? '— (laskuri ei käytössä)' : String(totalVisits)

  const payload = {
    username: 'Kävijäseuranta',
    content: `${mention ? `${mention} ` : ''}👀 Uusi kävijä sivustolla`,
    allowed_mentions: { parse: ['users', 'roles', 'everyone'] },
    embeds: [
      {
        title: 'Sivustokäynti',
        color: 5793266,
        fields: [
          { name: 'Kävijöitä yhteensä', value: countLabel, inline: true },
          { name: 'Aika', value: timestamp, inline: true },
          { name: 'Sivu', value: pageUrl || '-' },
          { name: 'Referrer', value: referrer || 'suora / tuntematon' },
          { name: 'Laite', value: (userAgent || '-').slice(0, 180) },
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

  if (!response.ok) {
    console.error('record-visit: Discord webhook failed', response.status)
  }
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

    if (!discordOk && !getWebhookUrl()) {
      return json(503, { error: 'Discord webhook not configured' })
    }

    return json(200, { ok: true, totalVisits, discord: discordOk })
  } catch (error) {
    console.error('record-visit failed', error)
    return json(500, { error: error?.message || 'Failed to record visit' })
  }
}
