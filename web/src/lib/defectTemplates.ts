/** Идентификаторы готовых шаблонов (строки i18n: `settings.defectTemplate.<id>.*`). */

export const DEFECT_TEMPLATE_IDS = [
  'notifications',
  'planner_day',
  'week_view',
  'settings_block',
  'sync_vault',
] as const

export type DefectTemplateId = (typeof DEFECT_TEMPLATE_IDS)[number]
