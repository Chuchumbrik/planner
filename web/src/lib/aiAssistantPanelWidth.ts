const STORAGE_KEY = 'motivator-ai-panel-width'

export const AI_PANEL_WIDTH_MIN = 280
export const AI_PANEL_WIDTH_MAX = 560
export const AI_PANEL_WIDTH_DEFAULT = 384

export function readAiAssistantPanelWidth(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return AI_PANEL_WIDTH_DEFAULT
    const n = Number.parseInt(raw, 10)
    if (!Number.isFinite(n)) return AI_PANEL_WIDTH_DEFAULT
    return Math.min(AI_PANEL_WIDTH_MAX, Math.max(AI_PANEL_WIDTH_MIN, n))
  } catch {
    return AI_PANEL_WIDTH_DEFAULT
  }
}

export function writeAiAssistantPanelWidth(width: number): void {
  try {
    const clamped = Math.min(AI_PANEL_WIDTH_MAX, Math.max(AI_PANEL_WIDTH_MIN, Math.round(width)))
    localStorage.setItem(STORAGE_KEY, String(clamped))
  } catch {
    /* ignore quota / private mode */
  }
}
