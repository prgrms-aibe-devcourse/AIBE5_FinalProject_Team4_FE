import {
  resolveItemTypeForCategory,
  resolveUiCategory,
  UI_CATEGORY_TO_BE,
  type UiCategory,
} from '@/data/categoryItemTypes'
import { resolveExternalSourceCode } from '@/data/externalSources'
import { resolveGarmentColorCode } from '@/data/garmentColors'
import { resolveGarmentStyleCode } from '@/data/garmentStyles'
import type {
  PurchaseCaptureDraftResponse,
  PurchaseCaptureItemDraft,
  PurchaseCaptureSaveRequest,
} from '@/types/purchaseCaptureRegistration'
import type { PurchaseRegisterDraft } from '@/utils/purchaseRegisterValidation'
import { createEmptyPurchaseRegisterDraft } from '@/utils/purchaseRegisterValidation'

function mapItemFieldsToRegisterDraft(
  item: PurchaseCaptureItemDraft | PurchaseCaptureDraftResponse | null,
  fallback?: Partial<PurchaseRegisterDraft>,
): PurchaseRegisterDraft {
  const category = resolveUiCategory(item?.category ?? fallback?.category)
  const styles = item?.styles ?? []
  const mainStyle = resolveGarmentStyleCode(styles[0] ?? fallback?.mainStyle)
  const secondaryStyles = (styles.slice(1) ?? fallback?.secondaryStyles ?? [])
    .map((s) => resolveGarmentStyleCode(s))
    .filter((s) => s !== mainStyle)
  const externalSource = resolveExternalSourceCode(
    item?.externalSource ??
      item?.suggestedExternalSource ??
      fallback?.externalSource,
  )

  return {
    name: (item?.name ?? fallback?.name ?? '').trim(),
    category,
    itemType: resolveItemTypeForCategory(category, item?.itemType ?? fallback?.itemType),
    mainColor: resolveGarmentColorCode(item?.primaryColor ?? fallback?.mainColor),
    secondaryColors: (item?.secondaryColors ?? fallback?.secondaryColors ?? [])
      .map((c) => resolveGarmentColorCode(c))
      .filter((c) => c !== resolveGarmentColorCode(item?.primaryColor)),
    mainStyle,
    secondaryStyles,
    brandName: (item?.brandName ?? fallback?.brandName ?? '').trim(),
    size: (item?.size ?? fallback?.size ?? '').trim(),
    season: (item?.season ?? fallback?.season ?? '').trim(),
    productCode: (item?.productCode ?? fallback?.productCode ?? '').trim(),
    externalSource,
    optionText: (item?.optionText ?? fallback?.optionText ?? '').trim(),
  }
}

/** BE draft에서 단일/복수 상품 후보를 정규화 */
export function extractPurchaseCaptureItems(
  raw: PurchaseCaptureDraftResponse | null | undefined,
): PurchaseCaptureItemDraft[] {
  if (!raw) return []

  const nested = raw.items ?? raw.detectedItems
  if (Array.isArray(nested) && nested.length > 0) {
    const captureImageUrl = raw.imageUrl ?? raw.previewUrl ?? null
    return nested.map((item, index) => {
      const itemImageUrl = item.imageUrl ?? item.thumbnailUrl ?? null
      const isItemSpecificImage =
        itemImageUrl !== null && itemImageUrl !== captureImageUrl
      return {
        ...item,
        itemIndex: item.itemIndex ?? index,
        imageUrl: isItemSpecificImage ? itemImageUrl : null,
        thumbnailUrl: null,
      }
    })
  }

  const hasSingleItemSignal = Boolean(
    raw.name ||
      raw.category ||
      raw.itemType ||
      raw.productCode ||
      raw.brandName,
  )
  if (!hasSingleItemSignal) return []

  return [
    {
      itemIndex: 0,
      name: raw.name,
      brandName: raw.brandName,
      productCode: raw.productCode,
      category: raw.category,
      itemType: raw.itemType,
      primaryColor: raw.primaryColor,
      secondaryColors: raw.secondaryColors,
      styles: raw.styles,
      size: raw.size,
      season: raw.season,
      optionText: raw.optionText,
      suggestedExternalSource: raw.suggestedExternalSource,
      externalSource: raw.externalSource,
    },
  ]
}

export function mapPurchaseItemToRegisterDraft(
  item: PurchaseCaptureItemDraft,
): PurchaseRegisterDraft {
  return mapItemFieldsToRegisterDraft(item)
}

export function mapPurchaseDraftToRegisterDraft(
  beDraft: PurchaseCaptureDraftResponse | null,
  fallback?: Partial<PurchaseRegisterDraft>,
): PurchaseRegisterDraft {
  if (!beDraft) return createEmptyPurchaseRegisterDraft()
  const first = extractPurchaseCaptureItems(beDraft)[0]
  if (first) return mapPurchaseItemToRegisterDraft(first)
  return mapItemFieldsToRegisterDraft(beDraft, fallback)
}

export function buildPurchaseSavePayload(
  draft: PurchaseRegisterDraft,
  options?: { itemIndex?: number; captureId?: number; productCodeFallback?: string },
): PurchaseCaptureSaveRequest {
  const styles = [
    draft.mainStyle,
    ...draft.secondaryStyles.filter((s) => s !== draft.mainStyle),
  ]

  const productCode =
    draft.productCode.trim() ||
    options?.productCodeFallback ||
    `PURCHASE-${options?.captureId ?? 'NEW'}-${options?.itemIndex ?? 0}-${Date.now()}`

  return {
    itemIndex: options?.itemIndex,
    name: draft.name.trim(),
    brandName: draft.brandName.trim() || 'UNKNOWN',
    productCode,
    category: UI_CATEGORY_TO_BE[draft.category as UiCategory],
    itemType: draft.itemType,
    primaryColor: draft.mainColor,
    secondaryColors: draft.secondaryColors,
    styles,
    externalSource: draft.externalSource.trim() || undefined,
    size: draft.size.trim() || 'FREE',
    season: draft.season.trim() || undefined,
    favorite: false,
    isVerified: false,
  }
}
