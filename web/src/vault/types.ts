export type Task = {
  id: string
  title: string
  done: boolean
  createdAt: string
  updatedAt: string
}

export type VaultPayload = {
  schemaVersion: 1
  tasks: Task[]
}

export function emptyVault(): VaultPayload {
  return { schemaVersion: 1, tasks: [] }
}
