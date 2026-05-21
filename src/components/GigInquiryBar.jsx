import { useEffect, useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'

function shouldHideBar() {
  const contact = document.getElementById('yhteystiedot')
  if (!contact) return false

  const rect = contact.getBoundingClientRect()
  const contactVisible =
    rect.top < window.innerHeight * 0.82 && rect.bottom > window.innerHeight * 0.12

  const footer = document.querySelector('footer')
  const footerVisible = footer
    ? footer.getBoundingClientRect().top < window.innerHeight
    : false

  return contactVisible || footerVisible
}

export default function GigInquiryBar() {
  const { content } = useLanguage()
  const { common } = content
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const update = () => setHidden(shouldHideBar())
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  if (hidden) return null

  return (
    <aside
      className="fixed inset-x-0 bottom-0 z-40 border-t border-olive-800/80 bg-olive-950/95 shadow-[0_-8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md"
      aria-label={common.gigInquiryBarAria}
    >
      <div className="mx-auto flex max-w-content flex-col gap-3 px-6 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-10 lg:px-12">
        <p className="text-sm leading-snug text-cream-muted md:text-base">
          <span className="font-semibold text-cream">{common.gigInquiryBarTitle}</span>
          {' — '}
          {common.gigInquiryBarHint}
        </p>
        <a
          href="#yhteystiedot"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-sm bg-gold-400 px-5 py-2.5 text-sm font-semibold tracking-wide text-olive-950 transition-colors hover:bg-gold-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-olive-950"
        >
          {common.gigInquiryCta}
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
            />
          </svg>
        </a>
      </div>
    </aside>
  )
}
