export type OAuthProvider = 'kakao' | 'google' | 'naver'

/** BE OAuth 시작 URL (Vite 프록시 밖 — 8080 직접 이동) */
export function getApiOrigin(): string {
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(
    /\/$/,
    '',
  )
}

export function oauthAuthorizationUrl(provider: OAuthProvider): string {
  return `${getApiOrigin()}/oauth2/authorization/${provider}`
}

export function redirectToOAuthLogin(provider: OAuthProvider): void {
  window.location.assign(oauthAuthorizationUrl(provider))
}
