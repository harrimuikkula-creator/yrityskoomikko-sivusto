const SESSION_KEY = 'siteVisitTracked:v3'
const SEEN_KEY = 'siteVisitSeen:v1'

let trackedThisPage = false

/**
 * Record one visit per successful Discord alert (or server duplicate-ip skip).
 * If the server skips as bot/uncertain, do NOT persist the session gate so a
 * later real visit can still alert.
 */
export function trackSiteVisit() {
  if (typeof window === 'undefined' || trackedThisPage) return

  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return

  try {
    if (window.sessionStorage.getItem(SESSION_KEY) === 'sent') {
      trackedThisPage = true
      return
    }
  } catch {
    // sessionStorage blocked — fall through with in-memory gate only.
  }

  sendVisitBeacon()
}

function sendVisitBeacon() {
  if (trackedThisPage) return
  trackedThisPage = true

  let returning = false
  try {
    returning = window.localStorage.getItem(SEEN_KEY) === '1'
    window.localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Storage can be blocked; the visit is still recorded as new.
  }

  const payload = {
    pageUrl: window.location.href,
    referrer: document.referrer || '',
    siteLanguage: readSiteLanguage(),
    screen: readScreen(),
    returning,
    automation: navigator.webdriver === true,
    languageCount: Array.isArray(navigator.languages) ? navigator.languages.length : 0,
  }

  fetch('/.netlify/functions/record-visit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  })
    .then(async (response) => {
      const body = await response.json().catch(() => ({}))
      // Persist only when Discord went out, or server already counted this IP.
      if (body?.discord === true || body?.skipped === 'duplicate-ip') {
        try {
          window.sessionStorage.setItem(SESSION_KEY, 'sent')
        } catch {
          // ignore
        }
      } else {
        // Allow a retry on the next page load after bot/uncertain skips.
        trackedThisPage = false
      }
    })
    .catch((error) => {
      trackedThisPage = false
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
