import { pbkdf2Sync } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  AES_GCM_IV_LENGTH_BYTES,
  decryptUtf8,
  deriveAes256RawKey,
  deriveAesKey,
  encryptUtf8,
  PBKDF2_ITERATIONS,
} from './cryptoVault'

/** 32 нулевых байта в Base64 — см. docs/VAULT_CRYPTO_CONTRACT.md */
const GOLDEN_SEED_B64 = 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
const GOLDEN_PASSWORD = 'contract-test-password'
const GOLDEN_AES_KEY_HEX =
  '63c24bd708d1b43c7ce0cebe8b34780d1309b847a62af172851ff3661a40db7a'

describe('cryptoVault contract', () => {
  it('использует PBKDF2 с числом итераций из контракта', () => {
    expect(PBKDF2_ITERATIONS).toBe(310_000)
  })

  it('deriveAes256RawKey / deriveAesKey дают эталон PBKDF2 (golden)', async () => {
    const raw = await deriveAes256RawKey(GOLDEN_SEED_B64, GOLDEN_PASSWORD)
    const hex = Buffer.from(raw).toString('hex')
    expect(hex).toBe(GOLDEN_AES_KEY_HEX)
    const salt = Buffer.from(GOLDEN_SEED_B64, 'base64')
    const nodeKey = pbkdf2Sync(GOLDEN_PASSWORD, salt, PBKDF2_ITERATIONS, 32, 'sha256')
    expect(Buffer.from(raw).equals(nodeKey)).toBe(true)
    const key = await deriveAesKey(GOLDEN_SEED_B64, GOLDEN_PASSWORD)
    const plain = 'parity-check'
    expect(await decryptUtf8(await encryptUtf8(plain, key), key)).toBe(plain)
  })

  it('encryptUtf8 / decryptUtf8 — симметричный roundtrip UTF-8', async () => {
    const key = await deriveAesKey(GOLDEN_SEED_B64, GOLDEN_PASSWORD)
    const plain = 'Тест UTF-8 🗝️ и символы <>&"'
    const blob = await encryptUtf8(plain, key)
    const parts = blob.split('.')
    expect(parts).toHaveLength(2)
    const iv = Buffer.from(parts[0]!, 'base64')
    expect(iv.length).toBe(AES_GCM_IV_LENGTH_BYTES)
    expect(await decryptUtf8(blob, key)).toBe(plain)
  })

  it('формат ciphertext: два сегмента base64, разделённые точкой', async () => {
    const key = await deriveAesKey(generateSeed(), 'pw')
    const blob = await encryptUtf8('x', key)
    expect(blob.includes('.')).toBe(true)
    expect(blob.split('.').every((p) => /^[A-Za-z0-9+/]+=*$/.test(p))).toBe(true)
  })
})

function generateSeed(): string {
  const b = new Uint8Array(32)
  crypto.getRandomValues(b)
  let binary = ''
  for (let i = 0; i < b.length; i++) binary += String.fromCharCode(b[i]!)
  return btoa(binary)
}
