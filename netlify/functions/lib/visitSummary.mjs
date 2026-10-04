/**
 * Turn a visit into a short Discord summary.
 * Bot detection uses the request User-Agent and the browser automation flag.
 */

const BOT_PATTERNS = [
  [/googlebot|adsbot-google|mediapartners-google|storebot-google|google-inspectiontool|googleother/i, 'Googlebot'],
  [/bingbot|bingpreview|msnbot/i, 'Bingbot'],
  [/duckduckbot/i, 'DuckDuckBot'],
  [/baiduspider/i, 'Baidu'],
  [/yandexbot|yandeximages/i, 'Yandex'],
  [/applebot/i, 'Applebot'],
  [/petalbot/i, 'PetalBot'],
  [/bytespider/i, 'Bytespider'],
  [/ahrefsbot/i, 'Ahrefs'],
  [/semrushbot/i, 'Semrush'],
  [/mj12bot/i, 'Majestic'],
  [/dotbot/i, 'DotBot'],
  [/rogerbot/i, 'Moz'],
  [/gptbot|chatgpt-user|oai-searchbot/i, 'OpenAI'],
  [/claudebot|anthropic-ai|claude-web/i, 'Anthropic'],
  [/amazonbot/i, 'Amazonbot'],
  [/ccbot/i, 'Common Crawl'],
  [/facebookexternalhit|facebot/i, 'Facebook'],
  [/twitterbot/i, 'Twitter'],
  [/linkedinbot/i, 'LinkedIn'],
  [/slackbot/i, 'Slack'],
  [/discordbot/i, 'Discord'],
  [/^WhatsApp\//i, 'WhatsApp'],
  [/telegrambot/i, 'Telegram'],
  [/pinterestbot/i, 'Pinterest'],
  [/redditbot/i, 'Reddit'],
  [/embedly/i, 'Embedly'],
  [/chrome-lighthouse|pagespeed|gtmetrix|pingdom/i, 'sivunopeustesti'],
  [/headlesschrome|phantomjs|selenium|puppeteer|playwright|cypress/i, 'automaatio'],
  [/\b(wget|curl|python-requests|python-urllib|scrapy|go-http-client|libwww-perl|okhttp|node-fetch|axios\/|httpclient|java\/)\b/i, 'skripti'],
  [/\bbot\b|\bcrawler\b|\bspider\b|\bcrawling\b/i, 'botti'],
]

const LANGUAGE_LABELS = {
  fi: 'suomi',
  en: 'englanti',
  sv: 'ruotsi',
  de: 'saksa',
  et: 'viro',
}

export function classifyVisitor({ userAgent = '', automation = false } = {}) {
  const ua = String(userAgent || '').trim()
  for (const [pattern, label] of BOT_PATTERNS) {
    if (pattern.test(ua)) {
      return { bot: true, uncertain: false, label }
    }
  }
  if (automation) {
    return { bot: true, uncertain: false, label: 'automaatio' }
  }
  if (!ua) {
    return { bot: false, uncertain: true, label: '' }
  }
  return { bot: false, uncertain: false, label: '' }
}

export function describeDevice(userAgent = '', screen = '', headers = {}) {
  const hints = readClientHints(headers)
  const parsed = parseUserAgent(userAgent)
  const browser = hints.browser || parsed.browser
  const os = hints.platform || parsed.os
  const size = normalizeScreen(screen)
  if (!browser && !os && !size) return ''
  const kind = hints.mobile === true ? 'puhelin' : parsed.kind
  return [browser, os, browser || os ? kind : '', size].filter(Boolean).join(' · ')
}

export function formatPlace(geo) {
  const city = String(geo?.city || '').trim()
  const region = String(geo?.subdivision?.name || '').trim()
  const countryName = String(geo?.country?.name || geo?.countryName || '').trim()
  const countryCode = String(geo?.country?.code || geo?.countryCode || '').trim()
  const country = countryNameFromCode(countryCode) || countryName
  const locality = city || region
  const place = [locality, country].filter(Boolean).join(', ')
  return place || 'ei tiedossa'
}

export function formatVisitTime(date = new Date()) {
  return new Intl.DateTimeFormat('fi-FI', {
    timeZone: 'Europe/Helsinki',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function buildVisitAlert({
  totalVisits = null,
  pageUrl = '',
  referrer = '',
  siteLanguage = '',
  screen = '',
  returning = false,
  userAgent = '',
  automation = false,
  acceptLanguage = '',
  headers = {},
  geo = null,
  now = new Date(),
} = {}) {
  const visitor = classifyVisitor({ userAgent, automation })
  const device = describeDevice(userAgent, screen, headers)
  const typeValue = visitor.bot
    ? `**Botti** · ${visitor.label}`
    : visitor.uncertain
      ? '**Epäselvä** · ei selainta'
      : '**Ihminen**'

  const countValue = visitor.bot
    ? 'ei laskettu'
    : totalVisits === null
      ? '— (laskuri ei käytössä)'
      : String(totalVisits)

  return {
    bot: visitor.bot,
    username: 'Kävijäseuranta',
    content: visitor.bot ? '🤖 Botti sivustolla' : returning ? '👀 Palaava kävijä' : '👀 Uusi kävijä sivustolla',
    title: 'Sivustokäynti',
    color: visitor.bot ? 9807270 : 5793266,
    fields: [
      { name: 'Tyyppi', value: typeValue },
      { name: 'Kävijöitä yhteensä', value: countValue, inline: true },
      { name: 'Aika', value: formatVisitTime(now), inline: true },
      { name: 'Sivu', value: formatPage(pageUrl, siteLanguage, acceptLanguage) },
      { name: 'Mistä', value: formatSource(referrer, pageUrl) },
      { name: 'Paikka', value: formatPlace(geo) },
      { name: 'Laite', value: visitor.bot ? [device, visitor.label].filter(Boolean).join(' · ') : device || 'tuntematon' },
      { name: 'Käynti', value: visitor.bot ? '—' : returning ? 'palaava' : 'uusi', inline: true },
    ],
    footerText: 'yrityskoomikko-sivusto • visits',
  }
}

export function readGeo(context, headers = {}) {
  return (
    mergeGeo(
      normalizeGeo(context?.geo),
      decodeGeoHeader(headers),
      countryOnlyGeo(headerValue(headers, 'x-country')),
    ) || null
  )
}

function mergeGeo(...sources) {
  const present = sources.filter(Boolean)
  if (!present.length) return null

  const city = present.map((geo) => geo.city).find(Boolean) || ''
  const country = present.map((geo) => geo.country).find((item) => item?.code || item?.name) || null
  const subdivision = present.map((geo) => geo.subdivision).find((item) => item?.name || item?.code) || null
  if (!city && !country && !subdivision) return null
  return { city, country, subdivision }
}

function decodeGeoHeader(headers) {
  const raw = headerValue(headers, 'x-nf-geo').trim()
  if (!raw) return null
  return parseGeoJson(decodeBase64(raw)) || parseGeoJson(raw)
}

function decodeBase64(value) {
  try {
    return Buffer.from(value, 'base64').toString('utf8')
  } catch {
    return ''
  }
}

function parseGeoJson(value) {
  try {
    const parsed = JSON.parse(value)
    return normalizeGeo(parsed?.geo || parsed)
  } catch {
    return null
  }
}

function countryOnlyGeo(code) {
  const countryCode = String(code || '').trim()
  if (!countryCode) return null
  return { country: { code: countryCode } }
}

function normalizeGeo(geo) {
  if (!geo || typeof geo !== 'object') return null
  const city = String(geo.city || '').trim()
  const countryCode = String(geo.country?.code || geo.countryCode || '').trim()
  const countryName = String(geo.country?.name || geo.countryName || '').trim()
  const regionName = String(geo.subdivision?.name || '').trim()
  const regionCode = String(geo.subdivision?.code || '').trim()
  const country = countryCode || countryName ? { code: countryCode, name: countryName } : null
  const subdivision = regionName || regionCode ? { code: regionCode, name: regionName } : null
  if (!city && !country && !subdivision) return null
  return { city, country, subdivision }
}

function formatPage(pageUrl, siteLanguage, acceptLanguage) {
  let path = '-'
  const raw = String(pageUrl || '').trim()
  if (raw) {
    try {
      const url = new URL(raw)
      path = `${url.pathname || '/'}${url.hash || ''}`
    } catch {
      path = raw.slice(0, 180)
    }
  }

  const site = LANGUAGE_LABELS[siteLanguage] || ''
  const browser = primaryLanguage(acceptLanguage)
  const browserLabel = browser ? `selain ${LANGUAGE_LABELS[browser] || browser}` : ''
  return [path, site, browserLabel].filter(Boolean).join(' · ')
}

function formatSource(referrer, pageUrl) {
  const parts = []
  const campaign = readCampaign(pageUrl)
  if (campaign) parts.push(campaign)

  const raw = String(referrer || '').trim()
  if (raw) {
    try {
      parts.push(new URL(raw).hostname.replace(/^www\./, ''))
    } catch {
      parts.push(raw.slice(0, 120))
    }
  }

  return parts.join(' · ') || 'suora käynti'
}

function readCampaign(pageUrl) {
  try {
    const url = new URL(String(pageUrl || ''))
    const source = url.searchParams.get('utm_source')
    const medium = url.searchParams.get('utm_medium')
    const campaign = url.searchParams.get('utm_campaign')
    const bits = [source, medium].filter(Boolean).join(' / ')
    if (!bits && !campaign) return ''
    return campaign ? `${bits || 'kampanja'} (${campaign})` : bits
  } catch {
    return ''
  }
}

function parseUserAgent(userAgent) {
  const ua = String(userAgent || '')
  if (!ua) return { browser: '', os: '', kind: '' }

  let browser = ''
  if (/Edg\//.test(ua)) browser = 'Edge'
  else if (/OPR\/|Opera/.test(ua)) browser = 'Opera'
  else if (/SamsungBrowser/.test(ua)) browser = 'Samsung Internet'
  else if (/CriOS\//.test(ua)) browser = 'Chrome'
  else if (/FxiOS\/|Firefox\//.test(ua)) browser = 'Firefox'
  else if (/Chrome\//.test(ua)) browser = 'Chrome'
  else if (/Safari\//.test(ua)) browser = 'Safari'

  let os = ''
  if (/iPhone|iPod/.test(ua)) os = 'iPhone'
  else if (/iPad/.test(ua)) os = 'iPad'
  else if (/Android/.test(ua)) os = 'Android'
  else if (/Mac OS X|Macintosh/.test(ua)) os = 'macOS'
  else if (/Windows/.test(ua)) os = 'Windows'
  else if (/CrOS/.test(ua)) os = 'ChromeOS'
  else if (/Linux/.test(ua)) os = 'Linux'

  let kind = 'tietokone'
  if (/iPad/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) kind = 'tabletti'
  else if (/Mobi|iPhone|iPod/.test(ua)) kind = 'puhelin'

  return { browser, os, kind }
}

function readClientHints(headers) {
  const raw = headerValue(headers, 'sec-ch-ua')
  const platform = headerValue(headers, 'sec-ch-ua-platform').replaceAll('"', '')
  const mobileHeader = headerValue(headers, 'sec-ch-ua-mobile')
  const brands = [...raw.matchAll(/"([^"]+)";v="[^"]*"/g)].map((match) => match[1])
  const browser = brands.find((brand) => !/chromium|not.?a.?brand/i.test(brand)) || ''
  const mobile = mobileHeader === '?1' ? true : mobileHeader === '?0' ? false : null
  return { browser, platform, mobile }
}

function normalizeScreen(value) {
  const match = String(value || '').trim().match(/^(\d{2,5})[x×](\d{2,5})$/)
  if (!match) return ''
  const width = Number(match[1])
  const height = Number(match[2])
  if (width < 200 || height < 200 || width > 10000 || height > 10000) return ''
  return `${width}×${height}`
}

function primaryLanguage(header) {
  const tag = String(header || '').split(',')[0].trim().split('-')[0].toLowerCase()
  return /^[a-z]{2}$/.test(tag) ? tag : ''
}

function countryNameFromCode(code) {
  const normalized = String(code || '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(normalized)) return ''
  try {
    return new Intl.DisplayNames(['fi'], { type: 'region' }).of(normalized) || normalized
  } catch {
    return normalized
  }
}

function headerValue(headers, name) {
  if (!headers) return ''
  return String(headers[name] || headers[name.toLowerCase()] || '')
}
