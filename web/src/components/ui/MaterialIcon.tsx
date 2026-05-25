import { cn } from '@/lib/cn'

type MaterialIconProps = {
  name: string
  className?: string
  filled?: boolean
  size?: number
  'aria-hidden'?: boolean
  title?: string
}

export function MaterialIcon({
  name,
  className,
  filled = false,
  size = 24,
  'aria-hidden': ariaHidden = true,
  title,
}: MaterialIconProps) {
  return (
    <span
      className={cn('material-symbols-outlined', className)}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'opsz' ${size}`,
      }}
      aria-hidden={ariaHidden}
      title={title}
    >
      {name}
    </span>
  )
}
