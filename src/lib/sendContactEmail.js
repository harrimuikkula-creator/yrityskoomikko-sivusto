import { sendDiscordAlert } from './discordAlert'

function formatPreferredDate(date) {
  if (!date) return 'Ei annettu'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return String(date)
  return parsed.toLocaleDateString('fi-FI')
}

function buildContactFields(fields) {
  const preferredDate = formatPreferredDate(fields.date)
  return [
    { name: 'Nimi', value: fields.name || '—', inline: true },
    { name: 'Sähköposti', value: fields.email || '—', inline: true },
    { name: 'Puhelin', value: fields.phone || '—', inline: true },
    { name: 'Yritys', value: fields.company || '—', inline: true },
    { name: 'Toivottu päivä', value: preferredDate, inline: true },
    {
      name: 'Sivu',
      value: typeof window !== 'undefined' ? window.location.href : '-',
    },
    { name: 'Viesti', value: fields.message || '—' },
  ]
}

async function sendViaWeb3Forms({
  name,
  email,
  phone,
  company,
  date,
  message,
}) {
  const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY
  if (!accessKey) {
    throw new Error('WEB3FORMS_NOT_CONFIGURED')
  }

  const preferredDate = formatPreferredDate(date)
  const subject = company
    ? `Keikkakysely: ${company} – ${name}`
    : `Keikkakysely – ${name}`

  const response = await fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      access_key: accessKey,
      subject,
      from_name: name,
      name,
      email,
      replyto: email,
      phone,
      company: company || '—',
      preferred_date: preferredDate,
      message,
      botcheck: '',
    }),
  })

  let data
  try {
    data = await response.json()
  } catch {
    throw new Error(`Web3Forms failed (${response.status})`)
  }

  if (!response.ok || !data?.success) {
    throw new Error(data?.message || `Web3Forms failed (${response.status})`)
  }
}

async function notifyDiscordContact({ fields, emailOk, emailError }) {
  return sendDiscordAlert({
    username: 'Yhteydenottolomake',
    title: emailOk
      ? 'Uusi keikkakysely (sähköposti + Discord)'
      : 'Uusi keikkakysely – Discord-varakanava (sähköposti epäonnistui)',
    content: emailOk
      ? '📩 Uusi keikkakysely'
      : '⚠️ Uusi keikkakysely (sähköposti epäonnistui – viesti tässä)',
    color: emailOk ? 5763719 : 16753920,
    fields: [
      ...(emailOk
        ? []
        : [
            {
              name: 'Sähköpostivirhe',
              value: String(emailError?.message ?? emailError ?? 'unknown'),
            },
          ]),
      ...buildContactFields(fields),
    ],
  })
}

/**
 * Deliver contact inquiry:
 * 1) Try Web3Forms email
 * 2) Always try Discord with full message content
 * Success if either channel works (so leads are never silently lost).
 *
 * @returns {Promise<{ channel: 'web3forms+discord' | 'web3forms' | 'discord-backup' }>}
 */
export async function sendContactEmail(fields) {
  let emailError = null
  let emailOk = false

  try {
    await sendViaWeb3Forms(fields)
    emailOk = true
  } catch (error) {
    emailError = error
    console.warn('Primary contact email failed.', error)
  }

  const discordOk = await notifyDiscordContact({
    fields,
    emailOk,
    emailError,
  })

  if (emailOk && discordOk) return { channel: 'web3forms+discord' }
  if (emailOk) return { channel: 'web3forms' }
  if (discordOk) return { channel: 'discord-backup' }

  if (emailError?.message === 'WEB3FORMS_NOT_CONFIGURED') {
    throw emailError
  }
  throw new Error(emailError?.message || 'CONTACT_DELIVERY_FAILED')
}
