const SESSION_KEY = 'siteVisitTracked:v1'
const SEEN_KEY = 'siteVisitSeen:v1'
const ENGAGE_WAIT_MS = 2500

let trackedThisPage = false

/**
 * Record one visit per browser tab session and notify Discord with running total.
 * Skips localhost to avoid spam during development.
 * Waits briefly for real engagement so thin headless hits are less likely to alert.
 */
export function trackSiteVisit() {
  if (typeof window === 'undefined' || trackedThisPage) return

  const host = window.location.hostname
  if (host === 'localhost' || host === '127.0.0.1') return

  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) {
      trackedThisPage = true
      return
    }
  } catch {
    // sessionStorage blocked — fall through with in-memory gate only.
  }

  waitForEngagement()
    .then(() => {
      if (trackedThisPage) return
      sendVisitBeacon()
    })
    .catch(() => {
      // ignore
    })
}

function waitForEngagement() {
  return new Promise((resolve) => {
    let settled = false
    const finish = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      window.removeEventListener('pointerdown', finish, true)
      window.removeEventListener('keydown', finish, true)
      window.removeEventListener('scroll', finish, true)
      resolve()
    }

    const timer = window.setTimeout(finish, ENGAGE_WAIT_MS)
    window.addEventListener('pointerdown', finish, { capture: true, once: true, passive: true })
    window.addEventListener('keydown', finish, { capture: true, once: true })
    window.addEventListener('scroll', finish, { capture: true, once: true, passive: true })
  })
}

function sendVisitBeacon() {
  if (trackedThisPage) return
  trackedThisPage = true

  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return
    window.sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    // Keep in-memory gate; server IP dedupe covers storage-blocked scrapers.
  }

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
