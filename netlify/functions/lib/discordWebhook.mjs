/**
 * Server-only Discord webhook helpers.
 * Prefer non-VITE env vars so the URL is never baked into the browser bundle.
 */
export function getDiscordWebhookUrl() {
  return (
    process.env.DISCORD_WEBHOOK_URL ||
    process.env.GIG_SYNC_ALERT_WEBHOOK_URL ||
    process.env.VITE_GIG_SYNC_ALERT_WEBHOOK_URL ||
    ''
  ).trim()
}

export function getDiscordMention() {
  return (
    process.env.DISCORD_MENTION ||
    process.env.GIG_SYNC_ALERT_MENTION ||
    process.env.VITE_GIG_SYNC_ALERT_MENTION ||
    ''
  ).trim()
}

/**
 * @param {{
 *   username?: string,
 *   content: string,
 *   title: string,
 *   color?: number,
 *   fields?: Array<{ name: string, value: string, inline?: boolean }>,
 *   footerText?: string,
 * }} options
 */
export async function postDiscordEmbed({
  username = 'Sivuston valvonta',
  content,
  title,
  color = 15158332,
  fields = [],
  footerText = 'yrityskoomikko-sivusto',
}) {
  const webhookUrl = getDiscordWebhookUrl()
  if (!webhookUrl) {
    console.warn('discord: webhook URL not configured')
    return false
  }

  const mention = getDiscordMention()
  const timestamp = new Date().toISOString()
  const payload = {
    username: String(username).slice(0, 80),
    content: `${mention ? `${mention} ` : ''}${String(content).slice(0, 1800)}`,
    allowed_mentions: { parse: ['users', 'roles', 'everyone'] },
    embeds: [
      {
        title: String(title).slice(0, 256),
        color: Number.isFinite(color) ? color : 15158332,
        fields: fields.slice(0, 20).map((field) => ({
          name: String(field.name ?? '—').slice(0, 256),
          value: String(field.value ?? '—').slice(0, 1024),
          inline: Boolean(field.inline),
        })),
        footer: { text: String(footerText).slice(0, 200) },
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
    console.error('discord: webhook failed', response.status)
  }
  return response.ok
}
