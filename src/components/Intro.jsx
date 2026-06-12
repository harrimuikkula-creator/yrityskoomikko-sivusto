import { useLanguage } from '../i18n/LanguageContext'

const aboutImageWidth =
  'w-full max-w-[13.5rem] lg:w-[13.5rem] lg:max-w-none xl:w-[15rem]'

function AboutImageFrame({ src, alt, objectPosition = 'center' }) {
  return (
    <div
      className={`aspect-[4/5] overflow-hidden rounded-sm border border-olive-800 bg-olive-900 ${aboutImageWidth}`}
    >
      <img
        src={src}
        alt={alt}
        className={`h-full w-full object-cover ${objectPosition}`}
      />
    </div>
  )
}

export default function Intro() {
  const { content } = useLanguage()
  const { about, intro } = content

  return (
    <section
      id="esittely"
      className="border-t border-olive-800/40 px-6 pt-16 pb-12 md:px-10 md:pt-20 md:pb-14 lg:px-12 lg:pt-24 lg:pb-16"
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

        <div className="section-divider my-12 md:my-14" />

        <div className="grid items-start gap-8 lg:grid-cols-[13.5rem_minmax(0,1fr)_13.5rem] lg:gap-10 xl:grid-cols-[15rem_minmax(0,1fr)_15rem] xl:gap-12">
          {about.imageSrc && (
            <figure className={`relative mx-auto lg:mx-0 ${aboutImageWidth}`}>
              <AboutImageFrame
                src={about.imageSrc}
                alt={about.imageAlt}
                objectPosition="object-[center_12%]"
              />
              <div
                className="pointer-events-none absolute -bottom-3 -right-3 hidden h-12 w-12 border border-gold-400/25 md:block"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -left-2 -top-2 hidden h-8 w-8 bg-gold-400/10 md:block"
                aria-hidden
              />
            </figure>
          )}

          <div className="min-w-0">
            <h2 className="mb-6 text-3xl font-bold leading-tight tracking-tightest text-cream md:mb-8 md:text-4xl">
              {about.title}
            </h2>
            {about.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 30)}
                className="mb-5 text-base leading-relaxed text-cream-muted last:mb-0 md:text-lg"
              >
                {paragraph}
              </p>
            ))}
          </div>

          {about.highlightImage && (
            <figure className={`mx-auto shrink-0 lg:mx-0 lg:justify-self-end ${aboutImageWidth}`}>
              <AboutImageFrame
                src={about.highlightImage.src}
                alt={about.highlightImage.alt}
                objectPosition="object-center"
              />
            </figure>
          )}
        </div>
      </div>
    </section>
  )
}
