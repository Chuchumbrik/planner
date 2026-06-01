import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CreateDiscussionModal } from '@/components/admin/discussions/CreateDiscussionModal'
import { DiscussionList } from '@/components/admin/discussions/DiscussionList'
import { DiscussionThread } from '@/components/admin/discussions/DiscussionThread'
import { ResolveDiscussionModal } from '@/components/admin/discussions/ResolveDiscussionModal'
import { SyncDiscussionModal } from '@/components/admin/discussions/SyncDiscussionModal'
import { useDiscussions } from '@/components/admin/discussions/useDiscussions'
import { useDiscussionThread } from '@/components/admin/discussions/useDiscussionThread'
import { MotivatorShell } from '@/components/layout/MotivatorShell'
import { RequireVault } from '@/components/RequireVault'
import { MaterialIcon } from '@/components/ui/MaterialIcon'
import { SETTINGS_TAB_PANEL_INTRO, SETTINGS_TAB_PANEL_TITLE } from '@/lib/designClasses'
import { supabase } from '@/lib/supabase'

function AdminDiscussionsPageInner() {
  const { t } = useTranslation()
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [showResolve, setShowResolve] = useState(false)
  const [showSync, setShowSync] = useState(false)

  const listState = useDiscussions(supabase)
  const threadState = useDiscussionThread(supabase, id ?? null)

  const refreshBoth = useCallback(() => {
    threadState.reload()
    listState.reload()
  }, [threadState, listState])

  // Returning to the list reloads it so the just-opened thread's unread badge
  // clears (mark-read fired while viewing it, but the list state is stale).
  const backToList = useCallback(() => {
    listState.reload()
    navigate('/admin/discussions')
  }, [listState, navigate])

  if (!supabase) {
    return <Navigate to="/app" replace />
  }

  return (
    <MotivatorShell activeNav="prototype-admin" wide align="left" title={t('admin.discussions.title')}>
      <div className="admin-summary-stagger mx-auto w-full max-w-3xl">
        <header className="mb-md">
          <h2 className={SETTINGS_TAB_PANEL_TITLE}>{t('admin.discussions.title')}</h2>
          <p className={SETTINGS_TAB_PANEL_INTRO}>{t('admin.discussions.intro')}</p>
        </header>

        {id ? (
          threadState.discussion ? (
            <DiscussionThread
              discussion={threadState.discussion}
              replies={threadState.replies}
              loadBusy={threadState.loadBusy}
              supabase={supabase}
              onBack={backToList}
              onChanged={refreshBoth}
              onResolveClick={() => setShowResolve(true)}
              onSyncClick={() => setShowSync(true)}
            />
          ) : threadState.loadError ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={backToList}
                className="inline-flex items-center gap-1.5 text-body-sm text-on-surface-variant transition-colors hover:text-on-surface"
              >
                <MaterialIcon name="arrow_back" size={16} />
                {t('admin.discussions.back')}
              </button>
              <p className="text-body-sm text-amber-300">{threadState.loadError}</p>
            </div>
          ) : (
            <p className="py-8 text-center text-body-sm text-on-surface-variant">{t('common.loading')}</p>
          )
        ) : (
          <DiscussionList
            discussions={listState.discussions}
            loadBusy={listState.loadBusy}
            loadError={listState.loadError}
            onSelect={(threadId) => navigate(`/admin/discussions/${threadId}`)}
            onCreateClick={() => setShowCreate(true)}
            onRetry={listState.reload}
          />
        )}
      </div>

      {showCreate ? (
        <CreateDiscussionModal
          supabase={supabase}
          onCreated={(d) => {
            setShowCreate(false)
            listState.reload()
            navigate(`/admin/discussions/${d.id}`)
          }}
          onClose={() => setShowCreate(false)}
        />
      ) : null}

      {showResolve && id ? (
        <ResolveDiscussionModal
          discussionId={id}
          supabase={supabase}
          onResolved={() => {
            setShowResolve(false)
            refreshBoth()
          }}
          onClose={() => setShowResolve(false)}
        />
      ) : null}

      {showSync && id ? (
        <SyncDiscussionModal
          discussionId={id}
          supabase={supabase}
          onSynced={() => {
            setShowSync(false)
            refreshBoth()
          }}
          onClose={() => setShowSync(false)}
        />
      ) : null}
    </MotivatorShell>
  )
}

export function AdminDiscussionsPage() {
  return (
    <RequireVault>
      <AdminDiscussionsPageInner />
    </RequireVault>
  )
}
