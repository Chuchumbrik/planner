/** Режим отображения вкладки планировщика: почасовой таймлайн или список/агенда (Phase 13). */
export type PlannerViewMode = 'timeline' | 'list'

const KEY_DAY = 'motivator_planner_mode_day'
const KEY_WEEK = 'motivator_planner_mode_week'

function read(key: string, fallback: PlannerViewMode): PlannerViewMode {
  try {
    const v = localStorage.getItem(key)
    return v === 'timeline' || v === 'list' ? v : fallback
  } catch {
    return fallback
  }
}

function write(key: string, mode: PlannerViewMode): void {
  try {
    localStorage.setItem(key, mode)
  } catch {
    /* ignore quota / private mode */
  }
}

/** День по умолчанию — список (как было до Phase 13). */
export function readDayViewMode(): PlannerViewMode {
  return read(KEY_DAY, 'list')
}
export function writeDayViewMode(mode: PlannerViewMode): void {
  write(KEY_DAY, mode)
}

/** Неделя по умолчанию — таймлайн (как было до Phase 13). */
export function readWeekViewMode(): PlannerViewMode {
  return read(KEY_WEEK, 'timeline')
}
export function writeWeekViewMode(mode: PlannerViewMode): void {
  write(KEY_WEEK, mode)
}
