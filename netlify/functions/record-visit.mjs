import { incrementVisitCount } from './lib/visitCounter.mjs'
import {
  getDiscordWebhookUrl,
  postDiscordEmbed,
} from './lib/discordWebhook.mjs'
import { buildVisitAlert, classifyVisitor, readGeo } from './lib/visitSummary.mjs'

function json(statusCode, body) {
  return new Response(JSON.stringify(body), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

function headerMap(headers) {
  const map = {}
  headers.forEach((value, key) => {
    map[key.toLowerCase()] = value
  })
  return map
}

function header(headers, name) {
  return headers[name] || headers[name.toLowerCase()] || ''
}

function readClient(body) {
  let parsed = {}
  try {
    parsed = JSON.parse(body || '{}')
  } catch {
    parsed = {}
  }

  const siteLanguage = parsed.siteLanguage === 'en' ? 'en' : parsed.siteLanguage === 'fi' ? 'fi' : ''
  const screen = String(parsed.screen || '').slice(0, 20)

  return {
    pageUrl: String(parsed.pageUrl || '').slice(0, 500),
    referrer: String(parsed.referrer || '').slice(0, 500),
    siteLanguage,
    screen,
    returning: parsed.returning === true,
    automation: parsed.automation === true,
  }
}

export default async (req, context) => {
  if (req.method === 'OPTIONS') {
    return json(204, {})
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  try {
    const body = await req.text()
    const client = readClient(body)
    const headers = headerMap(req.headers)
    const userAgent = header(headers, 'user-agent')
    const visitor = classifyVisitor({
      userAgent,
      automation: client.automation,
    })

    let totalVisits = null
    if (!visitor.bot) {
      try {
        totalVisits = await incrementVisitCount()
      } catch (counterError) {
        console.warn('record-visit: visit counter failed', counterError)
      }
    }

    const alert = buildVisitAlert({
      totalVisits,
      pageUrl: client.pageUrl,
      referrer: client.referrer,
      siteLanguage: client.siteLanguage,
      screen: client.screen,
      returning: client.returning,
      userAgent,
      automation: client.automation,
      acceptLanguage: header(headers, 'accept-language'),
      headers,
      geo: readGeo(context, headers),
    })

    const discordOk = await postDiscordEmbed(alert)

    if (!discordOk && !getDiscordWebhookUrl()) {
      return json(503, { error: 'Discord webhook not configured' })
    }

    return json(200, { ok: true, totalVisits, bot: visitor.bot, discord: discordOk })
  } catch (error) {
    console.error('record-visit failed', error)
    return json(500, { error: error?.message || 'Failed to record visit' })
  }
}
