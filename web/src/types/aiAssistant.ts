export type AiMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  streaming?: boolean
  suggestions?: string[]
  /** Subtle system note rendered centered after a user confirmation action */
  kind?: 'confirmation'
}

export type AiRecurrenceRule =
  | { kind: 'daily' }
  | { kind: 'everyNDays'; n: number }
  | { kind: 'weekly'; weekdays: number[] }

export type AiTaskProposal = {
  title: string
  groupName?: string | null
  scheduledLocalDate?: string | null
  estimatedMinutes?: number | null
  timeMode?: 'none' | 'start' | 'end'
  timeMinutesFromMidnight?: number | null
  priorityRank?: number
  checklistItems?: string[]
  recurrence?: AiRecurrenceRule | null
  recurrenceAnchorLocalDate?: string | null
}

export type AiTaskEdit = {
  taskTitle: string
  changes: {
    title?: string
    scheduledLocalDate?: string | null
    priorityRank?: number | null
    groupName?: string | null
    done?: boolean
    estimatedMinutes?: number | null
    checklistItems?: string[] | null
  }
}

export type AiAction =
  | { type: 'create_tasks'; tasks: AiTaskProposal[] }
  | { type: 'edit_tasks'; edits: AiTaskEdit[] }
  | { type: 'delete_tasks'; taskTitles: string[] }
  | { type: 'clarify'; question: string; options?: string[] }
  | { type: 'none' }

export type AiStreamChunk =
  | { t: string }             // text delta
  | { a: AiAction }           // action
  | { e: 'rate_limited' }     // error
