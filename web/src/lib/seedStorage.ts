/** Keys shared with `VaultProvider` — read-only helpers for settings / export UI. */
export const MOTIVATOR_SEED_STORAGE_KEY = 'motivator_seed_b64'
export const MOTIVATOR_SEED_WARNING_ACK_KEY = 'motivator_seed_warning_ack'

export function getStoredSeedB64(): string | null {
  const raw = localStorage.getItem(MOTIVATOR_SEED_STORAGE_KEY)
  const trimmed = raw?.trim().replace(/\s+/g, '') ?? ''
  return trimmed.length > 0 ? trimmed : null
}

export function hasAcknowledgedSeedWarning(): boolean {
  return localStorage.getItem(MOTIVATOR_SEED_WARNING_ACK_KEY) === '1'
}

export function setAcknowledgedSeedWarning(): void {
  localStorage.setItem(MOTIVATOR_SEED_WARNING_ACK_KEY, '1')
}
