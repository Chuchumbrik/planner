function isResponse(x: unknown): x is Response {
  return typeof x === 'object' && x !== null && 'clone' in x && typeof (x as Response).clone === 'function'
}

/**
 * Разворачивает тело ответа Edge Function (Supabase JS кладёт его в `context`, если это HTTP-ошибка).
 */
export async function formatSupabaseFunctionInvokeError(err: unknown): Promise<string> {
  if (err instanceof Error) {
    const withCtx = err as Error & { context?: unknown }
    if (isResponse(withCtx.context)) {
      try {
        const parsed: unknown = await withCtx.context.clone().json()
        if (parsed && typeof parsed === 'object' && 'error' in parsed) {
          return `${err.message} — ${String((parsed as { error?: unknown }).error)}`
        }
        const s = JSON.stringify(parsed)
        return s && s !== '{}' ? `${err.message} — ${s}` : err.message
      } catch {
        try {
          const t = await withCtx.context.clone().text()
          if (t?.trim()) return `${err.message}: ${t.trim().slice(0, 400)}`
        } catch {
          /* empty */
        }
      }
    }
    return err.message
  }
  return String(err)
}
