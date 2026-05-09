/** Кольцо прогресса (SVG); `frac` от 0 до 1. */
export function PlanProgressRing({
  frac,
  empty,
  size = 136,
  stroke = 11,
}: {
  frac: number
  empty: boolean
  size?: number
  stroke?: number
}) {
  const cx = size / 2
  const cy = size / 2
  const r = cx - stroke / 2 - 2
  const circ = 2 * Math.PI * r
  const dashDone = empty ? 0 : frac * circ
  const dashRest = circ - dashDone

  return (
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
        stroke="rgb(39 39 42)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
      {!empty ? (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke="rgb(5 150 105)"
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
          stroke="rgb(63 63 70)"
          strokeWidth={stroke}
          strokeDasharray="6 8"
        />
      )}
    </svg>
  )
}
