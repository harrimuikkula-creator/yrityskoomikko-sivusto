import fi from './locales/fi'
import en from './locales/en'

export const LOCALES = {
  fi: { code: 'fi', label: 'FI', content: fi },
  en: { code: 'en', label: 'EN', content: en },
}

export const DEFAULT_LOCALE = 'fi'

export function getContent(locale) {
  return LOCALES[locale]?.content ?? LOCALES[DEFAULT_LOCALE].content
}
