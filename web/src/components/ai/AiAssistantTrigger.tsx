import { useTranslation } from 'react-i18next'
import { useAiAssistant } from '@/components/ai/AiAssistantContext'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'

type Variant = 'header' | 'bottomNav' | 'sidebar'

type Props = {
  variant: Variant
  className?: string
  /** Sidebar icon-only mode (desktop collapsed nav). */
  sidebarCollapsed?: boolean
}

export function AiAssistantTrigger({ variant, className, sidebarCollapsed = false }: Props) {
  const { t } = useTranslation()
  const { open, toggleAssistant } = useAiAssistant()

  if (variant === 'bottomNav') {
    return (
      <button
        type="button"
        aria-expanded={open}
        aria-controls="ai-assistant-panel"
        aria-label={t('shell.navAi')}
        className={cn(
          'flex min-h-[44px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2',
          open ? 'text-primary' : 'text-on-surface-variant',
          className,
        )}
        onClick={toggleAssistant}
      >
        <MaterialIcon name="psychology" size={24} filled={open} />
        <span className="max-w-full truncate text-label-sm">{t('shell.navAi')}</span>
      </button>
    )
  }

  if (variant === 'sidebar') {
    const label = t('shell.navAi')
    return (
      <button
        type="button"
        aria-expanded={open}
        aria-controls="ai-assistant-panel"
        aria-label={sidebarCollapsed ? label : undefined}
        title={sidebarCollapsed ? label : undefined}
        className={cn(
          'flex min-h-[44px] w-full items-center rounded text-left text-label-md transition-all duration-200',
          sidebarCollapsed ? 'justify-center gap-0 px-2 py-3' : 'gap-4 px-md py-3',
          open
            ? cn(
                'border-r-2 border-primary bg-surface-container-high font-semibold text-primary',
                !sidebarCollapsed && 'translate-x-0.5',
              )
            : cn(
                'text-on-surface-variant hover:bg-surface-container-high',
                !sidebarCollapsed && 'hover:translate-x-0.5',
              ),
          className,
        )}
        onClick={toggleAssistant}
      >
        <MaterialIcon name="psychology" size={22} filled={open} />
        <span className={sidebarCollapsed ? 'sr-only' : undefined}>{label}</span>
      </button>
    )
  }

  return (
    <button
      type="button"
      aria-expanded={open}
      aria-controls="ai-assistant-panel"
      aria-label={t('shell.navAi')}
      title={t('aiAssistant.inputHint')}
      className={cn(
        'flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-colors',
        open
          ? 'bg-primary/15 text-primary'
          : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
        className,
      )}
      onClick={toggleAssistant}
    >
      <MaterialIcon name="psychology" size={24} filled={open} />
    </button>
  )
}
