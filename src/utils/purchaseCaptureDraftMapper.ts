import {
  resolveItemTypeForCategory,
  resolveUiCategory,
  UI_CATEGORY_TO_BE,
  type UiCategory,
} from '@/data/categoryItemTypes'
import { isExternalSourceCode, resolveExternalSourceCode } from '@/data/externalSources'
import { resolveGarmentColorCode } from '@/data/garmentColors'
import { resolveGarmentStyleCode } from '@/data/garmentStyles'
import type {
  PurchaseCaptureDraftResponse,
  PurchaseCaptureItemDraft,
  PurchaseCaptureItemStatus,
  PurchaseCaptureSaveRequest,
} from '@/types/purchaseCaptureRegistration'
import type { PurchaseRegisterDraft } from '@/utils/purchaseRegisterValidation'
import { createEmptyPurchaseRegisterDraft } from '@/utils/purchaseRegisterValidation'

type PurchaseCaptureDraftFields =
  | PurchaseCaptureItemDraft
  | PurchaseCaptureDraftResponse

export type PurchasePendingItemStatus = 'pending' | 'saved' | 'skipped'

export function mapPurchaseCaptureItemStatus(
  status: PurchaseCaptureItemStatus,
): PurchasePendingItemStatus {
  if (status === 'SAVED') {
    return 'saved'
  }
  if (status === 'SKIPPED') {
    return 'skipped'
  }
  return 'pending'
}

export type PurchasePendingItemShape = {
  itemIndex: number
  draft: PurchaseRegisterDraft
  status: PurchasePendingItemStatus
  itemImageUrl?: string | null
}

/** BE draft 응답을 FE pending 목록으로 동기화 (기존 draft 입력값 유지) */
export function buildPendingItemsFromCaptureDraft(
  beDraft: PurchaseCaptureDraftResponse,
  existingItems: PurchasePendingItemShape[] = [],
): PurchasePendingItemShape[] {
  const extracted = extractPurchaseCaptureItems(beDraft)
  return extracted.map((item) => {
    const existing = existingItems.find((entry) => entry.itemIndex === item.itemIndex)
    return {
      itemIndex: item.itemIndex,
      draft: existing?.draft ?? mapPurchaseItemToRegisterDraft(item),
      status: mapPurchaseCaptureItemStatus(item.status),
      itemImageUrl: item.imageUrl ?? existing?.itemImageUrl ?? null,
    }
  })
}

function mapItemFieldsToRegisterDraft(
  item: PurchaseCaptureDraftFields | null,
  fallback?: Partial<PurchaseRegisterDraft>,
): PurchaseRegisterDraft {
  const category = resolveUiCategory(item?.category ?? fallback?.category)
  const styles = item?.styles ?? []
  const mainStyle = resolveGarmentStyleCode(styles[0] ?? fallback?.mainStyle)
  const secondaryStyles = (styles.slice(1) ?? fallback?.secondaryStyles ?? [])
    .map((s) => resolveGarmentStyleCode(s))
    .filter((s) => s !== mainStyle)
  const suggestedSource = item?.suggestedExternalSource
  const externalSource = resolveExternalSourceCode(
    suggestedSource ?? fallback?.externalSource,
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
    size: fallback?.size ?? '',
    season: fallback?.season ?? '',
    productCode: fallback?.productCode ?? '',
    externalSource,
    optionText: (item?.optionText ?? fallback?.optionText ?? '').trim(),
  }
}

/** BE draft에서 단일/복수 상품 후보를 정규화 */
export function extractPurchaseCaptureItems(
  raw: PurchaseCaptureDraftResponse | null | undefined,
): PurchaseCaptureItemDraft[] {
  if (!raw) return []

  const captureImageUrl = raw.previewUrl ?? null
  const nested = raw.items
  if (Array.isArray(nested) && nested.length > 0) {
    const isSingleItem = nested.length === 1
    return nested.map((item, index) => {
      const itemImageUrl = item.imageUrl ?? null
      const isItemSpecificImage =
        itemImageUrl !== null && itemImageUrl !== captureImageUrl
      const resolvedImageUrl = isItemSpecificImage
        ? itemImageUrl
        : isSingleItem
          ? captureImageUrl
          : null
      return {
        ...item,
        itemIndex: item.itemIndex ?? index,
        status: item.status ?? 'PENDING',
        imageUrl: resolvedImageUrl,
      }
    })
  }

  const hasSingleItemSignal = Boolean(
    raw.name || raw.category || raw.itemType || raw.brandName,
  )
  if (!hasSingleItemSignal) return []

  return [
    {
      itemIndex: 0,
      status: 'PENDING',
      name: raw.name,
      brandName: raw.brandName,
      category: raw.category,
      itemType: raw.itemType,
      primaryColor: raw.primaryColor,
      secondaryColors: raw.secondaryColors ?? [],
      styles: raw.styles ?? [],
      optionText: raw.optionText,
      suggestedExternalSource: raw.suggestedExternalSource,
      imageUrl: captureImageUrl,
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
  options?: {
    itemIndex?: number
    captureId?: number
    productCodeFallback?: string
    imageUrl?: string | null
  },
): PurchaseCaptureSaveRequest {
  const styles = [
    draft.mainStyle,
    ...draft.secondaryStyles.filter((s) => s !== draft.mainStyle),
  ]

  const productCode =
    draft.productCode.trim() ||
    options?.productCodeFallback ||
    `PURCHASE-${options?.captureId ?? 'NEW'}-${options?.itemIndex ?? 0}-${Date.now()}`

  const trimmedExternalSource = draft.externalSource.trim()
  const externalSource = isExternalSourceCode(trimmedExternalSource)
    ? trimmedExternalSource
    : 'CUSTOM'

  const payload: PurchaseCaptureSaveRequest = {
    itemIndex: options?.itemIndex,
    name: draft.name.trim(),
    brandName: draft.brandName.trim() || 'UNKNOWN',
    productCode,
    category: UI_CATEGORY_TO_BE[draft.category as UiCategory],
    itemType: draft.itemType,
    primaryColor: draft.mainColor,
    secondaryColors: draft.secondaryColors,
    styles,
    externalSource,
    size: draft.size.trim() || 'FREE',
    season: draft.season.trim() || undefined,
    favorite: false,
    isVerified: false,
  }

  const imageUrl = options?.imageUrl?.trim()
  if (imageUrl) {
    payload.imageUrl = imageUrl
  }

  return payload
}
