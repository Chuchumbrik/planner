/** Shared kernel: домен vault, крипто, календарь/повторы без привязки к React. */

export * from './domain/ports'
export * from './domain/vaultOperations'

export * from './vault/types'
export * from './vault/normalize'
export * from './vault/colors'

export * from './lib/cryptoVault'
export * from './lib/recurrence'
export * from './lib/timeblocking'
export * from './lib/calendar'
export * from './lib/localDate'
export * from './lib/timeClock'
export * from './lib/estimateInput'
export * from './lib/reporting/recurringSeries'
export * from './lib/reporting/vaultAnalytics'
export * from './lib/eod/eodRitual'

export * from './sync/constants'
