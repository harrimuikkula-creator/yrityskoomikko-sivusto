import { incrementVisitCount } from './lib/visitCounter.mjs'
import {
  evaluateVisitDedupe,
  markHumanVisitAlerted,
  readClientIp,
} from './lib/visitDedupe.mjs'
import {
  getDiscordWebhookUrl,
  postDiscordEmbed,
} from './lib/discordWebhook.mjs'
import { buildVisitAlert, classifyVisitor, readGeo, visitPlace } from './lib/visitSummary.mjs'

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
  const languageCount = Number(parsed.languageCount)

  return {
    pageUrl: String(parsed.pageUrl || '').slice(0, 500),
    referrer: String(parsed.referrer || '').slice(0, 500),
    siteLanguage,
    screen,
    returning: parsed.returning === true,
    automation: parsed.automation === true,
    languageCount: Number.isFinite(languageCount) ? languageCount : null,
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
    const acceptLanguage = header(headers, 'accept-language')
    const visitor = classifyVisitor({
      userAgent,
      automation: client.automation,
      screen: client.screen,
      hints: {
        webdriver: client.automation === true,
      },
    })

    const geo = readGeo(context, headers)
    const ip = readClientIp(req, context, headers)
    // Only confident bots poison the IP twin-suppress window.
    const dedupe = await evaluateVisitDedupe({ ip, bot: visitor.bot && !visitor.uncertain })

    // Bots, uncertain beacons, and bot→Chrome twin hits: no Discord / no counter.
    if (visitor.bot || visitor.uncertain || dedupe.skipCount) {
      return json(200, {
        ok: true,
        totalVisits: null,
        bot: visitor.bot,
        uncertain: visitor.uncertain,
        discord: false,
        skipped: dedupe.reason || (visitor.bot ? 'bot' : visitor.uncertain ? 'uncertain' : 'dedupe'),
        label: visitor.label || null,
      })
    }

    let stats = null
    try {
      stats = await incrementVisitCount(visitPlace(geo))
    } catch (counterError) {
      console.warn('record-visit: visit counter failed', counterError)
    }

    if (dedupe.skipDiscord) {
      return json(200, {
        ok: true,
        totalVisits: stats?.totalVisits ?? null,
        bot: false,
        discord: false,
        skipped: dedupe.reason,
      })
    }

    const alert = buildVisitAlert({
      totalVisits: stats?.totalVisits ?? null,
      countries: stats?.countries ?? null,
      cities: stats?.cities ?? null,
      pageUrl: client.pageUrl,
      referrer: client.referrer,
      siteLanguage: client.siteLanguage,
      screen: client.screen,
      returning: client.returning,
      userAgent,
      automation: client.automation,
      acceptLanguage,
      headers,
      geo,
    })

    const discordOk = await postDiscordEmbed(alert)
    if (discordOk) {
      await markHumanVisitAlerted(ip)
    }

    if (!discordOk && !getDiscordWebhookUrl()) {
      return json(503, { error: 'Discord webhook not configured' })
    }

    return json(200, {
      ok: true,
      totalVisits: stats?.totalVisits ?? null,
      bot: false,
      discord: discordOk,
    })
  } catch (error) {
    console.error('record-visit failed', error)
    return json(500, { error: error?.message || 'Failed to record visit' })
  }
}
