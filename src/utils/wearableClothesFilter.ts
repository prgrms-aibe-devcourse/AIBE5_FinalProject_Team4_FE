import type { BeCategoryCode } from '@/data/categoryItemTypes'

/** 카탈로그 대분류 — 상의·하의·아우터·신발만 허용 */
export const WEARABLE_CATEGORY_CODES: readonly BeCategoryCode[] = [
  'TOP',
  'BOTTOM',
  'OUTER',
  'SHOES',
]

const WEARABLE_CATEGORY_SET = new Set<string>(WEARABLE_CATEGORY_CODES)

/** TOP/BOTTOM/OUTER/SHOES 외 비의류·잡화 키워드 (상품명·itemType 검사) */
const FORBIDDEN_WEARABLE_NAME_KEYWORDS = [
  '옷걸이',
  '행거',
  'hanger',
  '안경',
  '선글라스',
  'glasses',
  'eyewear',
  '가방',
  'backpack',
  '숄더백',
  '토트백',
  '모자',
  'cap',
  'hat',
  'beanie',
  '벨트',
  'belt',
  '장갑',
  'glove',
  '시계',
  'watch',
  '지갑',
  'wallet',
  '목걸이',
  '귀걸이',
  '반지',
  'jewelry',
  '액세서리',
  'accessory',
] as const

function normalizeForKeywordCheck(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

function containsForbiddenWearableKeyword(...texts: (string | null | undefined)[]): boolean {
  const merged = texts
    .filter((text): text is string => Boolean(text?.trim()))
    .map((text) => normalizeForKeywordCheck(text))
    .join('')
  if (!merged) return false
  return FORBIDDEN_WEARABLE_NAME_KEYWORDS.some((keyword) =>
    merged.includes(normalizeForKeywordCheck(keyword)),
  )
}

export function isAllowedWearableCategory(category: string | null | undefined): boolean {
  if (!category?.trim()) return false
  return WEARABLE_CATEGORY_SET.has(category.trim().toUpperCase())
}

export type WearableClothesFields = {
  name: string
  category: string
  itemType?: string | null
}

/** 추천·표시 후보가 의류(4대분류)이며 금지 키워드가 없는지 확인 */
export function isWearableClothesItem(item: WearableClothesFields): boolean {
  if (!isAllowedWearableCategory(item.category)) return false
  if (containsForbiddenWearableKeyword(item.name, item.itemType ?? undefined)) return false
  return true
}
