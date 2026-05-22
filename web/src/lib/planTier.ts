/** План подписки (фаза 8). Пока всегда free — UI готов под premium. */
export type PlanTier = 'free' | 'premium'

export function getPlanTier(): PlanTier {
  return 'free'
}
