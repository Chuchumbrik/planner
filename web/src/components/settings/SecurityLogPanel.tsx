import { useTranslation } from 'react-i18next'
import { SETTINGS_CARD, SETTINGS_SUBHEAD } from '@/lib/designClasses'

const MOCK_EVENTS = [
  { time: '14:32', kind: 'settings.securityLog.e1' },
  { time: '12:08', kind: 'settings.securityLog.e2' },
  { time: '09:41', kind: 'settings.securityLog.e3' },
  { time: 'Yesterday', kind: 'settings.securityLog.e4' },
] as const

/** Журнал событий безопасности (mock до post-MVP backend). */
export function SecurityLogPanel() {
  const { t } = useTranslation()

  return (
    <section id="security-log" className="scroll-mt-6">
      <h3 className={SETTINGS_SUBHEAD}>{t('settings.securityLog.title')}</h3>
      <p className="mt-2 text-body-sm text-on-surface-variant">{t('settings.securityLog.intro')}</p>
      <p className="mt-2 text-label-sm text-on-surface-variant">{t('settings.securityLog.previewNote')}</p>
      <div className={`mt-4 overflow-hidden ${SETTINGS_CARD} p-0`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] text-left text-sm">
            <thead>
              <tr className="border-b border-surface-variant bg-surface-container-high font-display text-xs uppercase tracking-wide text-on-surface-variant">
                <th className="px-4 py-3">{t('settings.securityLog.colTime')}</th>
                <th className="px-4 py-3">{t('settings.securityLog.colEvent')}</th>
                <th className="px-4 py-3">{t('settings.securityLog.colStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_EVENTS.map((row) => (
                <tr key={row.kind} className="border-b border-surface-variant/60 last:border-b-0">
                  <td className="px-4 py-3 font-mono text-on-surface-variant">{row.time}</td>
                  <td className="px-4 py-3 text-on-surface">{t(row.kind)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded border border-outline-variant bg-surface-container-high px-2 py-0.5 text-xs text-primary">
                      {t('settings.securityLog.statusOk')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
