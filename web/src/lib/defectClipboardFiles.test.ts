import { describe, expect, it } from 'vitest'
import { collectImageFilesFromClipboard } from './defectClipboardFiles'

/** Минимальный мок DataTransfer, читающий только то, что использует функция. */
function makeDataTransfer(files: File[]): DataTransfer {
  const items = files.map((f) => ({ kind: 'file' as const, getAsFile: () => f }))
  const itemsList: Record<number, unknown> & { length: number } = { length: items.length }
  items.forEach((it, i) => {
    itemsList[i] = it
  })
  return {
    items: itemsList,
    files: {
      length: files.length,
      item: (i: number) => files[i] ?? null,
    },
  } as unknown as DataTransfer
}

describe('collectImageFilesFromClipboard', () => {
  // TS-103
  it('null → []', () => {
    expect(collectImageFilesFromClipboard(null)).toEqual([])
  })

  // TS-104
  it('PNG без имени → нормализуется до paste-*.png', () => {
    const file = new File([new Uint8Array([1, 2, 3])], '', { type: 'image/png' })
    const out = collectImageFilesFromClipboard(makeDataTransfer([file]))
    expect(out).toHaveLength(1)
    expect(out[0].name).toMatch(/^paste-\d+-0\.png$/)
    expect(out[0].type).toBe('image/png')
  })

  // TS-106
  it('не-image файл исключён', () => {
    const txt = new File([new Uint8Array([1])], 'note.txt', { type: 'text/plain' })
    const png = new File([new Uint8Array([1, 2])], 'shot.png', { type: 'image/png' })
    const out = collectImageFilesFromClipboard(makeDataTransfer([txt, png]))
    expect(out.map((f) => f.type)).toEqual(['image/png'])
  })
})
