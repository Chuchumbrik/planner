import { supabase } from '@/lib/supabase'

/** Whether the user already has a vault row on the server (any ciphertext). */
export async function hasRemoteVault(userId: string): Promise<boolean> {
  if (!supabase) return false
  const { data, error } = await supabase
    .from('user_vault')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return Boolean(data?.user_id)
}
