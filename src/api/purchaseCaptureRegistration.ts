import api from '@/api'
import type { BeApiResponse, ClothesResponse } from '@/types/be'
import type {
  PurchaseCaptureDraftResponse,
  PurchaseCaptureSaveRequest,
  PurchaseCaptureUploadResponse,
  PurchaseClothesRegistrationResponse,
} from '@/types/purchaseCaptureRegistration'

const CAPTURE_API_TIMEOUT_MS = 90_000

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

function captureBase(userId: number) {
  return `/api/v1/users/${userId}/clothes/purchase-captures`
}

export async function uploadPurchaseCapture(
  userId: number,
  file: File,
): Promise<PurchaseCaptureUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const uploaded = await unwrap(
    api.post<BeApiResponse<PurchaseCaptureUploadResponse>>(captureBase(userId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: CAPTURE_API_TIMEOUT_MS,
    }),
  )
  return normalizeUploadResponse(uploaded)
}

function normalizeCaptureDraft(
  raw: PurchaseCaptureDraftResponse,
): PurchaseCaptureDraftResponse {
  return {
    ...raw,
    imageUrl: raw.imageUrl ?? raw.previewUrl ?? null,
  }
}

function normalizeUploadResponse(
  raw: PurchaseCaptureUploadResponse,
): PurchaseCaptureUploadResponse {
  return {
    ...raw,
    imageUrl: raw.imageUrl ?? raw.previewUrl ?? null,
  }
}

export function isPurchaseAnalysisFailed(
  draft: PurchaseCaptureDraftResponse | null | undefined,
): boolean {
  return Boolean(draft?.aiFailed || draft?.analysisStatus === 'FAILED')
}

export function getPurchaseAnalysisFailureMessage(
  draft: PurchaseCaptureDraftResponse | null | undefined,
): string {
  const message = draft?.failureMessage?.trim()
  if (message) return message
  return 'AI가 구매내역을 분석하지 못했습니다. 직접 입력해 주세요.'
}

export function isPurchaseAnalysisReady(
  draft: PurchaseCaptureDraftResponse | null | undefined,
): boolean {
  if (!draft || isPurchaseAnalysisFailed(draft)) return false
  if (draft.analysisStatus === 'SUCCESS') return true
  const items = draft.items ?? draft.detectedItems
  if (Array.isArray(items) && items.length > 0) return true
  return Boolean(draft.name || draft.category || draft.itemType || draft.productCode)
}

export async function analyzePurchaseCapture(
  userId: number,
  captureId: number,
): Promise<PurchaseCaptureDraftResponse> {
  const analyzed = await unwrap(
    api.post<BeApiResponse<PurchaseCaptureDraftResponse>>(
      `${captureBase(userId)}/${captureId}/analyze`,
      {},
      { timeout: CAPTURE_API_TIMEOUT_MS },
    ),
  )
  return normalizeCaptureDraft(analyzed)
}

export async function resolvePurchaseAnalysisDraft(
  userId: number,
  captureId: number,
): Promise<PurchaseCaptureDraftResponse> {
  const analyzed = await analyzePurchaseCapture(userId, captureId)
  if (isPurchaseAnalysisReady(analyzed) || isPurchaseAnalysisFailed(analyzed)) {
    return analyzed
  }

  if (analyzed.analysisStatus === 'ANALYZING') {
    return pollPurchaseCaptureDraft(userId, captureId)
  }

  return analyzed
}

export async function fetchPurchaseCaptureDraft(
  userId: number,
  captureId: number,
): Promise<PurchaseCaptureDraftResponse | null> {
  try {
    const draft = await unwrap(
      api.get<BeApiResponse<PurchaseCaptureDraftResponse>>(
        `${captureBase(userId)}/${captureId}/draft`,
        { timeout: CAPTURE_API_TIMEOUT_MS },
      ),
    )
    return normalizeCaptureDraft(draft)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error != null &&
      'response' in error &&
      (error as { response?: { status?: number } }).response?.status === 404
    ) {
      return null
    }
    throw error
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function pollPurchaseCaptureDraft(
  userId: number,
  captureId: number,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<PurchaseCaptureDraftResponse> {
  const maxAttempts = options?.maxAttempts ?? 30
  const intervalMs = options?.intervalMs ?? 2000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const draft = await fetchPurchaseCaptureDraft(userId, captureId)
    if (isPurchaseAnalysisFailed(draft)) {
      return draft!
    }
    if (draft && isPurchaseAnalysisReady(draft)) {
      return draft
    }
    await sleep(intervalMs)
  }

  throw new Error('AI 분석 시간이 초과되었습니다. 직접 입력해 주세요.')
}

export function mapPurchaseSaveResponseToClothesResponse(
  raw: PurchaseClothesRegistrationResponse,
): ClothesResponse {
  const clothes = raw.clothes
  return {
    ...clothes,
    wardrobeClothesId: raw.wardrobeClothesId ?? clothes.wardrobeClothesId ?? null,
    wardrobeId: raw.wardrobeId ?? clothes.wardrobeId ?? null,
    userImageUrl: raw.userImageUrl ?? clothes.userImageUrl ?? clothes.imageUrl ?? null,
    isFavorite: raw.favorite ?? clothes.isFavorite ?? false,
    size: raw.size ?? clothes.size ?? null,
    season: raw.season ?? clothes.season ?? null,
    ownershipStatus: raw.ownershipStatus ?? clothes.ownershipStatus ?? 'OWNED',
    secondaryColors: clothes.secondaryColors ?? [],
    styles: clothes.styles ?? [],
  }
}

export async function saveGarmentFromPurchaseCapture(
  userId: number,
  captureId: number,
  payload: PurchaseCaptureSaveRequest,
): Promise<ClothesResponse> {
  const saved = await unwrap(
    api.post<BeApiResponse<PurchaseClothesRegistrationResponse>>(
      `${captureBase(userId)}/${captureId}/save`,
      payload,
      { timeout: CAPTURE_API_TIMEOUT_MS },
    ),
  )
  return mapPurchaseSaveResponseToClothesResponse(saved)
}
