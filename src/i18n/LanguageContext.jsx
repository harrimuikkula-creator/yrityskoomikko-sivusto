import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { DEFAULT_LOCALE, getContent, LOCALES } from './index'

const STORAGE_KEY = 'site-locale'

const LanguageContext = createContext(null)

function readStoredLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && LOCALES[stored]) return stored
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

export function LanguageProvider({ children }) {
  const [locale, setLocaleState] = useState(readStoredLocale)

  const content = useMemo(() => getContent(locale), [locale])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* ignore */
    }
    document.documentElement.lang = locale
    document.title = content.meta.title
    const meta = document.querySelector('meta[name="description"]')
    if (meta) meta.setAttribute('content', content.meta.description)
  }, [locale, content.meta.title, content.meta.description])

  function setLocale(next) {
    if (LOCALES[next]) setLocaleState(next)
  }

  const value = useMemo(
    () => ({ locale, setLocale, content }),
    [locale, content],
  )

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
