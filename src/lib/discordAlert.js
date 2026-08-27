/**
 * Send a Discord alert via Netlify function (webhook stays server-side).
 * @returns {Promise<boolean>} true if Discord accepted the message
 */
export async function sendDiscordAlert({
  type = 'generic',
  title,
  content,
  fields = [],
  color = 15158332,
  username = 'Sivuston valvonta',
  cooldownKey = null,
  cooldownMs = 0,
}) {
  if (typeof window === 'undefined') return false

  try {
    if (cooldownKey && cooldownMs > 0) {
      const lastAlertAt = Number(window.localStorage.getItem(cooldownKey) ?? 0)
      const now = Date.now()
      if (Number.isFinite(lastAlertAt) && now - lastAlertAt < cooldownMs) {
        return false
      }
    }

    const response = await fetch('/.netlify/functions/discord-alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        title,
        content,
        fields,
        color,
        username,
        host: window.location.hostname || 'unknown',
      }),
      keepalive: true,
    })

    if (!response.ok) {
      throw new Error(`Discord alert function failed with status ${response.status}`)
    }

    const payload = await response.json().catch(() => ({}))
    if (payload?.skipped === 'cooldown') {
      return false
    }

    if (cooldownKey) {
      window.localStorage.setItem(cooldownKey, String(Date.now()))
    }
    return true
  } catch (error) {
    console.warn('Discord alert failed.', error)
    return false
  }
}
