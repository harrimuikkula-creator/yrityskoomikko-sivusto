import { useLanguage } from '../i18n/LanguageContext'

export default function Intro() {
  const { content } = useLanguage()
  const { about, intro } = content

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

        <div className="section-divider my-16 md:my-20" />

        <div className="grid gap-10 lg:grid-cols-[minmax(0,17rem)_1fr] lg:items-start lg:gap-16">
          {about.imageSrc && (
            <figure className="relative mx-auto w-full max-w-xs lg:mx-0 lg:max-w-none">
              <div className="overflow-hidden rounded-sm border border-olive-800 bg-olive-900 shadow-2xl shadow-black/40">
                <img
                  src={about.imageSrc}
                  alt={about.imageAlt}
                  className="aspect-[4/5] w-full object-cover object-[center_12%]"
                />
              </div>
              <div
                className="pointer-events-none absolute -bottom-3 -right-3 hidden h-16 w-16 border border-gold-400/25 md:block"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -left-2 -top-2 hidden h-10 w-10 bg-gold-400/10 md:block"
                aria-hidden
              />
            </figure>
          )}

          <div>
            <h2 className="mb-8 text-3xl font-bold leading-tight tracking-tightest text-cream md:text-4xl lg:mb-10">
              {about.title}
            </h2>
            {about.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 30)}
                className="mb-6 text-base leading-relaxed text-cream-muted last:mb-0 md:text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
