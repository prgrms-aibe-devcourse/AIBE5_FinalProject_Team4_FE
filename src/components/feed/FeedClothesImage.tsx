import type { ReactNode } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import type { ClothesResponse } from '@/types/be'
import { resolveClothesDisplayImageUrl } from '@/utils/clothesImageUrl'

interface FeedClothesImageProps {
  clothes: ClothesResponse
  alt: string
  className?: string
  fallback?: ReactNode
}

/** 피드 코디 구성 옷 — BE `/api/v1/images/clothes/**`는 인증 fetch + blob URL로 표시 */
export default function FeedClothesImage({
  clothes,
  alt,
  className,
  fallback,
}: FeedClothesImageProps) {
  const src = resolveClothesDisplayImageUrl(clothes)

  return (
    <AuthenticatedImage
      src={src}
      alt={alt}
      className={className}
      fallback={
        fallback ?? (
          <div className="flex h-full w-full items-center justify-center bg-slate-100 text-[10px] font-bold text-slate-400">
            이미지 없음
          </div>
        )
      }
    />
  )
}
