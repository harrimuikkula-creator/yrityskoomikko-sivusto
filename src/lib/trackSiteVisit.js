const SESSION_KEY = 'siteVisitTracked:v1'
const SEEN_KEY = 'siteVisitSeen:v1'

/**
 * Record one visit per browser tab session and notify Discord with running total.
 * Skips localhost to avoid spam during development.
 */
export function trackSiteVisit() {
  if (typeof window === 'undefined') return

  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return

  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return
    window.sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // If sessionStorage is blocked, still attempt one beacon this load.
  }

  let returning = false
  try {
    returning = window.localStorage.getItem(SEEN_KEY) === '1'
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Storage can be blocked; the visit is still recorded as new.
  }

  const screen = readScreen()
  const payload = {
    pageUrl: window.location.href,
    referrer: document.referrer || '',
    siteLanguage: readSiteLanguage(),
    screen,
    returning,
    automation: navigator.webdriver === true,
  }

  fetch('/.netlify/functions/record-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch((error) => {
    console.warn('Visit tracking failed.', error)
  })
}

function readSiteLanguage() {
  try {
    const stored = window.localStorage.getItem('site-locale')
    if (stored === 'fi' || stored === 'en') return stored
  } catch {
    // ignore
  }
  const lang = document.documentElement.lang
  return lang === 'en' ? 'en' : 'fi'
}

function readScreen() {
  const width = window.screen?.width
  const height = window.screen?.height
  if (!Number.isFinite(width) || !Number.isFinite(height)) return ''
  return `${Math.round(width)}x${Math.round(height)}`
}
