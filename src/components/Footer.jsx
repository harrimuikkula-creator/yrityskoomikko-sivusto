import { useLanguage } from '../i18n/LanguageContext'

export default function Footer() {
  const { content } = useLanguage()
  const { brand, navLinks, common } = content
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-olive-800 bg-olive-950 px-6 py-10 md:px-10 lg:px-12">
      <div className="mx-auto flex max-w-content flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-cream">{brand.name}</p>
          <p className="mt-1 text-xs text-olive-400">{brand.tagline}</p>
        </div>
        <nav className="flex flex-wrap gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-cream-muted transition-colors hover:text-gold-300"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <p className="text-xs text-olive-500">
          &copy; {year} {brand.name}. {common.allRightsReserved}
        </p>
      </div>
    </footer>
  )
}
