import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { PrototypeBanner } from '@/components/prototypes/PrototypeBanner'

type PrototypePageLayoutProps = {
  titleKey: string
  children: ReactNode
}

export function PrototypePageLayout({ titleKey, children }: PrototypePageLayoutProps) {
  const { t } = useTranslation()

  return (
    <MotivatorShell activeNav="settings" wide title={t(titleKey)}>
      <PrototypeBanner />
      {children}
    </MotivatorShell>
  )
}
