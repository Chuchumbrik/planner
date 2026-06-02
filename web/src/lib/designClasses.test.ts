import { describe, it, expect } from 'vitest'
import { shellSidebarClass } from './designClasses'

describe('shellSidebarClass', () => {
  // Регрессия: мобильный overlay-вариант НЕ должен содержать `hidden` — иначе
  // (т.к. `cn` не делает tailwind-merge) в DOM попадали и `hidden`, и `flex`,
  // `hidden` выигрывал по порядку в CSS, и мобильное меню становилось display:none
  // (виден только тёмный backdrop, в админку не попасть).
  it('mobile variant is visible on small screens (flex md:hidden, no bare hidden)', () => {
    const cls = shellSidebarClass(false, true)
    expect(cls).toContain('flex')
    expect(cls).toContain('md:hidden')
    expect(cls.split(' ')).not.toContain('hidden')
  })

  it('desktop variant is hidden on small screens (hidden md:flex)', () => {
    const cls = shellSidebarClass(false)
    expect(cls.split(' ')).toContain('hidden')
    expect(cls).toContain('md:flex')
    expect(cls.split(' ')).not.toContain('flex')
  })

  it('collapsed toggles the width', () => {
    expect(shellSidebarClass(true)).toContain('w-16')
    expect(shellSidebarClass(false)).toContain('w-64')
  })
})
