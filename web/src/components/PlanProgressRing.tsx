import type { ReactNode } from 'react'

/** Кольцо прогресса (SVG); `frac` от 0 до 1. Опционально — подпись (например процент) по центру. */
export function PlanProgressRing({
  frac,
  empty,
  size = 136,
  stroke = 11,
  centerLabel,
}: {
  frac: number
  empty: boolean
  size?: number
  stroke?: number
  centerLabel?: ReactNode
}) {
  const cx = size / 2
  const cy = size / 2
  const r = cx - stroke / 2 - 2
  const circ = 2 * Math.PI * r
  const dashDone = empty ? 0 : frac * circ
  const dashRest = circ - dashDone

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      aria-hidden
    >
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#353437"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {!empty ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#4edea3"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dashDone} ${dashRest}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      ) : (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="#2a2a2c"
          strokeWidth={stroke}
          strokeDasharray="6 8"
        />
      )}
    </svg>
    {centerLabel != null && centerLabel !== false ? (
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-2 text-center">
        {centerLabel}
      </div>
    ) : null}
    </div>
  )
}
