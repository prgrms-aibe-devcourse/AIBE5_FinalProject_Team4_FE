import { useEffect, useState } from 'react'
import api from '@/api'

const PROTECTED_IMAGE_PATH =
  /\/api\/v1\/images\/(clothes|purchase-captures)\//i

function normalizeImagePathname(url: string): string {
  if (!url) return ''
  try {
    const raw = url.startsWith('http')
      ? new URL(url).pathname
      : url.startsWith('/')
        ? url
        : `/${url}`
    return raw.split(/[?#]/)[0]
  } catch {
    return url
  }
}

/** BE 로컬/운영 저장 이미지 URL인지 확인 (clothes·purchase-captures는 인증 fetch 필요) */
export function isProtectedStorageImageUrl(url: string | null | undefined): boolean {
  if (!url || url.startsWith('blob:') || url.startsWith('data:')) return false
  try {
    return PROTECTED_IMAGE_PATH.test(normalizeImagePathname(url))
  } catch {
    return false
  }
}

/** axios 요청용 상대 경로로 정규화 (dev Vite 프록시 호환) */
export function toProxiedImageRequestPath(url: string | null | undefined): string {
  if (!url) return ''
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
  url: string | null | undefined,
): Promise<string | null> {
  if (!url) return null
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
  const [resolved, setResolved] = useState<string | null>(() => {
    if (!src) return null
    return isProtectedStorageImageUrl(src) ? null : src
  })

  useEffect(() => {
    if (!src) {
      setResolved(null)
      return
    }

    if (!isProtectedStorageImageUrl(src)) {
      setResolved(src)
      return
    }

    setResolved(null)

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
