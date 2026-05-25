import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router-dom'
import { SETTINGS_CARD } from '@/lib/designClasses'
import type { LegalDocId } from '@/lib/legalLinks'

const DOC_IDS: LegalDocId[] = ['privacy', 'terms', 'personalData']

function isLegalDocId(id: string | undefined): id is LegalDocId {
  return DOC_IDS.includes(id as LegalDocId)
}

export function LegalDocumentPage() {
  const { docId } = useParams<{ docId: string }>()
  const { t } = useTranslation()

  if (!isLegalDocId(docId)) {
    return <Navigate to="/" replace />
  }

  const titleKey = `legal.doc.${docId}.title` as const
  const bodyKey = `legal.doc.${docId}.body` as const
  const placeholderKey = `legal.doc.${docId}.placeholder` as const

  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background px-4 py-8 text-on-surface">
      <Link className="text-sm text-primary hover:text-primary-fixed" to="/settings">
        {t('legal.backToSettings')}
      </Link>
      <h1 className="mt-4 font-display text-xl font-semibold">{t(titleKey)}</h1>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{t(bodyKey)}</p>
      <div className={`mt-6 ${SETTINGS_CARD} text-sm leading-relaxed text-on-surface`}>
        {t(placeholderKey)}
      </div>
    </div>
  )
}
