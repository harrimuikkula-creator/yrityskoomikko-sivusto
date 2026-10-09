/**
 * Short-window visit alert dedupe by client IP.
 * Suppresses bot→spoofed-human twin alerts from the same crawler infra.
 */

const MEMORY_TTL_MS = 45 * 60 * 1000
const recentByKey = new Map()

function pruneMemory(now = Date.now()) {
  for (const [key, entry] of recentByKey) {
    if (!entry?.expiresAt || entry.expiresAt <= now) recentByKey.delete(key)
  }
}

function normalizeIp(ip) {
  return String(ip || '').trim().slice(0, 80)
}

function ipv4Slash24(ip) {
  const raw = normalizeIp(ip)
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(raw)) return ''
  const parts = raw.split('.')
  return `${parts[0]}.${parts[1]}.${parts[2]}.0/24`
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

/**
 * @returns {Promise<{ skipDiscord: boolean, skipCount: boolean, reason: string|null }>}
 */
export async function evaluateVisitDedupe({ ip, bot }) {
  const exact = normalizeIp(ip)
  if (!exact || exact === 'unknown') {
    return { skipDiscord: false, skipCount: false, reason: null }
  }

  const store = await getDedupeStore()
  const subnet = ipv4Slash24(exact)
  const now = Date.now()

  if (bot) {
    const entry = {
      botSeenAt: now,
      humanAlertedAt: 0,
      expiresAt: now + MEMORY_TTL_MS,
    }
    await writeEntry(store, exact, entry)
    if (subnet) await writeEntry(store, subnet, entry)
    return { skipDiscord: true, skipCount: true, reason: 'bot' }
  }

  const exactEntry = await readEntry(store, exact)
  const subnetEntry = subnet ? await readEntry(store, subnet) : null

  if (exactEntry?.botSeenAt && now - exactEntry.botSeenAt < MEMORY_TTL_MS) {
    return { skipDiscord: true, skipCount: true, reason: 'bot-twin' }
  }
  if (subnetEntry?.botSeenAt && now - subnetEntry.botSeenAt < MEMORY_TTL_MS) {
    return { skipDiscord: true, skipCount: true, reason: 'bot-twin' }
  }

  if (exactEntry?.humanAlertedAt && now - exactEntry.humanAlertedAt < MEMORY_TTL_MS) {
    return { skipDiscord: true, skipCount: true, reason: 'duplicate-ip' }
  }

  return { skipDiscord: false, skipCount: false, reason: null }
}

export async function markHumanVisitAlerted(ip) {
  const exact = normalizeIp(ip)
  if (!exact || exact === 'unknown') return

  const store = await getDedupeStore()
  const existing = (await readEntry(store, exact)) || {}
  const now = Date.now()
  await writeEntry(store, exact, {
    botSeenAt: existing.botSeenAt || 0,
    humanAlertedAt: now,
    expiresAt: now + MEMORY_TTL_MS,
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
