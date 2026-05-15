import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router-dom'
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
    <div className="mx-auto min-h-dvh max-w-lg px-4 py-8 text-zinc-100">
      <Link className="text-sm text-emerald-400 hover:text-emerald-300" to="/settings">
        {t('legal.backToSettings')}
      </Link>
      <h1 className="mt-4 text-xl font-semibold">{t(titleKey)}</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">{t(bodyKey)}</p>
      <div className="mt-6 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-4 text-sm leading-relaxed text-zinc-300">
        {t(placeholderKey)}
      </div>
    </div>
  )
}
