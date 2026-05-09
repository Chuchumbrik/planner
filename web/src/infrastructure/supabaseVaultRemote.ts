import type { SupabaseClient } from '@supabase/supabase-js'

import type { VaultRemotePort } from '@motivator/core'

function parseVersion(raw: unknown): number {
  return typeof raw === 'number' && raw > 0 ? raw : 1
}

export function createSupabaseVaultRemote(client: SupabaseClient): VaultRemotePort {
  return {
    async fetchVault(userId: string) {
      const { data, error } = await client
        .from('user_vault')
        .select('ciphertext, version')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw new Error(error.message)
      if (!data?.ciphertext) return null
      return {
        ciphertext: data.ciphertext as string,
        version: parseVersion(data.version),
      }
    },

    async upsertVault(userId: string, ciphertext: string, version: number) {
      const { error } = await client.from('user_vault').upsert(
        {
          user_id: userId,
          ciphertext,
          version,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      )
      if (error) throw new Error(error.message)
    },
  }
}
