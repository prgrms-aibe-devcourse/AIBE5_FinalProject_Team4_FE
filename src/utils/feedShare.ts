export function buildFeedPostShareUrl(postId: number): string {
  const url = new URL(window.location.href)
  url.pathname = window.location.pathname || '/'
  url.search = ''
  url.hash = ''
  url.searchParams.set('post', String(postId))
  return url.toString()
}

export function parseFeedPostIdFromSearch(search: string): number | null {
  const params = new URLSearchParams(search)
  const raw = params.get('post')
  if (!raw) return null
  const id = Number(raw)
  if (!Number.isFinite(id) || id <= 0) return null
  return id
}

/** URL의 post 쿼리를 읽고 주소창에서 제거합니다. */
export function consumeFeedPostIdFromUrl(): number | null {
  const postId = parseFeedPostIdFromSearch(window.location.search)
  if (postId == null) return null

  const params = new URLSearchParams(window.location.search)
  params.delete('post')
  const nextSearch = params.toString()
  const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`
  window.history.replaceState(null, '', nextUrl)
  return postId
}
