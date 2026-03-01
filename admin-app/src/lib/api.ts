const ADMIN_API_INTERNAL_URL =
  process.env.ADMIN_API_INTERNAL_URL ?? 'http://localhost:8082'

/**
 * Client-side fetch wrapper — uses nginx proxy path /api/admin/*.
 * Includes credentials so the admin_token cookie is sent automatically.
 */
export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`/api/admin${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
}

/**
 * Server-side fetch wrapper — calls admin-api directly via Docker internal DNS.
 * Used in server actions and server components; does NOT send browser cookies.
 * Pass the JWT token explicitly as Authorization: Bearer {token}.
 */
export function apiServerFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${ADMIN_API_INTERNAL_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  })
}
