/**
 * Resolves a thumbnail URL for display.
 * - GridFS paths like "/images/xxx" -> "/api/site/images/xxx" (proxied to site-api)
 * - External URLs like "https://..." -> returned as-is
 * - Empty string -> returns empty string (callers show fallback)
 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return ''
  if (url.startsWith('/images/')) return `/api/site${url}`
  return url
}
