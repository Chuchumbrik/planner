/** Public planner-api origin (Amvera stage/prod). No trailing slash. */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim() ?? '';
  return raw.replace(/\/+$/, '');
}

export function isApiConfigured(): boolean {
  return Boolean(getApiBaseUrl());
}
