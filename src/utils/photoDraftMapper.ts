import {
  resolveItemTypeForCategory,
  resolveUiCategory,
  UI_CATEGORY_TO_BE,
  type UiCategory,
} from '@/data/categoryItemTypes'
import { resolveGarmentColorCode } from '@/data/garmentColors'
import { resolveGarmentStyleCode } from '@/data/garmentStyles'
import type { PhotoGarmentDraftResponse, PhotoGarmentSaveRequest } from '@/types/photoRegistration'
import type { GarmentRegisterDraft } from '@/utils/garmentRegisterValidation'

export function mapPhotoDraftToRegisterDraft(
  beDraft: PhotoGarmentDraftResponse | null,
  fallback?: Partial<GarmentRegisterDraft>,
): GarmentRegisterDraft {
  const category = resolveUiCategory(beDraft?.category ?? fallback?.category)
  const styles = beDraft?.styles ?? []
  const mainStyle = resolveGarmentStyleCode(styles[0] ?? fallback?.mainStyle)
  const secondaryStyles = (styles.slice(1) ?? fallback?.secondaryStyles ?? [])
    .map((s) => resolveGarmentStyleCode(s))
    .filter((s) => s !== mainStyle)

  return {
    name: (beDraft?.name ?? fallback?.name ?? '').trim(),
    category,
    itemType: resolveItemTypeForCategory(category, beDraft?.itemType ?? fallback?.itemType),
    mainColor: resolveGarmentColorCode(
      beDraft?.primaryColor ?? fallback?.mainColor,
    ),
    secondaryColors: (beDraft?.secondaryColors ?? fallback?.secondaryColors ?? [])
      .map((c) => resolveGarmentColorCode(c))
      .filter((c) => c !== resolveGarmentColorCode(beDraft?.primaryColor)),
    mainStyle,
    secondaryStyles,
    brandName: (beDraft?.brandName ?? fallback?.brandName ?? '').trim(),
    size: (beDraft?.size ?? fallback?.size ?? '').trim(),
    season: (beDraft?.season ?? fallback?.season ?? '').trim(),
  }
}

export function createEmptyRegisterDraft(category: UiCategory = 'Top'): GarmentRegisterDraft {
  return mapPhotoDraftToRegisterDraft(null, { category })
}

export function buildPhotoSavePayload(
  draft: GarmentRegisterDraft,
  productCode?: string,
): PhotoGarmentSaveRequest {
  const styles = [
    draft.mainStyle,
    ...draft.secondaryStyles.filter((s) => s !== draft.mainStyle),
  ]

  return {
    name: draft.name.trim(),
    brandName: draft.brandName.trim() || 'UNKNOWN',
    productCode: productCode ?? `PHOTO-${Date.now()}`,
    category: UI_CATEGORY_TO_BE[draft.category],
    itemType: draft.itemType,
    primaryColor: draft.mainColor,
    secondaryColors: draft.secondaryColors,
    styles,
    size: draft.size.trim() || 'FREE',
    season: draft.season.trim() || undefined,
    favorite: false,
    isVerified: false,
  }
}
