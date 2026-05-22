import { cn } from '@/lib/cn'
import { useTranslation } from 'react-i18next'

type BrandMarkProps = {
  className?: string
  /** Primary line size: sm (sidebar), md (header), lg (landing). */
  size?: 'sm' | 'md' | 'lg'
  showSubtitle?: boolean
  showVersion?: boolean
  version?: string
}

const sizeClass = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl md:text-3xl',
} as const

export function BrandMark({
  className,
  size = 'md',
  showSubtitle = false,
  showVersion = false,
  version,
}: BrandMarkProps) {
  const { t } = useTranslation()

  return (
    <div className={cn('min-w-0', className)}>
      <p
        className={cn(
          'font-display font-bold tracking-tight text-primary',
          sizeClass[size],
        )}
      >
        <span>{t('app.brand')}</span>
        <span className="text-on-surface-variant/70 font-medium"> · </span>
        <span className="text-on-surface">{t('app.brandLatin')}</span>
      </p>
      {showSubtitle ? (
        <p className="mt-1 font-display text-xs tracking-wide text-on-surface-variant/80">
          {t('shell.brandSubtitle')}
        </p>
      ) : null}
      {showVersion && version ? (
        <p className="mt-2 font-mono text-[10px] text-on-surface-variant/60">
          {t('home.badge', { version })}
        </p>
      ) : null}
    </div>
  )
}
