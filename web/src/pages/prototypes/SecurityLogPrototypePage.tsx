import { PrototypePageLayout } from '@/pages/prototypes/PrototypePageLayout'
import { useTranslation } from 'react-i18next'

const MOCK_EVENTS = [
  { time: '14:32', kind: 'prototype.securityLog.e1' },
  { time: '12:08', kind: 'prototype.securityLog.e2' },
  { time: '09:41', kind: 'prototype.securityLog.e3' },
  { time: 'Yesterday', kind: 'prototype.securityLog.e4' },
] as const

export function SecurityLogPrototypePage() {
  const { t } = useTranslation()

  return (
    <PrototypePageLayout titleKey="prototype.securityLog.title">
      <p className="mb-6 text-sm text-on-surface-variant">{t('prototype.securityLog.intro')}</p>
      <div className="motivator-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-surface-variant bg-surface-container-high font-display text-xs uppercase tracking-wide text-on-surface-variant">
              <th className="px-4 py-3">{t('prototype.securityLog.colTime')}</th>
              <th className="px-4 py-3">{t('prototype.securityLog.colEvent')}</th>
              <th className="px-4 py-3">{t('prototype.securityLog.colStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_EVENTS.map((row) => (
              <tr key={row.kind} className="border-b border-surface-variant/60">
                <td className="px-4 py-3 font-mono text-on-surface-variant">{row.time}</td>
                <td className="px-4 py-3 text-on-surface">{t(row.kind)}</td>
                <td className="px-4 py-3">
                  <span className="rounded border border-outline-variant bg-surface-container-high px-2 py-0.5 text-xs text-primary">
                    {t('prototype.securityLog.statusOk')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrototypePageLayout>
  )
}
