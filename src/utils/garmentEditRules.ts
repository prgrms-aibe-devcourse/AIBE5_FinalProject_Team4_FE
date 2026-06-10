import type { Garment } from '@/types'
import type { ClothesInfoSource } from '@/types/be'

function isExternalClothesInfoSource(
  source: ClothesInfoSource | string | null | undefined,
): boolean {
  return source === 'EXTERNAL_SHOPPING'
}

/** 외부 쇼핑 카탈로그 상품 — 사이즈만 수정 가능 */
export function isExternalProductGarment(garment: Garment): boolean {
  const be = garment.be
  if (!be) return false

  return (
    isExternalClothesInfoSource(be.clothesInfoSource) ||
    isExternalClothesInfoSource(be.registrationSource)
  )
}
