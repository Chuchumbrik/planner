import type { ReactNode } from 'react'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'

function GripIcon() {
  return (
    <svg
      width="14"
      height="18"
      viewBox="0 0 14 18"
      fill="currentColor"
      className="opacity-80"
      aria-hidden
    >
      <circle cx="4" cy="4" r="1.5" />
      <circle cx="10" cy="4" r="1.5" />
      <circle cx="4" cy="9" r="1.5" />
      <circle cx="10" cy="9" r="1.5" />
      <circle cx="4" cy="14" r="1.5" />
      <circle cx="10" cy="14" r="1.5" />
    </svg>
  )
}

export function DroppableTaskZone({
  id,
  children,
  className,
}: {
  id: string
  children: ReactNode
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div
      ref={setNodeRef}
      className={`${className ?? ''} ${isOver ? 'rounded-lg ring-2 ring-emerald-500/40 ring-offset-2 ring-offset-zinc-950' : ''}`.trim()}
    >
      {children}
    </div>
  )
}

export function DraggableTaskShell({
  taskId,
  disabled,
  children,
}: {
  taskId: string
  disabled: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: taskId,
    disabled,
  })
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.35 : undefined,
  }
  return (
    <div ref={setNodeRef} style={style} className="min-w-0">
      <div className="flex gap-0 sm:gap-1">
        <button
          type="button"
          className="touch-none shrink-0 cursor-grab rounded py-2 pr-1 text-zinc-500 hover:text-zinc-300 active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-30"
          disabled={disabled}
          aria-label={t('app.dragHandle')}
          {...listeners}
          {...attributes}
        >
          <GripIcon />
        </button>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
