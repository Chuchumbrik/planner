/** Animated bar-wave for voice recording indicator. amplitude: 0–1 */
export function VoiceWave({ amplitude }: { amplitude: number }) {
  const bars = [0.4, 0.7, 1.0, 0.7, 0.4]
  return (
    <span className="flex items-center gap-[3px]" aria-hidden>
      {bars.map((base, i) => {
        const h = Math.max(4, Math.round((4 + base * amplitude * 20)))
        return (
          <span
            key={i}
            className="w-[3px] rounded-full bg-primary transition-all duration-75"
            style={{ height: `${h}px` }}
          />
        )
      })}
    </span>
  )
}
