import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { PrototypePageLayout } from '@/pages/prototypes/PrototypePageLayout'
import { useTranslation } from 'react-i18next'

export function DeepFocusPrototypePage() {
  const { t } = useTranslation()

  return (
    <PrototypePageLayout activeNav="prototype-deep-focus" titleKey="prototype.deepFocus.title">
      <p className="mb-6 text-sm text-on-surface-variant">{t('prototype.deepFocus.intro')}</p>
      <div className="grid gap-4 lg:grid-cols-12">
        <section className="glass-panel space-y-4 rounded-card p-sm lg:col-span-3">
          <h3 className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
            {t('prototype.deepFocus.bioTitle')}
          </h3>
          <div>
            <p className="text-xs text-on-surface-variant">{t('prototype.deepFocus.heartRate')}</p>
            <p className="font-display text-2xl text-primary">
              72 <span className="text-xs uppercase opacity-60">BPM</span>
            </p>
          </div>
          <div className="h-1 w-full bg-surface-variant">
            <div className="h-full w-[65%] bg-primary" />
          </div>
        </section>
        <section className="motivator-card flex flex-col items-center justify-center p-10 lg:col-span-6">
          <p className="font-display text-xs uppercase tracking-widest text-primary">
            {t('prototype.deepFocus.sessionLabel')}
          </p>
          <p className="mt-4 font-display text-5xl font-bold tabular-nums text-on-surface">47:12</p>
          <p className="mt-2 text-sm text-on-surface-variant">{t('prototype.deepFocus.taskName')}</p>
          <div className="mt-8 flex gap-3">
            <button type="button" className="btn-secondary px-6 py-2" disabled>
              {t('prototype.deepFocus.pause')}
            </button>
            <button type="button" className="btn-primary px-6 py-2" disabled>
              {t('prototype.deepFocus.complete')}
            </button>
          </div>
        </section>
        <section className="glass-panel space-y-3 rounded-card p-sm lg:col-span-3">
          <h3 className="font-display text-xs uppercase tracking-widest text-on-surface-variant">
            {t('prototype.deepFocus.aiTitle')}
          </h3>
          <p className="text-sm text-on-surface-variant">{t('prototype.deepFocus.aiBody')}</p>
          <MaterialIcon name="psychology" className="text-primary/40" size={48} />
        </section>
      </div>
    </PrototypePageLayout>
  )
}
