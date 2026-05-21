/**
 * Näyttää kuvan ottajan / tekijän maininnan, jos `text` on asetettu.
 */
export default function PhotoCredit({ text, className = '' }) {
  if (!text?.trim()) return null
  return (
    <p
      className={`text-[11px] font-medium leading-snug tracking-wide text-olive-500 ${className}`.trim()}
    >
      📸 {text.trim()}
    </p>
  )
}
