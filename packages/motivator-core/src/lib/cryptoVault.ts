/** Итерации PBKDF2 (контракт для совместимости с нативными клиентами — см. docs/VAULT_CRYPTO_CONTRACT.md). */
export const PBKDF2_ITERATIONS = 310_000

/** AES-GCM IV длина в байтах (фиксированная длина для Web Crypto AES-GCM). */
export const AES_GCM_IV_LENGTH_BYTES = 12

/** Длина ключа AES-256 в битах. */
export const AES_256_KEY_BITS = 256

function bytesToB64(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (let i = 0; i < u8.length; i++) binary += String.fromCharCode(u8[i]!)
  return btoa(binary)
}

function b64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

export function generateSeedB64(): string {
  const seed = crypto.getRandomValues(new Uint8Array(32))
  return bytesToB64(seed)
}

function asBufferSource(data: Uint8Array): BufferSource {
  return new Uint8Array(data.buffer, data.byteOffset, data.byteLength) as BufferSource
}

/**
 * Сырой материал AES-256 (32 байта) после PBKDF2.
 * Совпадает с ключом из `deriveAesKey`; используется в контракт-тестах (ключ не extractable).
 */
export async function deriveAes256RawKey(seedB64: string, password: string): Promise<Uint8Array> {
  const salt = b64ToBytes(seedB64)
  const baseKey = await crypto.subtle.importKey(
    'raw',
    asBufferSource(utf8(password)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: asBufferSource(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    AES_256_KEY_BITS,
  )
  return new Uint8Array(bits)
}

export async function deriveAesKey(seedB64: string, password: string): Promise<CryptoKey> {
  const raw = await deriveAes256RawKey(seedB64, password)
  return crypto.subtle.importKey(
    'raw',
    asBufferSource(raw),
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Формат: ivB64.ciphertextB64 */
export async function encryptUtf8(plaintext: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH_BYTES))
  const ct = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: asBufferSource(iv) },
    key,
    asBufferSource(utf8(plaintext)),
  )
  return `${bytesToB64(iv)}.${bytesToB64(ct)}`
}

export async function decryptUtf8(payload: string, key: CryptoKey): Promise<string> {
  const [ivB64, ctB64] = payload.split('.')
  if (!ivB64 || !ctB64) throw new Error('Неверный формат ciphertext')
  const iv = b64ToBytes(ivB64)
  const ct = b64ToBytes(ctB64)
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: asBufferSource(iv) },
    key,
    asBufferSource(ct),
  )
  return new TextDecoder().decode(plain)
}
