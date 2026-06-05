import { useEffect, useState } from 'react'
import api from '@/api'

const PROTECTED_IMAGE_PATH =
  /^\/api\/v1\/images\/(clothes|purchase-captures)\//

/** BE 로컬/운영 저장 이미지 URL인지 확인 */
export function isProtectedStorageImageUrl(url: string): boolean {
  if (url.startsWith('blob:') || url.startsWith('data:')) return false
  try {
    const pathname = url.startsWith('http')
      ? new URL(url).pathname
      : url.startsWith('/')
        ? url
        : `/${url}`
    return PROTECTED_IMAGE_PATH.test(pathname)
  } catch {
    return false
  }
}

/** axios 요청용 상대 경로로 정규화 (dev Vite 프록시 호환) */
export function toProxiedImageRequestPath(url: string): string {
  if (url.startsWith('/api/')) return url
  try {
    const parsed = new URL(url)
    if (parsed.pathname.startsWith('/api/')) return parsed.pathname
  } catch {
    // ignore
  }
  return url
}

export async function fetchAuthenticatedImageObjectUrl(
  url: string,
): Promise<string | null> {
  if (!isProtectedStorageImageUrl(url)) return url

  try {
    const { data } = await api.get<Blob>(toProxiedImageRequestPath(url), {
      responseType: 'blob',
    })
    return URL.createObjectURL(data)
  } catch {
    return null
  }
}

/** 인증이 필요한 BE 이미지 URL을 blob URL로 변환해 <img>에 사용 */
export function useAuthenticatedImageSrc(
  src: string | null | undefined,
): string | null {
  const [resolved, setResolved] = useState<string | null>(null)

  useEffect(() => {
    if (!src) {
      setResolved(null)
      return
    }

    if (!isProtectedStorageImageUrl(src)) {
      setResolved(src)
      return
    }

    let cancelled = false
    let objectUrl: string | null = null

    void (async () => {
      objectUrl = await fetchAuthenticatedImageObjectUrl(src)
      if (!cancelled) setResolved(objectUrl)
    })()

    return () => {
      cancelled = true
      if (objectUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [src])

  return resolved
}
