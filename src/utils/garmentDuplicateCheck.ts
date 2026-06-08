import { UI_CATEGORY_TO_BE, type UiCategory } from '@/data/categoryItemTypes'
import type { Garment } from '@/types'

export const DUPLICATE_OWNED_MESSAGE = '이미 보유 중인 옷입니다.'
export const DUPLICATE_WISHLIST_MESSAGE = '이미 위시리스트에 등록된 옷입니다.'
export const DUPLICATE_PRODUCT_CODE_MESSAGE = '이미 보유 중인 품번입니다.'

const LEGACY_DUPLICATE_MESSAGES: Record<string, string> = {
  '이미 옷장에 등록된 옷입니다.': DUPLICATE_OWNED_MESSAGE,
  '이미 옷장에 등록된 품번입니다.': DUPLICATE_PRODUCT_CODE_MESSAGE,
  '이미 위시리스트에 등록된 옷입니다.': DUPLICATE_WISHLIST_MESSAGE,
  '이미 존재하는 데이터입니다.': DUPLICATE_OWNED_MESSAGE,
}

export function normalizeDuplicateRegisterError(message: string): string | null {
  const trimmed = message.trim()
  if (
    trimmed === DUPLICATE_OWNED_MESSAGE ||
    trimmed === DUPLICATE_WISHLIST_MESSAGE ||
    trimmed === DUPLICATE_PRODUCT_CODE_MESSAGE
  ) {
    return trimmed
  }
  return LEGACY_DUPLICATE_MESSAGES[trimmed] ?? null
}

export function isDuplicateRegisterError(message: string | null | undefined): boolean {
  if (!message) return false
  return normalizeDuplicateRegisterError(message) !== null
}

export function isEphemeralProductCode(productCode: string | undefined | null): boolean {
  const trimmed = (productCode ?? '').trim()
  if (!trimmed) return true
  return (
    trimmed.startsWith('PHOTO-') ||
    trimmed.startsWith('PURCHASE-') ||
    trimmed.toUpperCase() === 'UNKNOWN'
  )
}

function normalizeLabel(value: string | undefined | null): string {
  const trimmed = (value ?? '').trim()
  return trimmed || 'UNKNOWN'
}

export interface GarmentDuplicateCandidate {
  name: string
  brandName: string
  category: UiCategory
  itemType: string
  /** 사진 등록 등 품번이 없을 때 옷 지문 비교에 사용 */
  primaryColor: string
  productCode?: string
}

export function findDuplicateGarment(
  existing: Garment[],
  candidate: GarmentDuplicateCandidate,
): Garment | null {
  const name = normalizeLabel(candidate.name).toLowerCase()
  const brand = normalizeLabel(candidate.brandName).toLowerCase()
  const beCategory = UI_CATEGORY_TO_BE[candidate.category]
  const primaryColor = candidate.primaryColor.trim() || 'WHITE'
  const productCode = candidate.productCode?.trim()

  if (productCode && !isEphemeralProductCode(productCode)) {
    const byCode = existing.find((g) => g.productCode?.trim() === productCode)
    if (byCode) return byCode
  }

  return (
    existing.find((g) => {
      if (!g.be) return false
      return (
        normalizeLabel(g.name).toLowerCase() === name &&
        normalizeLabel(g.be.brandName).toLowerCase() === brand &&
        g.be.categoryCode === beCategory &&
        g.be.itemTypeCode === candidate.itemType &&
        (g.be.primaryColorCode || 'WHITE') === primaryColor
      )
    }) ?? null
  )
}

export function getDuplicateGarmentMessage(garment: Garment): string {
  return garment.isWishlist ? DUPLICATE_WISHLIST_MESSAGE : DUPLICATE_OWNED_MESSAGE
}

export function buildDuplicateRegisterError(
  existing: Garment[],
  candidate: GarmentDuplicateCandidate,
): string | null {
  const duplicate = findDuplicateGarment(existing, candidate)
  return duplicate ? getDuplicateGarmentMessage(duplicate) : null
}
