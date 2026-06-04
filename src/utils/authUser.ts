/** JWT access token의 sub(userId)를 읽습니다. */

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segment = token.split('.')[1]
  if (!segment) return null
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    return JSON.parse(atob(padded)) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getUserIdFromAccessToken(): number | null {
  const token = localStorage.getItem('token')
  if (!token) return null

  const payload = decodeJwtPayload(token)
  if (!payload || payload.sub == null) return null

  const userId = Number(payload.sub)
  return Number.isFinite(userId) && userId > 0 ? userId : null
}

export function storeAccessToken(token: string): void {
  localStorage.setItem('token', token)
}

/** OAuth 성공 리다이렉트: ?token=... 쿼리를 localStorage에 저장 후 URL에서 제거 */
export function captureOAuthTokenFromUrl(): boolean {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  if (!token) return false

  storeAccessToken(token)
  params.delete('token')
  const query = params.toString()
  const nextUrl =
    window.location.pathname + (query ? `?${query}` : '') + window.location.hash
  window.history.replaceState({}, '', nextUrl)
  return true
}
