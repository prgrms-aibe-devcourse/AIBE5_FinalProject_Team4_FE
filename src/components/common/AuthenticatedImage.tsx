import type { ImgHTMLAttributes, ReactNode } from 'react'
import { useAuthenticatedImageSrc } from '@/utils/authenticatedImageUrl'

interface AuthenticatedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string | null
  fallback?: ReactNode
}

/** BE 보호 이미지(/api/v1/images/**)는 axios로 blob fetch 후 표시 */
export default function AuthenticatedImage({
  src,
  fallback = null,
  alt = '',
  referrerPolicy = 'no-referrer',
  ...imgProps
}: AuthenticatedImageProps) {
  const resolvedSrc = useAuthenticatedImageSrc(src)

  if (!resolvedSrc) {
    return fallback ? <>{fallback}</> : null
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy={referrerPolicy}
      {...imgProps}
    />
  )
}
