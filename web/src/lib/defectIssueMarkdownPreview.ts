/** Сборка Markdown тела issue для предпросмотра (порядок секций совпадает с Edge `file-defect`). */

import type { DefectDeviceMeta } from '@/lib/defectDeviceMeta'

export type DefectIssuePreviewInput = {
  description: string
  steps?: string
  expected?: string
  actual?: string
  screenshotLines?: string[]
  appVersion: string
  route: string
  locale?: string
  motivatorRole?: string
  userId?: string
  userAgent?: string
  deviceMeta?: DefectDeviceMeta
}

export function buildDefectIssueMarkdownPreview(input: DefectIssuePreviewInput): string {
  const parts: string[] = []
  parts.push(input.description)
  if (input.steps?.trim()) {
    parts.push('', '### Steps to reproduce', input.steps.trim())
  }
  if (input.expected?.trim()) {
    parts.push('', '### Expected', input.expected.trim())
  }
  if (input.actual?.trim()) {
    parts.push('', '### Actual', input.actual.trim())
  }
  if (input.screenshotLines?.length) {
    parts.push('', '### Screenshots', ...input.screenshotLines)
  }
  parts.push('', '---', '', '### Environment')
  parts.push(`- **App version:** ${input.appVersion || '(not provided)'}`)
  parts.push(`- **Route:** ${input.route || '(not provided)'}`)
  parts.push(`- **Locale:** ${input.locale ?? '(not provided)'}`)
  if (input.motivatorRole) parts.push(`- **Motivator role:** \`${input.motivatorRole}\``)
  if (input.userId) parts.push(`- **User id:** \`${input.userId}\``)
  if (input.userAgent?.trim()) {
    parts.push(`- **User agent:** \`${input.userAgent.replace(/`/g, "'")}\``)
  }
  if (input.deviceMeta?.viewport) {
    parts.push(`- **Viewport:** \`${input.deviceMeta.viewport.replace(/`/g, "'")}\``)
  }
  if (input.deviceMeta?.device_pixel_ratio != null) {
    parts.push(`- **Device pixel ratio:** ${input.deviceMeta.device_pixel_ratio}`)
  }
  if (input.deviceMeta?.device_class) {
    parts.push(`- **Device class:** \`${input.deviceMeta.device_class.replace(/`/g, "'")}\``)
  }
  return parts.join('\n')
}
