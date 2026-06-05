import type { Garment } from '@/types/index'

export type UiCategory = Garment['category']
export type BeCategoryCode = 'TOP' | 'BOTTOM' | 'OUTER' | 'SHOES'

export const BE_CATEGORY_TO_UI: Record<BeCategoryCode, UiCategory> = {
  TOP: 'Top',
  BOTTOM: 'Bottom',
  OUTER: 'Outer',
  SHOES: 'Shoes',
}

export const UI_CATEGORY_TO_BE: Record<UiCategory, BeCategoryCode> = {
  Top: 'TOP',
  Bottom: 'BOTTOM',
  Outer: 'OUTER',
  Shoes: 'SHOES',
}

export const CATEGORY_ITEM_TYPES: Record<
  UiCategory,
  { code: string; label: string }[]
> = {
  Top: [
    { code: 'LONG_SLEEVE', label: '긴팔' },
    { code: 'SHORT_SLEEVE', label: '반팔' },
    { code: 'SHIRT', label: '셔츠' },
    { code: 'HOODIE', label: '후드' },
    { code: 'SWEAT', label: '맨투맨' },
    { code: 'COLLAR_TEE', label: '카라 티' },
    { code: 'SLEEVELESS', label: '민소매' },
    { code: 'KNIT', label: '니트' },
  ],
  Bottom: [
    { code: 'DENIM', label: '데님' },
    { code: 'TRAINING', label: '트레이닝' },
    { code: 'COTTON', label: '코튼 팬츠' },
    { code: 'SLACKS', label: '슬랙스' },
    { code: 'SHORTS', label: '반바지' },
    { code: 'CARGO', label: '카고' },
    { code: 'SKIRT', label: '스커트' },
  ],
  Outer: [
    { code: 'WINDBREAKER', label: '윈드브레이커' },
    { code: 'HOOD_ZIPUP', label: '후드 집업' },
    { code: 'TRAINING_JACKET', label: '트레이닝 자켓' },
    { code: 'BLOUSON', label: '블루종' },
    { code: 'MA1', label: 'MA-1' },
    { code: 'VARSITY_JACKET', label: '바시티 자켓' },
    { code: 'LEATHER_JACKET', label: '레더 자켓' },
    { code: 'SHEARLING', label: '무스탕' },
    { code: 'FLEECE_JACKET', label: '플리스 자켓' },
    { code: 'VEST', label: '베스트' },
    { code: 'WORK_JACKET', label: '워크 자켓' },
    { code: 'DENIM_JACKET', label: '데님 자켓' },
    { code: 'BLAZER', label: '블레이저' },
    { code: 'COACH_JACKET', label: '코치 자켓' },
    { code: 'PADDING', label: '패딩' },
    { code: 'LIGHT_PADDING', label: '경량 패딩' },
    { code: 'SINGLE_COAT', label: '싱글 코트' },
    { code: 'DOUBLE_COAT', label: '더블 코트' },
    { code: 'BALMACAAN_COAT', label: '발마칸 코트' },
    { code: 'TTEOKBOKKI_COAT', label: '떡볶이 코트' },
  ],
  Shoes: [
    { code: 'SNEAKERS', label: '스니커즈' },
    { code: 'SPORTS_SHOES', label: '운동화' },
    { code: 'LOAFER', label: '로퍼' },
    { code: 'DERBY', label: '더비' },
    { code: 'BOOTS', label: '부츠' },
    { code: 'SANDALS_SLIPPERS', label: '샌들·슬리퍼' },
    { code: 'FLAT', label: '플랫' },
    { code: 'HEEL', label: '힐' },
  ],
}

export function isUiCategory(value: string): value is UiCategory {
  return value in CATEGORY_ITEM_TYPES
}

export function resolveUiCategory(
  value: string | null | undefined,
): UiCategory {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return 'Top'
  if (isUiCategory(trimmed)) return trimmed
  const upper = trimmed.toUpperCase()
  if (upper in BE_CATEGORY_TO_UI) {
    return BE_CATEGORY_TO_UI[upper as BeCategoryCode]
  }
  return 'Top'
}

export function isItemTypeInCategory(
  category: UiCategory,
  itemType: string,
): boolean {
  return CATEGORY_ITEM_TYPES[category].some((t) => t.code === itemType)
}

export function resolveItemTypeForCategory(
  category: UiCategory,
  itemType: string | null | undefined,
): string {
  const code = (itemType ?? '').trim()
  if (code && isItemTypeInCategory(category, code)) return code
  return CATEGORY_ITEM_TYPES[category][0]?.code ?? ''
}

export function getItemTypeLabel(
  category: UiCategory,
  itemTypeCode: string,
): string {
  return (
    CATEGORY_ITEM_TYPES[category].find((t) => t.code === itemTypeCode)?.label ??
    itemTypeCode
  )
}
