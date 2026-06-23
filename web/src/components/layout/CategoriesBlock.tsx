import { useTranslation } from 'react-i18next'
import { TASK_COLOR_HEX, type TaskGroup } from '@motivator/core'
import { usePlannerFilter } from '@/context/PlannerFilterContext'
import { cn } from '@/lib/cn'

type Props = {
  groups: TaskGroup[]
  disabled?: boolean
}

/**
 * Постоянный блок фильтров по группам в левой панели планировщика (Phase 13, BR-D-011).
 * Цвет тогла = цвет группы (`TASK_COLOR_HEX[group.colorKey]`) = цвет карточек/точек —
 * единая система чтения. Клик по активной группе сбрасывает фильтр в «все».
 */
export function CategoriesBlock({ groups, disabled = false }: Props) {
  const { t } = useTranslation()
  const { filterGroupId, setFilterGroupId } = usePlannerFilter()
  const sorted = [...groups].sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <section aria-label={t('app.group')} className="flex flex-col gap-2">
      <h3 className="text-label-sm uppercase text-on-surface-variant">{t('app.group')}</h3>
      <ul className="flex flex-col gap-1">
        <li>
          <button
            type="button"
            disabled={disabled}
            aria-pressed={filterGroupId === 'all'}
            onClick={() => setFilterGroupId('all')}
            className={cn(
              'motivator-chip w-full justify-start disabled:opacity-50',
              filterGroupId === 'all' && 'motivator-chip-active',
            )}
          >
            {t('app.filterAllGroups')}
          </button>
        </li>
        {sorted.map((g) => {
          const active = filterGroupId === g.id
          return (
            <li key={g.id}>
              <button
                type="button"
                disabled={disabled}
                aria-pressed={active}
                onClick={() => setFilterGroupId(active ? 'all' : g.id)}
                className={cn(
                  'motivator-chip w-full justify-start disabled:opacity-50',
                  active && 'motivator-chip-active',
                )}
              >
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: TASK_COLOR_HEX[g.colorKey] ?? TASK_COLOR_HEX.zinc }}
                />
                <span className="truncate">{g.name}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
