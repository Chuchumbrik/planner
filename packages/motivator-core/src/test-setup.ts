import { webcrypto } from 'node:crypto'

// Node 18 в node-окружении vitest не имеет глобального `crypto` (Web Crypto API),
// из-за чего падают тесты, использующие `crypto.subtle` (например cryptoVault).
// На Node 20+ глобальный crypto уже есть — guard делает это no-op.
if (!globalThis.crypto) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(globalThis as any).crypto = webcrypto
}
