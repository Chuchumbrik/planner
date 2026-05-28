import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

const components: Components = {
  p: ({ children }) => <p className="mb-1.5 last:mb-0 text-body-sm text-on-surface">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-on-surface">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="mb-1.5 ml-3 list-disc space-y-0.5 last:mb-0">{children}</ul>,
  ol: ({ children }) => <ol className="mb-1.5 ml-3 list-decimal space-y-0.5 last:mb-0">{children}</ol>,
  li: ({ children }) => <li className="text-body-sm text-on-surface">{children}</li>,
  h1: ({ children }) => <p className="mb-1 font-semibold text-on-surface">{children}</p>,
  h2: ({ children }) => <p className="mb-1 font-semibold text-on-surface">{children}</p>,
  h3: ({ children }) => <p className="mb-0.5 font-medium text-on-surface">{children}</p>,
  code: ({ children, className }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) return (
      <code className="block rounded bg-surface-variant/60 px-2 py-1 font-mono text-xs text-on-surface-variant">
        {children}
      </code>
    )
    return <code className="rounded bg-surface-variant/60 px-1 font-mono text-xs text-on-surface-variant">{children}</code>
  },
  blockquote: ({ children }) => (
    <blockquote className="mb-1.5 border-l-2 border-primary/40 pl-2.5 text-on-surface-variant last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-2 border-surface-variant" />,
  a: ({ href, children }) => (
    <a href={href} className="text-primary underline underline-offset-2 hover:opacity-80" target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  ),
}

export function AiMarkdown({ text }: { text: string }) {
  return (
    <div className="min-w-0">
      <ReactMarkdown components={components}>{text}</ReactMarkdown>
    </div>
  )
}
