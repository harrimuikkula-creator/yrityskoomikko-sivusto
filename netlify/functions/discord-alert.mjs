import { getDiscordWebhookUrl, postDiscordEmbed } from './lib/discordWebhook.mjs'

const ALLOWED_TYPES = new Set(['gig-sync', 'contact'])
const GIG_SYNC_COOLDOWN_MS = 12 * 60 * 60 * 1000

/** Best-effort cooldown across warm function instances. */
const gigSyncLastAlertAt = new Map()

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

function sanitizeFields(fields) {
  if (!Array.isArray(fields)) return []
  return fields.slice(0, 20).map((field) => ({
    name: String(field?.name ?? '—').slice(0, 256),
    value: String(field?.value ?? '—').slice(0, 1024),
    inline: Boolean(field?.inline),
  }))
}

function parseBody(raw) {
  try {
    return JSON.parse(raw || '{}')
  } catch {
    return null
  }
}

export async function handler(event) {
  if (event.httpMethod === 'OPTIONS') {
    return json(204, {})
  }
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  if (!getDiscordWebhookUrl()) {
    return json(503, { error: 'Discord webhook not configured' })
  }

  const parsed = parseBody(event.body)
  if (!parsed || typeof parsed !== 'object') {
    return json(400, { error: 'Invalid JSON body' })
  }

  const type = String(parsed.type || '').trim()
  if (!ALLOWED_TYPES.has(type)) {
    return json(400, { error: 'Unsupported alert type' })
  }

  if (type === 'gig-sync') {
    const host = String(parsed.host || 'unknown').slice(0, 200)
    const last = gigSyncLastAlertAt.get(host) || 0
    const now = Date.now()
    if (now - last < GIG_SYNC_COOLDOWN_MS) {
      return json(200, { ok: true, skipped: 'cooldown' })
    }
    gigSyncLastAlertAt.set(host, now)
  }

  const title = String(parsed.title || 'Ilmoitus').slice(0, 256)
  const content = String(parsed.content || 'Ilmoitus').slice(0, 1800)
  const username = String(
    parsed.username || (type === 'contact' ? 'Yhteydenottolomake' : 'Sivuston valvonta'),
  ).slice(0, 80)
  const color = Number(parsed.color)
  const fields = sanitizeFields(parsed.fields)

  try {
    const ok = await postDiscordEmbed({
      username,
      title,
      content,
      color: Number.isFinite(color) ? color : type === 'contact' ? 5763719 : 15158332,
      fields,
      footerText: `yrityskoomikko-sivusto • ${type}`,
    })

    if (!ok) {
      return json(502, { error: 'Discord webhook failed' })
    }

    return json(200, { ok: true })
  } catch (error) {
    console.error('discord-alert failed', error)
    return json(500, { error: error?.message || 'Failed to send alert' })
  }
}
