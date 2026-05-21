import { useLanguage } from '../i18n/LanguageContext'
import SectionHeading from './ui/SectionHeading'

export default function References() {
  const { content } = useLanguage()
  const { references } = content

  return (
    <section id="referenssit" className="section-padding">
      <div className="mx-auto max-w-content">
        <SectionHeading
          eyebrow={references.eyebrow}
          title={references.title}
          subtitle={references.subtitle}
          align="center"
          className="mb-14"
        />

        {references.logos?.length > 0 && (
          <div className="mb-16 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {references.logos.map((logo) => (
              <div
                key={logo.name}
                className="flex aspect-[3/2] items-center justify-center rounded-sm border border-olive-800 bg-olive-900/50 transition-colors hover:border-gold-400/30 hover:bg-olive-900"
                title={logo.name}
              >
                <span className="text-xl font-bold tracking-tight text-olive-500 transition-colors hover:text-gold-400/70 md:text-2xl">
                  {logo.initials}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="mx-auto grid max-w-2xl gap-6">
          {references.testimonials.map((item) => (
            <blockquote
              key={`${item.author}-${item.quote.slice(0, 24)}`}
              className="flex flex-col rounded-sm border border-olive-800 bg-olive-900/30 p-6 md:p-8"
            >
              <svg
                className="mb-4 h-8 w-8 text-gold-400/40"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.29l1.29 1.911C6.586 8.698 5.5 10.1 5.5 11.75c0 1.225.445 2.225 1.333 3.001.445.388.889.582 1.334.582.445 0 .889-.194 1.333-.582.889-.776 1.334-1.776 1.334-3.001 0-1.65-1.086-3.052-2.823-4.128L8.5 4.5c3.573 1.653 6.03 4.79 6.03 8.29 0 1.989-.553 3.216-1.583 4.31-.889.776-1.889 1.165-3 1.165s-2.111-.389-3-1.165z" />
              </svg>
              <p className="flex-1 text-base leading-relaxed text-cream-muted">
                &ldquo;{item.quote}&rdquo;
              </p>
              {(item.author || item.role || item.company) && (
                <footer className="mt-6 border-t border-olive-800 pt-6">
                  <cite className="not-italic">
                    {item.author && (
                      <span className="block text-sm font-semibold text-cream">
                        {item.author}
                      </span>
                    )}
                    {(item.role || item.company) && (
                      <span className="mt-0.5 block text-xs text-olive-400">
                        {[item.role, item.company].filter(Boolean).join(', ')}
                      </span>
                    )}
                  </cite>
                </footer>
              )}
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
