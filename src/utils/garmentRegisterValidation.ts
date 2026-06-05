import {
  isItemTypeInCategory,
  isUiCategory,
  type UiCategory,
} from '@/data/categoryItemTypes'
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

export type GarmentRegisterDraft = {
  name: string
  category: UiCategory
  itemType: string
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
