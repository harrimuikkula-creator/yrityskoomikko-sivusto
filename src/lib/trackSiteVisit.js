const SESSION_KEY = 'siteVisitTracked:v1'

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

  const payload = {
    pageUrl: window.location.href,
    referrer: document.referrer || '',
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
