import { useTranslation } from 'react-i18next'
import { MaterialIcon } from '@/components/ui/MaterialIcon'

/** Заглушка поля «AI Command» из Stitch (без бэкенда). */
export function AiCommandStub() {
  const { t } = useTranslation()

  return (
    <div
      className="mb-4 hidden min-w-0 flex-1 items-center gap-2 rounded border border-surface-variant bg-surface-container px-3 py-2 md:flex lg:max-w-md"
      title={t('app.aiCommandStubHint')}
    >
      <MaterialIcon name="bolt" className="shrink-0 text-on-surface-variant" size={18} />
      <input
        type="text"
        disabled
        readOnly
        aria-disabled="true"
        aria-label={t('app.aiCommandStubAria')}
        placeholder={t('app.aiCommandStubPlaceholder')}
        className="min-w-0 flex-1 cursor-not-allowed border-none bg-transparent font-sans text-sm text-on-surface-variant placeholder:text-on-surface-variant/70 focus:ring-0"
      />
      <span className="shrink-0 rounded border border-outline-variant bg-surface-container-high px-2 py-0.5 font-display text-[10px] uppercase tracking-wider text-on-surface-variant">
        {t('app.aiCommandStubBadge')}
      </span>
    </div>
  )
}
