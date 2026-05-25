import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { cn } from '@/lib/cn'
import { SHELL_ICON_BTN, SHELL_PLAN_BADGE, SHELL_UPGRADE_STUB } from '@/lib/designClasses'
import { getPlanTier, type PlanTier } from '@/lib/planTier'

type Props = {
  planTier?: PlanTier
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ShellVaultPlanButton({ planTier: planTierProp, open: openProp, onOpenChange }: Props) {
  const { t } = useTranslation()
  const planTier = planTierProp ?? getPlanTier()
  const isPremium = planTier === 'premium'
  const [internalOpen, setInternalOpen] = useState(false)
  const open = openProp ?? internalOpen
  const popoverRef = useRef<HTMLDivElement>(null)

  function setPopoverOpen(next: boolean) {
    if (openProp === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }

  useEffect(() => {
    if (!open) return
    function handlePointerDown(e: MouseEvent) {
      const node = popoverRef.current
      if (node && !node.contains(e.target as Node)) {
        setPopoverOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  return (
    <div ref={popoverRef} className="relative">
      <button
        type="button"
        className={cn(
          SHELL_ICON_BTN,
          isPremium
            ? 'text-primary hover:bg-primary/10'
            : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface',
        )}
        title={t('shell.vaultLocked')}
        aria-label={t('shell.vaultPlanIconAria')}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setPopoverOpen(!open)}
      >
        <MaterialIcon name={isPremium ? 'workspace_premium' : 'shield'} size={22} filled={isPremium} />
      </button>
      {open ? (
        <div
          className="absolute right-0 top-full z-50 mt-1 w-[min(18rem,calc(100vw-2rem))] rounded-lg border border-surface-variant bg-surface-container-low p-3 shadow-xl"
          role="dialog"
          aria-label={t('shell.vaultPlanIconAria')}
        >
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-surface-container-high',
                isPremium ? 'border-primary/50' : 'border-outline-variant',
              )}
              aria-hidden
            >
              <MaterialIcon
                name={isPremium ? 'workspace_premium' : 'shield'}
                className={isPremium ? 'text-primary' : 'text-on-surface-variant'}
                size={20}
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-on-surface">{t('shell.vaultLocked')}</p>
              <p className="mt-0.5">
                <span
                  className={cn(
                    SHELL_PLAN_BADGE,
                    isPremium
                      ? 'border-primary/40 bg-primary/10 text-primary'
                      : 'border-outline-variant text-on-surface-variant',
                  )}
                >
                  {isPremium ? t('shell.planPremium') : t('shell.planFree')}
                </span>
              </p>
            </div>
          </div>
          {!isPremium ? (
            <div className={cn(SHELL_UPGRADE_STUB, 'mt-3')} aria-label={t('shell.planUpgradeHint')}>
              <p className="text-label-sm text-on-surface-variant">{t('shell.planUpgrade')}</p>
              <p className="mt-0.5 text-label-sm font-medium text-primary">{t('shell.planComingSoon')}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
