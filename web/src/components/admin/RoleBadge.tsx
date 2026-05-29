import { cn } from '@/lib/cn'

type Role = 'admin' | 'beta_tester' | 'user'

const STYLES: Record<Role, string> = {
  admin: 'bg-primary/10 text-primary border-primary/30',
  beta_tester: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  user: 'bg-surface-container-highest text-on-surface-variant border-surface-variant',
}

const LABELS: Record<Role, string> = {
  admin: 'Admin',
  beta_tester: 'Beta',
  user: 'User',
}

type Props = {
  role: Role
  className?: string
}

export function RoleBadge({ role, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded border px-1.5 py-0.5',
        'text-[10px] font-semibold uppercase tracking-wide',
        STYLES[role],
        className,
      )}
    >
      {LABELS[role]}
    </span>
  )
}
