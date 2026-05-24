import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import Button from './ui/Button'
import LanguageSwitcher from './LanguageSwitcher'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { content } = useLanguage()
  const { brand, navLinks, common } = content

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-olive-800/60 bg-olive-950">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-4 md:px-10 lg:px-12">
        <a
          href="#hero"
          className="group flex flex-col leading-none"
          onClick={() => setMenuOpen(false)}
        >
          <span className="text-lg font-bold tracking-tight text-cream transition-colors group-hover:text-gold-300">
            {brand.name}
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-olive-400">
            {brand.tagline}
          </span>
        </a>

        <nav className="hidden items-center gap-6 lg:gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-cream-muted transition-colors hover:text-gold-300"
            >
              {link.label}
            </a>
          ))}
          <LanguageSwitcher />
          <Button href="#yhteystiedot" size="sm">
            {common.requestQuote}
          </Button>
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <LanguageSwitcher />
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-sm border border-olive-800 text-cream"
            aria-label={menuOpen ? common.closeMenu : common.openMenu}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="sr-only">{common.menu}</span>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {menuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-olive-800/50 bg-olive-950 px-6 py-6 md:hidden">
          <ul className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="block text-base font-medium text-cream-muted transition-colors hover:text-gold-300"
                  onClick={() => setMenuOpen(false)}
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Button
                href="#yhteystiedot"
                className="w-full"
                onClick={() => setMenuOpen(false)}
              >
                {common.requestQuote}
              </Button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
