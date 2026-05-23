import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { PrototypeBanner } from '@/components/prototypes/PrototypeBanner'
import type { MotivatorNavId } from '@/lib/shellNavigation'

type PrototypePageLayoutProps = {
  activeNav: MotivatorNavId
  titleKey?: string
  children: ReactNode
}

export function PrototypePageLayout({ activeNav, titleKey, children }: PrototypePageLayoutProps) {
  const { t } = useTranslation()

  return (
    <MotivatorShell activeNav={activeNav} wide title={titleKey ? t(titleKey) : undefined}>
      <PrototypeBanner />
      {children}
    </MotivatorShell>
  )
}
