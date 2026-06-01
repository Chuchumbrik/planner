import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { RoleBadge } from '@/components/admin/RoleBadge'
import type { MotivatorRoleRow } from '@/types/adminMonitoring'
import {
  MODAL_CLOSE_BTN,
  MODAL_FOOTER,
  MODAL_HEADER,
  MODAL_OVERLAY,
  MODAL_SHELL,
  MODAL_TITLE,
  SETTINGS_BTN_SECONDARY,
} from '@/lib/designClasses'
import { cn } from '@/lib/cn'

function roleLabelKey(role: MotivatorRoleRow['motivator_role']): string {
  if (role === 'admin') return 'settings.adminRolesOptionAdmin'
  if (role === 'beta_tester') return 'settings.adminRolesOptionBeta'
  return 'settings.adminRolesOptionUser'
}

export type PendingRoleChange = {
  user: MotivatorRoleRow
  newRole: MotivatorRoleRow['motivator_role']
}

export function AdminConfirmRoleModal({
  pending,
  currentUserId,
  busy,
  onConfirm,
  onCancel,
}: {
  pending: PendingRoleChange
  currentUserId: string | undefined
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const { t } = useTranslation()
  const isSelfDemote =
    pending.user.id === currentUserId &&
    pending.user.motivator_role === 'admin' &&
    pending.newRole !== 'admin'

  // Self-demote requires an explicit checkbox acknowledgement before the Save
  // button becomes enabled — enforces the "Confirm again" promise mechanically.
  const [acknowledged, setAcknowledged] = useState(false)
  const saveDisabled = busy || (isSelfDemote && !acknowledged)

  return (
    <div className={MODAL_OVERLAY} onClick={busy ? undefined : onCancel}>
      <div className={cn(MODAL_SHELL, 'max-w-sm')} onClick={(e) => e.stopPropagation()}>
        <div className={MODAL_HEADER}>
          <h2 className={MODAL_TITLE}>{t('settings.adminRolesColRole')}</h2>
          <button
            type="button"
            className={MODAL_CLOSE_BTN}
            onClick={onCancel}
            disabled={busy}
          >
            <MaterialIcon name="close" size={20} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-sm md:p-md">
          <p className="break-all text-sm text-on-surface">
            {pending.user.email || pending.user.id}
          </p>

          <div className="flex items-center gap-3">
            <RoleBadge role={pending.user.motivator_role} />
            <MaterialIcon name="arrow_forward" size={16} className="text-on-surface-variant/50" />
            <RoleBadge role={pending.newRole} />
          </div>

          {isSelfDemote ? (
            <div className="space-y-2 rounded-lg border border-amber-400/30 bg-amber-400/10 p-3">
              <p className="text-sm font-medium text-amber-400">
                {t('settings.adminRolesConfirmSelfDemote')}
              </p>
              <p className="text-xs text-amber-400/80">
                {t('settings.adminRolesConfirmSelfDemoteAgain')}
              </p>
              <label className="mt-2 flex cursor-pointer items-start gap-2 text-xs text-amber-400">
                <input
                  type="checkbox"
                  className="motivator-checkbox mt-0.5 h-3.5 w-3.5 shrink-0"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  disabled={busy}
                />
                <span>{t('settings.adminRolesSelfDemoteAck')}</span>
              </label>
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant">
              {t('settings.adminRolesConfirmChange', {
                email: pending.user.email || pending.user.id,
                role: t(roleLabelKey(pending.newRole)),
              })}
            </p>
          )}
        </div>

        <div className={MODAL_FOOTER}>
          <div className="flex justify-end gap-2 py-1">
            <button
              type="button"
              className={SETTINGS_BTN_SECONDARY}
              onClick={onCancel}
              disabled={busy}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className={cn(
                SETTINGS_BTN_SECONDARY,
                isSelfDemote
                  ? 'border-amber-400/40 text-amber-400 hover:bg-amber-400/10'
                  : 'border-primary/40 text-primary hover:bg-primary/10',
                saveDisabled && 'opacity-50',
              )}
              onClick={onConfirm}
              disabled={saveDisabled}
            >
              {busy ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
