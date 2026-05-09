import type { TaskColorKey } from '@/vault/types'

/** Левая полоска задачи (Tailwind классы) */
export const TASK_LEFT_BORDER: Record<TaskColorKey, string> = {
  zinc: 'border-l-zinc-500',
  red: 'border-l-red-500',
  orange: 'border-l-orange-500',
  amber: 'border-l-amber-500',
  emerald: 'border-l-emerald-500',
  sky: 'border-l-sky-500',
  violet: 'border-l-violet-500',
  pink: 'border-l-pink-500',
}

export const TASK_COLOR_KEYS: TaskColorKey[] = [
  'zinc',
  'red',
  'orange',
  'amber',
  'emerald',
  'sky',
  'violet',
  'pink',
]

export function taskBorderClass(colorKey: TaskColorKey): string {
  return TASK_LEFT_BORDER[colorKey] ?? TASK_LEFT_BORDER.zinc
}
