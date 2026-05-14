/** Extension for pasted image blobs that have an empty `File.name` (common for OS screenshots). */
function extFromImageMime(mime: string): string {
  if (mime === 'image/png') return 'png'
  if (mime === 'image/jpeg') return 'jpg'
  if (mime === 'image/webp') return 'webp'
  return 'png'
}

function normalizeClipboardImageFile(file: File, index: number): File {
  if (file.name?.trim()) return file
  const ext = extFromImageMime(file.type || 'image/png')
  return new File([file], `paste-${Date.now()}-${index}.${ext}`, { type: file.type || `image/${ext}` })
}

/**
 * Image files from a paste event's `clipboardData` (Snipping Tool, browser copy image, etc.).
 * De-duplicates overlapping `items` vs `files` exposure in some browsers.
 */
export function collectImageFilesFromClipboard(dataTransfer: DataTransfer | null): File[] {
  if (!dataTransfer) return []
  const out: File[] = []
  const seen = new Set<string>()

  const consider = (file: File | null, index: number) => {
    if (!file) return
    const type = file.type || ''
    if (!type.startsWith('image/')) return
    const normalized = normalizeClipboardImageFile(file, index)
    const key = `${normalized.size}\0${normalized.type}`
    if (seen.has(key)) return
    seen.add(key)
    out.push(normalized)
  }

  if (dataTransfer.items?.length) {
    let j = 0
    for (let i = 0; i < dataTransfer.items.length; i++) {
      const it = dataTransfer.items[i]
      if (it.kind !== 'file') continue
      consider(it.getAsFile(), j++)
    }
  }

  if (out.length === 0 && dataTransfer.files?.length) {
    for (let i = 0; i < dataTransfer.files.length; i++) {
      consider(dataTransfer.files.item(i), i)
    }
  }

  return out
}
