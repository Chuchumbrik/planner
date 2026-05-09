/**
 * Порты инфраструктуры (реализации могут быть Supabase, mock в тестах и т.д.).
 */

export type UserVaultRow = {
  ciphertext: string
  version: number
}

export type VaultRemotePort = {
  fetchVault(userId: string): Promise<UserVaultRow | null>
  upsertVault(userId: string, ciphertext: string, version: number): Promise<void>
}
