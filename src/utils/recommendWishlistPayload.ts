import { resolveClothesGenderWithBrand } from '@/data/brandGender'
import type { Garment } from '@/types'
import type { ClothesGender } from '@/types/be'
import type { RecommendedClothesItem } from '@/types/recommendations'
import { resolveClothesDisplayImageUrl } from '@/utils/clothesImageUrl'
import { resolveNaverShoppingPurchaseUrl } from '@/utils/naverShoppingUrl'
import type { RecommendCardItem } from '@/utils/recommendationMapper'
import { UI_CATEGORY_TO_BE, CATEGORY_ITEM_TYPES } from '@/data/categoryItemTypes'

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

  const externalProductUrl = resolveNaverShoppingPurchaseUrl(
    item.name,
    item.externalProductUrl,
  )

  const finalProductUrl =
    externalProductUrl &&
    (externalProductUrl.startsWith('http://') || externalProductUrl.startsWith('https://')) &&
    !externalProductUrl.includes('localhost') &&
    !externalProductUrl.includes('127.0.0.1')
      ? externalProductUrl
      : 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent(item.name)

  return {
    name: item.name.trim(),
    brandName: (item.brandName?.trim() || 'UNKNOWN').slice(0, 100),
    productCode: recommendationWishlistProductCode(item.clothesId),
    imageUrl,
    category: item.category,
    itemType: item.itemType,
    gender: resolveClothesGenderWithBrand(item.gender, item.brandName),
    primaryColor: item.primaryColor,
    secondaryColors: item.secondaryColors ?? [],
    styles: item.styleCodes?.length ? item.styleCodes : ['CASUAL'],
    size: 'FREE',
    season: item.season ?? undefined,
    externalSource: 'NAVER_SHOPPING',
    externalProductId: String(item.clothesId),
    externalProductUrl: finalProductUrl,
  }
}

export function buildWishlistPayloadFromCardItem(
  item: RecommendCardItem,
): WishlistClothesCreatePayload {
  const imageUrl = resolveClothesDisplayImageUrl(item as any) ?? item.imageUrl
  if (!imageUrl || !imageUrl.startsWith('http')) {
    throw new Error('위시리스트 저장에 필요한 이미지 URL이 없습니다.')
  }

  const finalProductUrl =
    item.purchaseUrl &&
    (item.purchaseUrl.startsWith('http://') || item.purchaseUrl.startsWith('https://')) &&
    !item.purchaseUrl.includes('localhost') &&
    !item.purchaseUrl.includes('127.0.0.1')
      ? item.purchaseUrl
      : 'https://search.shopping.naver.com/search/all?query=' + encodeURIComponent(item.title)

  const productCode =
    item.clothesId != null ? recommendationWishlistProductCode(item.clothesId) : `STYLE-${item.id}`

  const itemType = item.itemTypeCode || CATEGORY_ITEM_TYPES[item.category]?.[0]?.code || ''

  return {
    name: item.title.trim(),
    brandName: (item.brandLabel?.trim() || 'UNKNOWN').slice(0, 100),
    productCode,
    imageUrl,
    category: UI_CATEGORY_TO_BE[item.category],
    itemType,
    gender: 'UNISEX',
    primaryColor: item.color || 'UNKNOWN',
    secondaryColors: item.secondaryColors?.map((c) => c.label) ?? [],
    styles: item.styles?.length ? item.styles : ['CASUAL'],
    size: 'FREE',
    season: undefined,
    externalSource: 'NAVER_SHOPPING',
    externalProductId: String(item.clothesId ?? item.id),
    externalProductUrl: finalProductUrl,
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

export function findOwnedGarmentForRecommendation(
  recommendationClothesId: number,
  existingGarments: Garment[],
): Garment | undefined {
  const productCode = recommendationWishlistProductCode(recommendationClothesId)
  return existingGarments.find(
    (garment) =>
      !garment.isWishlist &&
      (garment.id === String(recommendationClothesId) ||
        garment.productCode === productCode),
  )
}
