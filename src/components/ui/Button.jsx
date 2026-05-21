const variants = {
  primary:
    'bg-gold-400 text-olive-950 hover:bg-gold-300 focus-visible:ring-gold-400/50',
  secondary:
    'border border-olive-700 bg-transparent text-cream hover:border-gold-400/60 hover:text-gold-300 focus-visible:ring-gold-400/30',
  ghost:
    'bg-transparent text-cream hover:text-gold-300 focus-visible:ring-gold-400/30',
}

const sizes = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm font-semibold tracking-wide',
  lg: 'px-8 py-4 text-base font-semibold tracking-wide',
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  href,
  type = 'button',
  className = '',
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center rounded-sm transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-olive-950',
    variants[variant],
    sizes[size],
    className,
  ].join(' ')

  if (href) {
    return (
      <a href={href} className={classes} {...props}>
        {children}
      </a>
    )
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
