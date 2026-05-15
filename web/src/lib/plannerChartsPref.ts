const STORAGE_KEY = 'motivator_planner_charts_hidden'

export function readPlannerChartsHidden(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writePlannerChartsHidden(hidden: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0')
  } catch {
    /* ignore quota / private mode */
  }
}
