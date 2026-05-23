import { useLanguage } from '../i18n/LanguageContext'
import Button from './ui/Button'

export default function Hero() {
  const { content } = useLanguage()
  const { hero, common } = content

  return (
    <section
      id="hero"
      className="section-padding relative overflow-hidden pt-32 md:pt-40"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(201,169,98,0.08)_0%,_transparent_50%)]" />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-olive-800/20 blur-3xl" />

      <div className="relative mx-auto grid max-w-content items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.25em] text-gold-400">
            {hero.eyebrow}
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tightest text-cream sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-muted md:text-lg">
            {hero.subtitle}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button href="#yhteystiedot" size="lg">
              {hero.ctaPrimary}
            </Button>
            <Button href="#kalenteri" variant="secondary" size="lg">
              {hero.ctaSecondary}
            </Button>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[240px] sm:max-w-[280px] lg:mx-0 lg:max-w-[300px]">
          <div className="relative">
            <div className="overflow-hidden rounded-sm border border-olive-800 bg-olive-900 shadow-2xl shadow-black/40">
              {hero.imageSrc ? (
                <img
                  src={hero.imageSrc}
                  alt={hero.imageAlt}
                  className="mx-auto h-auto max-h-[min(48vh,420px)] w-full object-contain object-bottom sm:max-h-[min(52vh,460px)] lg:max-h-[min(calc(100vh-11rem),500px)]"
                />
              ) : (
                <div className="flex aspect-[2/3] flex-col items-center justify-center bg-gradient-to-br from-olive-900 via-olive-800 to-olive-950 p-8 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10">
                    <svg
                      className="h-10 w-10 text-gold-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium uppercase tracking-widest text-gold-400/80">
                    {common.promoImage}
                  </p>
                  <p className="mt-2 max-w-xs text-sm text-cream-muted">
                    {common.promoImageHint}
                  </p>
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 -left-4 hidden h-20 w-20 border border-gold-400/20 md:block" />
            <div className="absolute -right-4 -top-4 hidden h-12 w-12 bg-gold-400/10 md:block" />
          </div>
        </div>
      </div>
    </section>
  )
}
