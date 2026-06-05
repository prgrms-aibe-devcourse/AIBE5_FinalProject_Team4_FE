import {
  isItemTypeInCategory,
  isUiCategory,
  type UiCategory,
} from '@/data/categoryItemTypes'
import { isGarmentColorCode } from '@/data/garmentColors'
import { isGarmentStyleCode } from '@/data/garmentStyles'

export const GARMENT_NAME_MAX_LENGTH = 80
export const FABRIC_MATERIAL_MAX_LENGTH = 120

export type GarmentRegisterDraft = {
  name: string
  category: UiCategory
  itemType: string
  mainColor: string
  secondaryColors: string[]
  mainStyle: string
  secondaryStyles: string[]
  fabricMaterial: string
}

export type GarmentFormField =
  | 'name'
  | 'category'
  | 'itemType'
  | 'mainColor'
  | 'mainStyle'
  | 'fabricMaterial'

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

  const fabric = draft.fabricMaterial.trim()
  if (fabric.length > FABRIC_MATERIAL_MAX_LENGTH) {
    errors.fabricMaterial = `소재 정보는 ${FABRIC_MATERIAL_MAX_LENGTH}자 이하로 입력해 주세요.`
  }

  return errors
}

export function hasFormErrors(errors: GarmentFormFieldErrors): boolean {
  return Object.keys(errors).length > 0
}
