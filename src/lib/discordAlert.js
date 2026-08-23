const DEFAULT_WEBHOOK_URL = import.meta.env.VITE_GIG_SYNC_ALERT_WEBHOOK_URL
const DEFAULT_MENTION = (import.meta.env.VITE_GIG_SYNC_ALERT_MENTION || '').trim()

/**
 * Send a Discord webhook embed alert.
 * @returns {Promise<boolean>} true if Discord accepted the message
 */
export async function sendDiscordAlert({
  title,
  content,
  fields = [],
  color = 15158332,
  username = 'Sivuston valvonta',
  webhookUrl = DEFAULT_WEBHOOK_URL,
  mention = DEFAULT_MENTION,
  cooldownKey = null,
  cooldownMs = 0,
}) {
  if (!webhookUrl || typeof window === 'undefined') return false

  try {
    if (cooldownKey && cooldownMs > 0) {
      const lastAlertAt = Number(window.localStorage.getItem(cooldownKey) ?? 0)
      const now = Date.now()
      if (Number.isFinite(lastAlertAt) && now - lastAlertAt < cooldownMs) {
        return false
      }
    }

    const timestamp = new Date().toISOString()
    const mentionPrefix = mention ? `${mention} ` : ''
    const payload = {
      username,
      content: `${mentionPrefix}${content}`,
      allowed_mentions: {
        parse: ['users', 'roles', 'everyone'],
      },
      embeds: [
        {
          title,
          color,
          fields: fields.map((field) => ({
            name: field.name,
            value: String(field.value ?? '-').slice(0, 1024),
            inline: Boolean(field.inline),
          })),
          footer: { text: 'yrityskoomikko-sivusto' },
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
      throw new Error(`Discord webhook failed with status ${response.status}`)
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
