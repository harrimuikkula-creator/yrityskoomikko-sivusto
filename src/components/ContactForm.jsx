import { useState } from 'react'
import { useLanguage } from '../i18n/LanguageContext'
import SectionHeading from './ui/SectionHeading'
import Button from './ui/Button'

const initialFormState = {
  name: '',
  company: '',
  date: '',
  message: '',
}

export default function ContactForm() {
  const { content } = useLanguage()
  const { contact, brand, common } = content
  const [form, setForm] = useState(initialFormState)
  const [submitted, setSubmitted] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setSubmitted(true)
    setForm(initialFormState)
  }

  const inputClasses =
    'w-full rounded-sm border border-olive-700 bg-olive-900/50 px-4 py-3 text-cream placeholder:text-olive-500 transition-colors focus:border-gold-400/50 focus:outline-none focus:ring-1 focus:ring-gold-400/30'

  return (
    <section
      id="yhteystiedot"
      className="scroll-mt-24 section-padding border-t border-olive-800/40"
    >
      <div className="mx-auto max-w-content">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <div>
            <SectionHeading
              eyebrow={contact.eyebrow}
              title={contact.title}
              subtitle={contact.subtitle}
            />
            <div className="mt-10 space-y-4 text-cream-muted">
              <p>
                <span className="block text-xs font-semibold uppercase tracking-wider text-olive-400">
                  {common.email}
                </span>
                <a
                  href={`mailto:${brand.email}`}
                  className="mt-1 inline-block text-cream transition-colors hover:text-gold-300"
                >
                  {brand.email}
                </a>
              </p>
              <p>
                <span className="block text-xs font-semibold uppercase tracking-wider text-olive-400">
                  {common.phone}
                </span>
                <a
                  href={`tel:${brand.phone.replace(/\s/g, '')}`}
                  className="mt-1 inline-block text-cream transition-colors hover:text-gold-300"
                >
                  {brand.phone}
                </a>
              </p>
            </div>
          </div>

          <div className="rounded-sm border border-olive-800 bg-olive-900/30 p-6 md:p-8">
            {submitted ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold-400/15">
                  <svg
                    className="h-7 w-7 text-gold-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-cream">
                  {contact.successMessage}
                </p>
                <button
                  type="button"
                  className="mt-6 text-sm text-gold-400 underline-offset-4 hover:underline"
                  onClick={() => setSubmitted(false)}
                >
                  {common.sendAnotherMessage}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-cream-muted"
                  >
                    {contact.fields.name}
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className={inputClasses}
                    autoComplete="name"
                  />
                </div>
                <div>
                  <label
                    htmlFor="company"
                    className="mb-2 block text-sm font-medium text-cream-muted"
                  >
                    {contact.fields.company}
                  </label>
                  <input
                    id="company"
                    name="company"
                    type="text"
                    required
                    value={form.company}
                    onChange={handleChange}
                    className={inputClasses}
                    autoComplete="organization"
                  />
                </div>
                <div>
                  <label
                    htmlFor="date"
                    className="mb-2 block text-sm font-medium text-cream-muted"
                  >
                    {contact.fields.date}
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={form.date}
                    onChange={handleChange}
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-medium text-cream-muted"
                  >
                    {contact.fields.message}
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    required
                    value={form.message}
                    onChange={handleChange}
                    className={`${inputClasses} resize-y`}
                    placeholder={contact.messagePlaceholder}
                  />
                </div>
                <Button type="submit" size="lg" className="w-full">
                  {contact.submitLabel}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
