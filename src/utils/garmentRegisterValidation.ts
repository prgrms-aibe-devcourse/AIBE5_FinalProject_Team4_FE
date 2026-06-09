import {
  isItemTypeInCategory,
  isUiCategory,
  type UiCategory,
} from '@/data/categoryItemTypes'
import { resolveClothesGender, isClothesGender, type ClothesGender } from '@/data/garmentGender'
import { isGarmentColorCode } from '@/data/garmentColors'
import { isGarmentStyleCode } from '@/data/garmentStyles'

export const GARMENT_NAME_MAX_LENGTH = 80
/** BE `CLOTHES.brand_name` VARCHAR(100) */
export const BRAND_NAME_MAX_LENGTH = 100
/** BE `WARDROBE_CLOTHES.size` VARCHAR(50) */
export const GARMENT_SIZE_MAX_LENGTH = 50
/** BE `WARDROBE_CLOTHES.season` VARCHAR(50) */
export const GARMENT_SEASON_MAX_LENGTH = 50

export const GARMENT_SEASON_OPTIONS = [
  { code: 'SPRING', label: '봄' },
  { code: 'SUMMER', label: '여름' },
  { code: 'FALL', label: '가을' },
  { code: 'WINTER', label: '겨울' },
  { code: 'ALL_SEASON', label: '사계절' },
] as const

const SIZE_FREE = { code: 'FREE', label: 'FREE' } as const

/** 공통 알파벳 사이즈 */
const LETTER_SIZES = [
  { code: 'XS',  label: 'XS' },
  { code: 'S',   label: 'S' },
  { code: 'M',   label: 'M' },
  { code: 'L',   label: 'L' },
  { code: 'XL',  label: 'XL' },
  { code: 'XXL', label: 'XXL' },
] as const

/** 상의 · 아우터 — 알파벳 사이즈 */
const TOP_SIZES = [...LETTER_SIZES, SIZE_FREE] as const

/** 하의 — 알파벳 사이즈 */
const BOTTOM_SIZES = [...LETTER_SIZES, SIZE_FREE] as const

/** 신발 — mm 단위 */
const SHOES_SIZES = [
  { code: '220', label: '220' },
  { code: '225', label: '225' },
  { code: '230', label: '230' },
  { code: '235', label: '235' },
  { code: '240', label: '240' },
  { code: '245', label: '245' },
  { code: '250', label: '250' },
  { code: '255', label: '255' },
  { code: '260', label: '260' },
  { code: '265', label: '265' },
  { code: '270', label: '270' },
  { code: '275', label: '275' },
  { code: '280', label: '280' },
  { code: '285', label: '285' },
  { code: '290', label: '290' },
  SIZE_FREE,
] as const

export const GARMENT_SIZE_OPTIONS_BY_CATEGORY = {
  Top:    TOP_SIZES,
  Bottom: BOTTOM_SIZES,
  Outer:  TOP_SIZES,
  Shoes:  SHOES_SIZES,
} as const

export type GarmentSizeCategory = keyof typeof GARMENT_SIZE_OPTIONS_BY_CATEGORY

export function getSizeOptionsByCategory(category: string) {
  return GARMENT_SIZE_OPTIONS_BY_CATEGORY[category as GarmentSizeCategory] ?? TOP_SIZES
}

export type GarmentRegisterDraft = {
  name: string
  category: UiCategory
  itemType: string
  gender: ClothesGender
  mainColor: string
  secondaryColors: string[]
  mainStyle: string
  secondaryStyles: string[]
  brandName: string
  size: string
  season: string
}

export type GarmentFormField =
  | 'name'
  | 'category'
  | 'itemType'
  | 'gender'
  | 'mainColor'
  | 'mainStyle'
  | 'brandName'
  | 'size'
  | 'season'

export type GarmentFormFieldErrors = Partial<Record<GarmentFormField, string>>

export function validateGarmentRegisterDraft(
  draft: GarmentRegisterDraft,
): GarmentFormFieldErrors {
  const errors: GarmentFormFieldErrors = {}

  const name = draft.name.trim()
  if (!name) errors.name = '의상명을 입력해 주세요.'
  else if (name.length > GARMENT_NAME_MAX_LENGTH) {
    errors.name = `의상명은 ${GARMENT_NAME_MAX_LENGTH}자 이하로 입력해 주세요.`
  }

  if (!isUiCategory(draft.category)) {
    errors.category = '카테고리를 선택해 주세요.'
  }

  if (!draft.itemType.trim()) {
    errors.itemType = '세부 카테고리를 선택해 주세요.'
  } else if (
    isUiCategory(draft.category) &&
    !isItemTypeInCategory(draft.category, draft.itemType)
  ) {
    errors.itemType = '세부 카테고리를 선택해 주세요.'
  }

  if (!isGarmentColorCode(draft.mainColor.trim())) {
    errors.mainColor = '메인 컬러를 선택해 주세요.'
  }

  if (!isGarmentStyleCode(draft.mainStyle.trim())) {
    errors.mainStyle = '메인 스타일을 선택해 주세요.'
  }

  if (!isClothesGender(draft.gender)) {
    errors.gender = '대상 성별을 선택해 주세요.'
  }

  const brand = draft.brandName.trim()
  if (brand.length > BRAND_NAME_MAX_LENGTH) {
    errors.brandName = `브랜드명은 ${BRAND_NAME_MAX_LENGTH}자 이하로 입력해 주세요.`
  }

  const size = draft.size.trim()
  if (size.length > GARMENT_SIZE_MAX_LENGTH) {
    errors.size = `사이즈는 ${GARMENT_SIZE_MAX_LENGTH}자 이하로 입력해 주세요.`
  }

  const season = draft.season.trim()
  if (season.length > GARMENT_SEASON_MAX_LENGTH) {
    errors.season = `시즌은 ${GARMENT_SEASON_MAX_LENGTH}자 이하로 입력해 주세요.`
  }

  return errors
}

export function hasFormErrors(errors: GarmentFormFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
