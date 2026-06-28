import { getApiBaseUrl } from '@/lib/apiConfig'

export type ApiErrorBody = {
  code: string
  message: string
}

export class ApiClientError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiClientError'
    this.status = status
    this.code = body.code
  }
}

export type ApiFetchOptions = RequestInit & {
  accessToken?: string | null
  json?: unknown
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const base = getApiBaseUrl()
  if (!base) throw new Error('VITE_API_URL is not configured')

  const { accessToken, json, headers, ...rest } = options
  const res = await fetch(`${base}${path.startsWith('/') ? path : `/${path}`}`, {
    ...rest,
    headers: {
      ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  })

  if (res.status === 204) return undefined as T

  const text = await res.text()
  const payload = text ? (JSON.parse(text) as unknown) : null

  if (!res.ok) {
    const body =
      payload && typeof payload === 'object' && payload !== null && 'code' in payload
        ? (payload as ApiErrorBody)
        : { code: 'http_error', message: res.statusText || 'Request failed' }
    throw new ApiClientError(res.status, body)
  }

  return payload as T
}
