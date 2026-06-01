import { afterEach, describe, expect, it } from 'vitest'
import { collectDefectDeviceMeta } from './defectDeviceMeta'

function setViewport(width: number, height = 800, dpr = 1): void {
  Object.defineProperty(window, 'innerWidth', { value: width, configurable: true, writable: true })
  Object.defineProperty(window, 'innerHeight', { value: height, configurable: true, writable: true })
  Object.defineProperty(window, 'devicePixelRatio', { value: dpr, configurable: true, writable: true })
}

afterEach(() => {
  setViewport(1024, 768, 1)
})

describe('collectDefectDeviceMeta', () => {
  // TS-100
  it('width < 640 → phone', () => {
    setViewport(320)
    expect(collectDefectDeviceMeta().device_class).toBe('phone')
  })

  // TS-101
  it('640 <= width < 1024 → tablet', () => {
    setViewport(768)
    expect(collectDefectDeviceMeta().device_class).toBe('tablet')
  })

  // TS-102
  it('width >= 1024 → desktop', () => {
    setViewport(1440)
    expect(collectDefectDeviceMeta().device_class).toBe('desktop')
  })
})
