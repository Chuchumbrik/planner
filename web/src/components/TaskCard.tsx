import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TASK_COLOR_KEYS, TASK_LEFT_BORDER } from '@/vault/colors'
import type { Task, TaskColorKey, TaskGroup } from '@/vault/types'

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
  task: Task
  groups: TaskGroup[]
  canEdit: boolean
  onToggle: () => void
  onRemove: () => void
  onSetColor: (key: TaskColorKey) => void
  onSetGroup: (groupId: string) => void
  onAddSubtask: (title: string) => void
  onToggleSubtask: (subId: string) => void
  onRemoveSubtask: (subId: string) => void
}

export function TaskCard({
  task,
  groups,
  canEdit,
  onToggle,
  onRemove,
  onSetColor,
  onSetGroup,
  onAddSubtask,
  onToggleSubtask,
  onRemoveSubtask,
}: Props) {
  const { t } = useTranslation()
  const [subDraft, setSubDraft] = useState('')
  const sortedGroups = [...groups].sort((a, b) => a.sortOrder - b.sortOrder)

  const borderClass = TASK_LEFT_BORDER[task.colorKey] ?? TASK_LEFT_BORDER.zinc

  return (
    <li
      className={`rounded-lg border border-zinc-800 bg-zinc-900/60 ${borderClass} border-l-4 pl-2`}
    >
      <div className="flex items-start gap-3 px-2 py-2.5 pr-2">
        <label className="flex flex-1 cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={task.done}
            disabled={!canEdit}
            onChange={() => onToggle()}
            className="mt-1 h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-emerald-500 disabled:opacity-40"
          />
          <span
            className={`text-sm ${task.done ? 'text-zinc-500 line-through' : 'text-zinc-100'}`}
          >
            {task.title}
          </span>
        </label>
        <button
          type="button"
          disabled={!canEdit}
          className="shrink-0 text-xs text-red-400/90 hover:text-red-300 disabled:opacity-40"
          onClick={() => onRemove()}
        >
          {t('common.delete')}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 px-2 py-2">
        <label className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="whitespace-nowrap">{t('app.group')}</span>
          <select
            className="max-w-[10rem] rounded border border-zinc-700 bg-zinc-950 px-1.5 py-1 text-xs text-zinc-200 disabled:opacity-40"
            value={task.groupId}
            disabled={!canEdit}
            onChange={(e) => onSetGroup(e.target.value)}
          >
            {sortedGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap items-center gap-1">
          <span className="text-xs text-zinc-500">{t('app.color')}</span>
          <div className="flex flex-wrap gap-1">
            {TASK_COLOR_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                disabled={!canEdit}
                title={key}
                className={`h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-zinc-950 disabled:opacity-40 ${
                  SWATCH[key]
                } ${task.colorKey === key ? 'ring-emerald-400' : 'ring-transparent'}`}
                onClick={() => onSetColor(key)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-zinc-800/80 px-2 pb-2 pt-2">
        <p className="text-xs text-zinc-500">{t('app.goalSplitHint')}</p>
        <p className="mt-1 text-xs font-medium text-zinc-400">{t('app.subtasks')}</p>
        <ul className="mt-2 flex flex-col gap-1.5">
          {task.subtasks.map((s) => (
            <li key={s.id} className="flex items-start gap-2">
              <label className="flex flex-1 cursor-pointer items-start gap-2">
                <input
                  type="checkbox"
                  checked={s.done}
                  disabled={!canEdit}
                  onChange={() => onToggleSubtask(s.id)}
                  className="mt-0.5 h-3.5 w-3.5 rounded border-zinc-600 bg-zinc-900 text-emerald-500 disabled:opacity-40"
                />
                <span
                  className={`text-xs ${s.done ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}
                >
                  {s.title}
                </span>
              </label>
              <button
                type="button"
                disabled={!canEdit}
                className="text-[11px] text-zinc-500 hover:text-red-400 disabled:opacity-40"
                onClick={() => onRemoveSubtask(s.id)}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
        <form
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!canEdit) return
            const v = subDraft.trim()
            if (!v) return
            onAddSubtask(v)
            setSubDraft('')
          }}
        >
          <input
            className="flex-1 rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-emerald-500/80 disabled:opacity-40"
            placeholder={t('app.addSubtask')}
            value={subDraft}
            disabled={!canEdit}
            onChange={(e) => setSubDraft(e.target.value)}
          />
          <button
            type="submit"
            disabled={!canEdit}
            className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-700 disabled:opacity-40"
          >
            {t('common.add')}
          </button>
        </form>
      </div>
    </li>
  )
}
