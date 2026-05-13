export type DefectDeviceClass = 'desktop' | 'tablet' | 'phone'

export type DefectDeviceMeta = {
  viewport: string
  device_class: DefectDeviceClass
  device_pixel_ratio: number
}

export function collectDefectDeviceMeta(): DefectDeviceMeta {
  if (typeof window === 'undefined') {
    return { viewport: '0x0', device_class: 'desktop', device_pixel_ratio: 1 }
  }
  const w = window.innerWidth
  const h = window.innerHeight
  const dpr = window.devicePixelRatio ?? 1
  let device_class: DefectDeviceClass = 'desktop'
  if (w < 640) device_class = 'phone'
  else if (w < 1024) device_class = 'tablet'
  return {
    viewport: `${w}x${h}`,
    device_class,
    device_pixel_ratio: Math.round(dpr * 1000) / 1000,
  }
}
