export async function sendContactEmail({
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

  const preferredDate = date
    ? new Date(date).toLocaleDateString('fi-FI')
    : 'Ei annettu'
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
      email,
      name,
      phone,
      company: company || '—',
      preferred_date: preferredDate,
      message,
    }),
  })

  const data = await response.json()
  if (!response.ok || !data.success) {
    throw new Error(data.message || 'Sähköpostin lähetys epäonnistui')
  }
}
