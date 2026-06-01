import { useTranslation } from 'react-i18next'
import { AiMarkdown } from '@/components/ai/AiMarkdown'
import type { DiscussionReply } from '@/lib/discussionsApi'

/** A single reply in a thread — markdown body + timestamp. */
export function DiscussionReplyItem({ reply }: { reply: DiscussionReply }) {
  const { i18n } = useTranslation()
  const ts = new Date(reply.created_at)
  const label = Number.isNaN(ts.getTime())
    ? reply.created_at
    : ts.toLocaleString(i18n.language, {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })

  return (
    <div className="rounded-lg border border-surface-variant bg-surface-container-low/50 p-sm md:p-3">
      <AiMarkdown text={reply.body} />
      <p className="mt-1.5 text-xs text-on-surface-variant/60">{label}</p>
    </div>
  )
}
