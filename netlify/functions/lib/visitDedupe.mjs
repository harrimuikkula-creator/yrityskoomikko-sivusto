/**
 * Short-window visit alert dedupe by client IP.
 * Suppresses rapid duplicate human alerts. Bot→spoofed-human twins are only
 * suppressed for thin beacons — a normal browser visit always gets through and
 * clears a prior false bot mark on that IP.
 */

// Short window: block only rapid double-loads / twin tabs, not retests minutes later.
const HUMAN_DEDUP_MS = 3 * 60 * 1000
const BOT_TWIN_MS = 10 * 60 * 1000
const recentByKey = new Map()

function pruneMemory(now = Date.now()) {
  for (const [key, entry] of recentByKey) {
    if (!entry?.expiresAt || entry.expiresAt <= now) recentByKey.delete(key)
  }
}

function normalizeIp(ip) {
  return String(ip || '').trim().slice(0, 80)
}

async function getDedupeStore() {
  try {
    const { getStore } = await import('@netlify/blobs')
    const siteID = process.env.SITE_ID || process.env.NETLIFY_SITE_ID
    const token = process.env.NETLIFY_BLOB_READ_WRITE_TOKEN
    return siteID && token
      ? getStore({ name: 'visit-dedupe', siteID, token })
      : getStore('visit-dedupe')
  } catch {
    return null
  }
}

async function readBlobEntry(store, key) {
  if (!store || !key) return null
  try {
    const raw = await store.get(`ip:${encodeURIComponent(key)}`, { type: 'text' })
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) return null
    return parsed
  } catch {
    return null
  }
}

async function writeBlobEntry(store, key, entry) {
  if (!store || !key) return
  try {
    await store.set(`ip:${encodeURIComponent(key)}`, JSON.stringify(entry))
  } catch (error) {
    console.warn('visit dedupe: blob write failed', error?.message || error)
  }
}

function memoryGet(key) {
  pruneMemory()
  const entry = recentByKey.get(key)
  if (!entry || entry.expiresAt <= Date.now()) {
    recentByKey.delete(key)
    return null
  }
  return entry
}

function memorySet(key, entry) {
  pruneMemory()
  recentByKey.set(key, entry)
}

async function readEntry(store, key) {
  if (!key) return null
  return memoryGet(key) || (await readBlobEntry(store, key))
}

async function writeEntry(store, key, entry) {
  if (!key) return
  memorySet(key, entry)
  await writeBlobEntry(store, key, entry)
}

/** Normal JS beacon from a real browser — must not be silenced by a prior bot mark. */
export function looksLikeBrowserVisit({ userAgent = '', screen = '', automation = false } = {}) {
  if (automation) return false
  if (!/Mozilla\/\d/i.test(String(userAgent || ''))) return false
  const match = /^(\d{2,5})x(\d{2,5})$/.exec(String(screen || '').trim())
  if (!match) return false
  const width = Number(match[1])
  const height = Number(match[2])
  return width >= 200 && height >= 200
}

/**
 * @returns {Promise<{ skipDiscord: boolean, skipCount: boolean, reason: string|null }>}
 */
export async function evaluateVisitDedupe({ ip, bot, trustHuman = false }) {
  const exact = normalizeIp(ip)
  if (!exact || exact === 'unknown') {
    return { skipDiscord: false, skipCount: false, reason: null }
  }

  const store = await getDedupeStore()
  const now = Date.now()

  if (bot) {
    const entry = {
      botSeenAt: now,
      humanAlertedAt: 0,
      expiresAt: now + BOT_TWIN_MS,
    }
    await writeEntry(store, exact, entry)
    return { skipDiscord: true, skipCount: true, reason: 'bot' }
  }

  const exactEntry = await readEntry(store, exact)

  // Prior false bot marks must not block a normal browser visit.
  if (
    !trustHuman &&
    exactEntry?.botSeenAt &&
    now - exactEntry.botSeenAt < BOT_TWIN_MS
  ) {
    return { skipDiscord: true, skipCount: true, reason: 'bot-twin' }
  }

  if (exactEntry?.humanAlertedAt && now - exactEntry.humanAlertedAt < HUMAN_DEDUP_MS) {
    return { skipDiscord: true, skipCount: true, reason: 'duplicate-ip' }
  }

  return { skipDiscord: false, skipCount: false, reason: null }
}

export async function markHumanVisitAlerted(ip) {
  const exact = normalizeIp(ip)
  if (!exact || exact === 'unknown') return

  const store = await getDedupeStore()
  const now = Date.now()
  // Clear botSeenAt so a recovered false-positive IP is fully unblocked.
  await writeEntry(store, exact, {
    botSeenAt: 0,
    humanAlertedAt: now,
    expiresAt: now + HUMAN_DEDUP_MS,
  })
}

export function readClientIp(req, context, headers = {}) {
  const fromContext = String(context?.ip || '').trim()
  if (fromContext) return fromContext

  const nf = String(headers['x-nf-client-connection-ip'] || '').trim()
  if (nf) return nf

  const forwarded = String(headers['x-forwarded-for'] || '')
    .split(',')[0]
    .trim()
  if (forwarded) return forwarded

  const realIp = String(headers['x-real-ip'] || '').trim()
  return realIp || ''
}
