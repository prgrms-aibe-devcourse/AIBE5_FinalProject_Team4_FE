import type { ClothesResponse, ClothesInfoSource } from '@/types/be'
import type { Garment, GarmentBeMeta } from '@/types'
import { BE_CATEGORY_TO_UI } from '@/data/categoryItemTypes'

function extractBeMeta(item: ClothesResponse): GarmentBeMeta {
  return {
    categoryCode: item.category,
    itemTypeCode: item.itemType,
    primaryColorCode: item.primaryColor ?? item.primaryColorDisplay?.code ?? 'WHITE',
    secondaryColorCodes: (item.secondaryColors ?? []).map((c) => c.code),
    styleCodes: (item.styles ?? []).map((s) => s.code),
    brandName: item.brandName,
    imageUrl: item.userImageUrl ?? item.imageUrl,
    isVerified: item.isVerified ?? false,
    clothesInfoSource: item.clothesInfoSource,
    registrationSource: item.registrationSource ?? null,
  }
}

export function mapClothesToGarment(item: ClothesResponse): Garment {
  const primaryStyle = item.styles?.[0]
  return {
    id: String(item.clothesId),
    name: item.name,
    category: BE_CATEGORY_TO_UI[item.category as keyof typeof BE_CATEGORY_TO_UI] ?? 'Top',
    color: item.primaryColorDisplay?.name ?? item.primaryColor ?? '',
    style: primaryStyle?.name ?? primaryStyle?.code ?? '',
    fitType: item.itemType,
    fabricMaterial: item.brandName || '—',
    thumbnailUrl: (item.userImageUrl ?? item.imageUrl) || undefined,
    isFavorite: item.isFavorite ?? false,
    isWishlist: item.ownershipStatus === 'WISHLIST',
    productCode: item.productCode,
    size: item.size ?? undefined,
    season: item.season ?? undefined,
    userImageUrl: item.userImageUrl ?? undefined,
    be: extractBeMeta(item),
  }
}

export function mapClothesListToGarments(items: ClothesResponse[]): Garment[] {
  return items.map(mapClothesToGarment)
}

export interface ClothesUpdatePayload {
  name: string
  brandName: string
  productCode: string
  imageUrl: string
  category: string
  itemType: string
  primaryColor: string
  secondaryColors: string[]
  styles: string[]
  size: string
  season?: string
  isVerified: boolean
}

export function buildClothesUpdatePayload(
  garment: Garment,
  edits: {
    name?: string
    brandName?: string
    size?: string
    season?: string
  },
): ClothesUpdatePayload {
  const be = garment.be
  if (!be) {
    throw new Error('옷 정보가 불완전합니다. 상세를 다시 불러와 주세요.')
  }
  return {
    name: edits.name ?? garment.name,
    brandName: edits.brandName ?? be.brandName,
    productCode: garment.productCode ?? 'UNKNOWN',
    imageUrl: garment.userImageUrl ?? be.imageUrl,
    category: be.categoryCode,
    itemType: be.itemTypeCode,
    primaryColor: be.primaryColorCode,
    secondaryColors: be.secondaryColorCodes,
    styles: be.styleCodes.length > 0 ? be.styleCodes : ['CASUAL'],
    size: edits.size ?? garment.size ?? 'FREE',
    season: edits.season ?? garment.season,
    isVerified: be.isVerified,
  }
}
