import { useTranslation } from 'react-i18next'
import { PrototypePageLayout } from '@/pages/prototypes/PrototypePageLayout'

const MEETINGS_PLACEHOLDER_SRC = '/prototype/meetings-placeholder.svg'

const MOCK_SLOTS = [
  { key: 'prototype.meetings.slotMorning', busy: false },
  { key: 'prototype.meetings.slotConflict', busy: true },
  { key: 'prototype.meetings.slotFree', busy: false, suggested: true },
  { key: 'prototype.meetings.slotConflict2', busy: true },
] as const

export function MeetingsPrototypePage() {
  const { t } = useTranslation()

  return (
    <PrototypePageLayout activeNav="prototype-meetings" titleKey="prototype.meetings.title">
      <p className="mb-6 text-sm text-on-surface-variant">{t('prototype.meetings.intro')}</p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="motivator-card p-6">
          <h2 className="font-display text-sm font-semibold text-on-surface">
            {t('prototype.meetings.formTitle')}
          </h2>
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-label-sm text-on-surface-variant">
                {t('prototype.meetings.participantLabel')}
              </span>
              <input
                type="text"
                readOnly
                value={t('prototype.meetings.participantSample')}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              />
            </label>
            <label className="block">
              <span className="text-label-sm text-on-surface-variant">
                {t('prototype.meetings.durationLabel')}
              </span>
              <input
                type="text"
                readOnly
                value={t('prototype.meetings.durationSample')}
                className="mt-1 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface"
              />
            </label>
            <p className="rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-on-surface">
              {t('prototype.meetings.suggestedSlot')}
            </p>
            <button type="button" disabled className="btn-primary w-full py-2.5 opacity-60">
              {t('prototype.meetings.createButton')}
            </button>
          </div>
        </section>

        <section className="motivator-card p-6">
          <h2 className="font-display text-sm font-semibold text-on-surface">
            {t('prototype.meetings.availabilityTitle')}
          </h2>
          <p className="mt-1 text-xs text-on-surface-variant">{t('prototype.meetings.availabilityHint')}</p>
          <ul className="mt-4 space-y-2" aria-label={t('prototype.meetings.availabilityTitle')}>
            {MOCK_SLOTS.map((slot) => (
              <li
                key={slot.key}
                className={
                  'flex items-center justify-between rounded-lg px-3 py-2 text-sm ' +
                  (slot.busy
                    ? 'bg-error/10 text-on-surface-variant'
                    : 'suggested' in slot && slot.suggested
                      ? 'border border-primary/40 bg-primary/10 text-on-surface'
                      : 'bg-surface-container-high text-on-surface')
                }
              >
                <span>{t(slot.key)}</span>
                <span className="text-xs uppercase tracking-wide">
                  {slot.busy ? t('prototype.meetings.busy') : t('prototype.meetings.free')}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="mt-8 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
        <img
          src={MEETINGS_PLACEHOLDER_SRC}
          alt={t('prototype.meetings.imageAlt')}
          className="block h-auto w-full"
          width={640}
          height={360}
          loading="lazy"
          decoding="async"
        />
      </div>

      <p className="mt-4 text-center text-sm text-on-surface-variant">{t('prototype.meetings.hint')}</p>
    </PrototypePageLayout>
  )
}
