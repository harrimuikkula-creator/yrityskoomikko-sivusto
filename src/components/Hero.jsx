import { useLanguage } from '../i18n/LanguageContext'
import Button from './ui/Button'

/** Kuvasarakkeen korkeus (header + alapalkki vähennettynä) */
const imageHeight =
  'min-h-[min(54vh,520px)] lg:h-[calc(100dvh-5.25rem-4.5rem)] lg:min-h-[600px]'

export default function Hero() {
  const { content } = useLanguage()
  const { hero, common } = content

  return (
    <section
      id="hero"
      className="bg-white pt-[4.75rem] md:pt-[5.25rem]"
    >
      <div className="mx-auto grid max-w-content grid-cols-1 px-6 md:px-10 lg:grid-cols-[minmax(0,38%)_minmax(0,62%)] lg:items-stretch lg:gap-12 lg:px-12">
        <div className="relative z-20 flex flex-col justify-center bg-white py-10 lg:py-12 lg:pr-4">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-600 sm:text-xs">
            {hero.eyebrow}
          </p>
          <h1 className="text-[2rem] font-extrabold leading-[1.08] tracking-tightest text-olive-950 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.06]">
            {hero.title}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-olive-800 md:text-[1.0625rem] md:leading-relaxed">
            {hero.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <Button href="#yhteystiedot" size="lg">
              {hero.ctaPrimary}
            </Button>
            <Button
              href="#kalenteri"
              variant="secondary"
              size="lg"
              className="border-olive-950/25 bg-white text-olive-950 hover:border-gold-600 hover:bg-white hover:text-gold-800 focus-visible:ring-gold-500/40 focus-visible:ring-offset-white"
            >
              {hero.ctaSecondary}
            </Button>
          </div>
        </div>

        <div className={`relative isolate overflow-hidden ${imageHeight}`}>
          {hero.imageSrc ? (
            <div className="flex h-full w-full items-end justify-center">
              <img
                src={hero.imageSrc}
                alt={hero.imageAlt}
                className="h-full w-auto max-w-none object-contain object-bottom"
                decoding="async"
              />
            </div>
          ) : (
            <div className="flex h-full min-h-[280px] flex-col items-center justify-center rounded-sm border border-olive-200 p-8 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-gold-700">
                {common.promoImage}
              </p>
              <p className="mt-2 max-w-xs text-sm text-olive-600">
                {common.promoImageHint}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
