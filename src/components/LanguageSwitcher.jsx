import { LOCALES } from '../i18n'
import { useLanguage } from '../i18n/LanguageContext'

export default function LanguageSwitcher({ className = '' }) {
  const { locale, setLocale, content } = useLanguage()

  return (
    <div
      className={`inline-flex rounded-sm border border-olive-800 bg-olive-900/40 p-0.5 ${className}`}
      role="group"
      aria-label={content.common.language}
    >
      {Object.values(LOCALES).map(({ code, label }) => {
        const isActive = locale === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            aria-pressed={isActive}
            className={`min-w-[2.75rem] rounded-sm px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              isActive
                ? 'bg-gold-400 text-olive-950'
                : 'text-cream-muted hover:text-cream'
            }`}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}
