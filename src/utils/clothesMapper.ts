import { resolveClothesGender } from '@/data/garmentGender'
import type { ClothesGender, ClothesInfoSource, ClothesResponse } from '@/types/be'
import type { Garment, GarmentBeMeta } from '@/types'
import {
  BE_CATEGORY_TO_UI,
  getItemTypeLabel,
} from '@/data/categoryItemTypes'
import { getGarmentColorLabel } from '@/data/garmentColors'
import { getGarmentStyleLabel } from '@/data/garmentStyles'
import { resolveClothesDisplayImageUrl } from '@/utils/clothesImageUrl'

function extractBeMeta(item: ClothesResponse): GarmentBeMeta {
  return {
    categoryCode: item.category,
    itemTypeCode: item.itemType,
    genderCode: resolveClothesGender(item.gender),
    primaryColorCode: item.primaryColor ?? item.primaryColorDisplay?.code ?? 'WHITE',
    secondaryColorCodes: (item.secondaryColors ?? []).map((c) => c.code),
    styleCodes: (item.styles ?? []).map((s) => s.code),
    brandName: item.brandName,
    imageUrl: item.imageUrl,
    isVerified: item.isVerified ?? false,
    clothesInfoSource: item.clothesInfoSource,
    registrationSource: item.registrationSource ?? null,
  }
}

export function mapClothesToGarment(item: ClothesResponse): Garment {
  const primaryStyle = item.styles?.[0]
  const category =
    BE_CATEGORY_TO_UI[item.category as keyof typeof BE_CATEGORY_TO_UI] ?? 'Top'
  const primaryColorCode =
    item.primaryColor ?? item.primaryColorDisplay?.code ?? 'WHITE'
  return {
    id: String(item.clothesId),
    name: item.name,
    category,
    color: item.primaryColorDisplay?.name ?? getGarmentColorLabel(primaryColorCode),
    style:
      primaryStyle?.name ??
      getGarmentStyleLabel(primaryStyle?.code ?? ''),
    fitType: getItemTypeLabel(category, item.itemType),
    fabricMaterial: item.brandName || '—',
    thumbnailUrl: resolveClothesDisplayImageUrl(item),
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
  gender: ClothesGender
  primaryColor: string
  secondaryColors: string[]
  styles: string[]
  size: string
  season?: string
  isVerified: boolean
}

function uniqueOrderedCodes(codes: string[]): string[] {
  const seen = new Set<string>()
  return codes.filter((code) => {
    const trimmed = code.trim()
    if (!trimmed || seen.has(trimmed)) return false
    seen.add(trimmed)
    return true
  })
}

export function buildClothesUpdatePayload(
  garment: Garment,
  edits: {
    name?: string
    brandName?: string
    productCode?: string
    category?: string
    itemType?: string
    gender?: ClothesGender
    primaryColor?: string
    secondaryColors?: string[]
    styles?: string[]
    size?: string
    season?: string
    imageUrl?: string
  },
): ClothesUpdatePayload {
  const be = garment.be
  if (!be) {
    throw new Error('옷 정보가 불완전합니다. 상세를 다시 불러와 주세요.')
  }
  const styles = uniqueOrderedCodes(
    edits.styles ??
      (be.styleCodes.length > 0 ? be.styleCodes : ['CASUAL']),
  )
  const secondaryColors = uniqueOrderedCodes(
    edits.secondaryColors ?? be.secondaryColorCodes,
  )
  return {
    name: edits.name ?? garment.name,
    brandName: (edits.brandName ?? be.brandName).trim() || '미입력',
    productCode: edits.productCode ?? garment.productCode ?? 'UNKNOWN',
    imageUrl: edits.imageUrl ?? resolveClothesDisplayImageUrl({
      userImageUrl: garment.userImageUrl,
      imageUrl: be.imageUrl,
    }) ?? be.imageUrl,
    category: edits.category ?? be.categoryCode,
    itemType: edits.itemType ?? be.itemTypeCode,
    gender: edits.gender ?? be.genderCode,
    primaryColor: edits.primaryColor ?? be.primaryColorCode,
    secondaryColors,
    styles,
    size: edits.size ?? garment.size ?? 'FREE',
    season: edits.season ?? garment.season,
    isVerified: be.isVerified,
  }
}
