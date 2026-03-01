const SITE_API_INTERNAL_URL =
  process.env.SITE_API_INTERNAL_URL ?? 'http://localhost:8081'

/**
 * Server-side fetch wrapper — calls site-api directly via Docker internal DNS.
 * Used in Server Components; no credentials needed (all public endpoints).
 */
export function apiServerFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${SITE_API_INTERNAL_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
}

/**
 * Client-side fetch wrapper — uses nginx proxy path /api/site/*.
 * No credentials needed — all site-api endpoints are public (AUTH-04).
 */
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`/api/site${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
}
