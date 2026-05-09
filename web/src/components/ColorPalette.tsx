import { TASK_COLOR_KEYS } from '@/vault/colors'
import type { TaskColorKey } from '@/vault/types'

const SWATCH: Record<TaskColorKey, string> = {
  zinc: 'bg-zinc-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  amber: 'bg-amber-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
  pink: 'bg-pink-500',
}

type Props = {
  value: TaskColorKey
  canEdit: boolean
  onChange: (key: TaskColorKey) => void
  label: string
}

export function ColorPalette({ value, canEdit, onChange, label }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <span className="text-xs text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-1">
        {TASK_COLOR_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={!canEdit}
            title={key}
            className={`h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-zinc-950 disabled:opacity-40 ${
              SWATCH[key]
            } ${value === key ? 'ring-emerald-400' : 'ring-transparent'}`}
            onClick={() => onChange(key)}
          />
        ))}
      </div>
    </div>
  )
}
