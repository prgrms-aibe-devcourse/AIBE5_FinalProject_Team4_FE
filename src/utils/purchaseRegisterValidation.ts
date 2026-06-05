import type { ExternalSourceCode } from '@/data/externalSources'
import { isExternalSourceCode } from '@/data/externalSources'
import {
  hasFormErrors,
  validateGarmentRegisterDraft,
  type GarmentFormFieldErrors,
  type GarmentRegisterDraft,
} from '@/utils/garmentRegisterValidation'

export const PRODUCT_CODE_MAX_LENGTH = 100

export type PurchaseRegisterDraft = GarmentRegisterDraft & {
  productCode: string
  externalSource: ExternalSourceCode | ''
  optionText: string
}

export type PurchaseFormField =
  | keyof GarmentFormFieldErrors
  | 'productCode'
  | 'externalSource'

export type PurchaseFormFieldErrors = GarmentFormFieldErrors & {
  productCode?: string
  externalSource?: string
}

export function createEmptyPurchaseRegisterDraft(): PurchaseRegisterDraft {
  return {
    name: '',
    category: 'Top',
    itemType: '',
    mainColor: '',
    secondaryColors: [],
    mainStyle: '',
    secondaryStyles: [],
    brandName: '',
    size: '',
    season: '',
    productCode: '',
    externalSource: '',
    optionText: '',
  }
}

export function validatePurchaseRegisterDraft(
  draft: PurchaseRegisterDraft,
): PurchaseFormFieldErrors {
  const errors: PurchaseFormFieldErrors = {
    ...validateGarmentRegisterDraft(draft),
  }

  const productCode = draft.productCode.trim()
  if (!productCode) {
    errors.productCode = '품번을 입력해 주세요.'
  } else if (productCode.length > PRODUCT_CODE_MAX_LENGTH) {
    errors.productCode = `품번은 ${PRODUCT_CODE_MAX_LENGTH}자 이하로 입력해 주세요.`
  }

  const source = draft.externalSource.trim()
  if (source && !isExternalSourceCode(source)) {
    errors.externalSource = '쇼핑몰 출처를 선택해 주세요.'
  }

  return errors
}

export function hasPurchaseFormErrors(errors: PurchaseFormFieldErrors): boolean {
  return hasFormErrors(errors)
}
