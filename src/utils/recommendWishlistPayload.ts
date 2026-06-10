import { resolveClothesGender } from '@/data/garmentGender'
import type { Garment } from '@/types'
import type { ClothesGender } from '@/types/be'
import type { RecommendedClothesItem } from '@/types/recommendations'
import { resolveClothesDisplayImageUrl } from '@/utils/clothesImageUrl'
import { isDirectNaverProductUrl } from '@/utils/naverShoppingUrl'

/** BE `WishlistClothesCreateRequest` — POST /api/users/{userId}/wishlist-clothes */
export interface WishlistClothesCreatePayload {
  name: string
  brandName: string
  productCode: string
  imageUrl: string
  category: string
  itemType: string
  gender: ClothesGender
  primaryColor: string
  secondaryColors: string[]
  styles: string[]
  size: string
  season?: string
  externalSource: string
  externalProductId: string
  externalProductUrl: string
}

export const recommendationWishlistProductCode = (clothesId: number) =>
  `REC-${clothesId}`

export function buildWishlistPayloadFromRecommendedItem(
  item: RecommendedClothesItem,
): WishlistClothesCreatePayload {
  const imageUrl = resolveClothesDisplayImageUrl(item) ?? item.imageUrl
  if (!imageUrl.startsWith('http')) {
    throw new Error('위시리스트 저장에 필요한 이미지 URL이 없습니다.')
  }

  const directUrl = item.externalProductUrl?.trim()
  const externalProductUrl =
    directUrl && (isDirectNaverProductUrl(directUrl) || directUrl.startsWith('https://'))
      ? directUrl
      : imageUrl

  return {
    name: item.name.trim(),
    brandName: (item.brandName?.trim() || 'UNKNOWN').slice(0, 100),
    productCode: recommendationWishlistProductCode(item.clothesId),
    imageUrl,
    category: item.category,
    itemType: item.itemType,
    gender: resolveClothesGender(item.gender),
    primaryColor: item.primaryColor,
    secondaryColors: item.secondaryColors ?? [],
    styles: item.styleCodes?.length ? item.styleCodes : ['CASUAL'],
    size: 'FREE',
    season: item.season ?? undefined,
    externalSource: 'NAVER_SHOPPING',
    externalProductId: String(item.clothesId),
    externalProductUrl,
  }
}

export function findWishlistGarmentForRecommendation(
  recommendationClothesId: number,
  existingGarments: Garment[],
): Garment | undefined {
  const productCode = recommendationWishlistProductCode(recommendationClothesId)
  return existingGarments.find(
    (garment) =>
      garment.isWishlist &&
      (garment.id === String(recommendationClothesId) ||
        garment.productCode === productCode),
  )
}
