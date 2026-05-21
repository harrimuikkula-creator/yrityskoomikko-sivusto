import { useLanguage } from '../i18n/LanguageContext'

export default function Intro() {
  const { content } = useLanguage()
  const { intro } = content

  return (
    <section
      id="esittely"
      className="section-padding border-t border-olive-800/40"
    >
      <div className="mx-auto max-w-content">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <h2 className="text-3xl font-bold leading-tight tracking-tightest text-cream md:text-4xl lg:sticky lg:top-32 lg:self-start">
            {intro.title}
          </h2>
          <div>
            {intro.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 30)}
                className="mb-6 text-base leading-relaxed text-cream-muted last:mb-0 md:text-lg"
              >
                {paragraph}
              </p>
            ))}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-olive-800 pt-10">
              {intro.stats.map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-gold-400 md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-wider text-olive-400 md:text-sm">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
