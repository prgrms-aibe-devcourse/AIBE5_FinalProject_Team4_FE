import { BE_CATEGORY_TO_UI, getItemTypeLabel, type BeCategoryCode } from '@/data/categoryItemTypes'
import { formatRecommendBrandLabel, getBrandLogoUrl } from '@/data/brandLogos'
import { getGarmentColor, getGarmentColorLabel } from '@/data/garmentColors'
import { getGarmentStyleLabel } from '@/data/garmentStyles'
import type {
  ClothesRecommendationResponse,
  RecommendedClothesItem,
  RecommendationAnchorItem,
} from '@/types/recommendations'
import { resolveClothesDisplayImageUrl } from '@/utils/clothesImageUrl'
import {
  isAllowedWearableCategory,
  isWearableClothesItem,
} from '@/utils/wearableClothesFilter'
import { matchesClothesGender, type UserGender } from '@/utils/genderClothesFilter'
import {
  isDirectNaverProductUrl,
  resolveNaverShoppingPurchaseUrl,
} from '@/utils/naverShoppingUrl'

const BE_CATEGORY_LABEL: Record<string, string> = {
  TOP: '상의',
  BOTTOM: '하의',
  OUTER: '아우터',
  SHOES: '신발',
}

export type RecommendColorChip = {
  label: string
  hex?: string
}

export { formatRecommendBrandLabel } from '@/data/brandLogos'

export type RecommendCardItem = {
  id: string
  clothesId: number | null
  title: string
  brandLabel: string
  brandLogoUrl: string | null
  category: 'Top' | 'Bottom' | 'Outer' | 'Shoes'
  categoryLabel: string
  itemTypeLabel: string
  style: string
  styles: string[]
  color: string
  colorHex?: string
  secondaryColors: RecommendColorChip[]
  price: string
  matchRate: number
  imageUrl: string
  reason: string
  isAnchor?: boolean
  purchaseUrl: string
  hasDirectPurchaseUrl: boolean
  /** POST /api/users/{userId}/wishlist-clothes body 구성용 원본 추천 데이터 */
  source?: RecommendedClothesItem
}

export type RecommendCategoryGroup = {
  categoryCode: BeCategoryCode
  category: RecommendCardItem['category']
  label: string
  items: RecommendCardItem[]
}

const CATEGORY_ORDER: BeCategoryCode[] = ['TOP', 'BOTTOM', 'OUTER', 'SHOES']

function mapColorChip(code: string, display?: { label: string; hex: string } | null): RecommendColorChip {
  const garmentColor = getGarmentColor(code)
  return {
    label: display?.label ?? garmentColor?.name ?? getGarmentColorLabel(code),
    hex: display?.hex ?? garmentColor?.hex,
  }
}

function mapStyleLabels(styleCodes: string[]): string[] {
  return styleCodes
    .map((code) => getGarmentStyleLabel(code))
    .filter((label) => label.trim().length > 0)
}

function toUiCategory(
  categoryCode: string,
): RecommendCardItem['category'] {
  return BE_CATEGORY_TO_UI[categoryCode as BeCategoryCode]
}

function mapRecommendedItemToCard(
  item: RecommendedClothesItem,
  categoryCode: string,
  anchorName: string,
  gender: UserGender,
): RecommendCardItem | null {
  if (
    !isAllowedWearableCategory(categoryCode) ||
    !isWearableClothesItem(item) ||
    !matchesClothesGender(item.gender, gender, item.name)
  ) {
    return null
  }
  const uiCategory = toUiCategory(item.category)
  if (!uiCategory) return null
  const categoryLabel = BE_CATEGORY_LABEL[categoryCode] ?? categoryCode
  const styleLabels = mapStyleLabels(item.styleCodes)
  const primaryColor = mapColorChip(item.primaryColor, item.primaryColorDisplay)
  return {
    id: `rec-${categoryCode}-${item.clothesId}`,
    clothesId: item.clothesId,
    title: item.name,
    brandLabel: formatRecommendBrandLabel(item.brandName),
    brandLogoUrl: getBrandLogoUrl(item.brandName),
    category: uiCategory,
    categoryLabel,
    itemTypeLabel: getItemTypeLabel(uiCategory, item.itemType),
    style: styleLabels[0] ?? '—',
    styles: styleLabels,
    color: primaryColor.label,
    colorHex: primaryColor.hex,
    secondaryColors: item.secondaryColors.map((code) => mapColorChip(code)),
    price: `${item.compatibilityScore}% 어울림`,
    matchRate: item.compatibilityScore,
    imageUrl: resolveClothesDisplayImageUrl(item) ?? '',
    reason: `"${anchorName}"와 ${categoryLabel} 조합`,
    purchaseUrl: resolveNaverShoppingPurchaseUrl(item.name, item.externalProductUrl),
    hasDirectPurchaseUrl: isDirectNaverProductUrl(item.externalProductUrl),
    source: item,
  }
}

function mapAnchorToCard(anchor: RecommendationAnchorItem): RecommendCardItem | null {
  if (!isWearableClothesItem(anchor)) return null
  const uiCategory = toUiCategory(anchor.category)
  if (!uiCategory) return null
  const primaryColor = mapColorChip(anchor.primaryColor, anchor.primaryColorDisplay)
  return {
    id: `anchor-${anchor.clothesId}`,
    clothesId: anchor.clothesId,
    title: anchor.name,
    brandLabel: '보세',
    brandLogoUrl: null,
    category: uiCategory,
    categoryLabel: BE_CATEGORY_LABEL[anchor.category] ?? anchor.category,
    itemTypeLabel: getItemTypeLabel(uiCategory, anchor.itemType),
    style: '—',
    styles: [],
    color: primaryColor.label,
    colorHex: primaryColor.hex,
    secondaryColors: [],
    price: '기준 옷',
    matchRate: 100,
    imageUrl: resolveClothesDisplayImageUrl(anchor) ?? '',
    reason: '내 옷장 보유 옷 · 이 아이템을 기준으로 어울리는 후보를 추천합니다.',
    isAnchor: true,
    purchaseUrl: '',
    hasDirectPurchaseUrl: false,
  }
}

/** anchor + recommendations 맵을 카드 목록으로 변환 (외부 상품 후보) */
export function mapClothesRecommendationResponse(
  response: ClothesRecommendationResponse,
  gender: UserGender = 'None',
): RecommendCardItem[] {
  const anchorCard = mapAnchorToCard(response.anchor)
  const cards: RecommendCardItem[] = anchorCard ? [anchorCard] : []
  const anchorName = response.anchor.name

  for (const [categoryCode, items] of Object.entries(response.recommendations ?? {})) {
    if (!isAllowedWearableCategory(categoryCode)) continue
    for (const item of items ?? []) {
      const card = mapRecommendedItemToCard(item, categoryCode, anchorName, gender)
      if (card) cards.push(card)
    }
  }

  return cards
}

/** 기준 옷 카테고리를 제외하고 카테고리별 추천 그룹으로 변환 */
export function mapClothesRecommendationResponseGrouped(
  response: ClothesRecommendationResponse,
  gender: UserGender = 'None',
): RecommendCategoryGroup[] {
  const anchorUiCategory = toUiCategory(response.anchor.category)
  const anchorName = response.anchor.name
  const groups: RecommendCategoryGroup[] = []

  for (const categoryCode of CATEGORY_ORDER) {
    const uiCategory = BE_CATEGORY_TO_UI[categoryCode]
    if (anchorUiCategory && uiCategory === anchorUiCategory) continue

    const cards = (response.recommendations?.[categoryCode] ?? [])
      .map((item) => mapRecommendedItemToCard(item, categoryCode, anchorName, gender))
      .filter((card): card is RecommendCardItem => card != null)

    if (cards.length === 0) continue

    groups.push({
      categoryCode,
      category: uiCategory,
      label: BE_CATEGORY_LABEL[categoryCode] ?? categoryCode,
      items: cards.sort((a, b) => b.matchRate - a.matchRate),
    })
  }

  return groups
}
