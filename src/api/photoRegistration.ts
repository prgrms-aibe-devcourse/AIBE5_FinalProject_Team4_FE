import api from '@/api'
import type { BeApiResponse, ClothesResponse } from '@/types/be'
import type {
  PhotoGarmentDraftResponse,
  PhotoGarmentSaveRequest,
  PhotoUploadResponse,
} from '@/types/photoRegistration'

const PHOTO_API_TIMEOUT_MS = 90_000

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

function photoBase(userId: number) {
  return `/api/v1/users/${userId}/clothes/photos`
}

export async function uploadGarmentPhoto(
  userId: number,
  file: File,
): Promise<PhotoUploadResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const uploaded = await unwrap(
    api.post<BeApiResponse<PhotoUploadResponse>>(photoBase(userId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: PHOTO_API_TIMEOUT_MS,
    }),
  )
  return normalizeUploadResponse(uploaded)
}

function normalizePhotoDraft(
  raw: PhotoGarmentDraftResponse,
): PhotoGarmentDraftResponse {
  return {
    ...raw,
    imageUrl: raw.imageUrl ?? raw.previewUrl ?? null,
  }
}

function normalizeUploadResponse(
  raw: PhotoUploadResponse,
): PhotoUploadResponse {
  return {
    ...raw,
    imageUrl: raw.imageUrl ?? raw.previewUrl ?? null,
  }
}

export function isPhotoAnalysisFailed(
  draft: PhotoGarmentDraftResponse | null | undefined,
): boolean {
  return Boolean(draft?.aiFailed || draft?.analysisStatus === 'FAILED')
}

export function getPhotoAnalysisFailureMessage(
  draft: PhotoGarmentDraftResponse | null | undefined,
): string {
  const message = draft?.failureMessage?.trim()
  if (message) return message
  return 'AI가 옷 이미지를 분석하지 못했습니다. 직접 입력해 주세요.'
}

export function isPhotoAnalysisReady(
  draft: PhotoGarmentDraftResponse | null | undefined,
): boolean {
  if (!draft || isPhotoAnalysisFailed(draft)) return false
  return (
    draft.analysisStatus === 'SUCCESS' ||
    Boolean(draft.name || draft.category || draft.itemType)
  )
}

export async function analyzeGarmentPhoto(
  userId: number,
  photoId: number,
): Promise<PhotoGarmentDraftResponse> {
  const analyzed = await unwrap(
    api.post<BeApiResponse<PhotoGarmentDraftResponse>>(
      `${photoBase(userId)}/${photoId}/analyze`,
      {},
      { timeout: PHOTO_API_TIMEOUT_MS },
    ),
  )
  return normalizePhotoDraft(analyzed)
}

export async function resolvePhotoAnalysisDraft(
  userId: number,
  photoId: number,
): Promise<PhotoGarmentDraftResponse> {
  const analyzed = await analyzeGarmentPhoto(userId, photoId)
  if (isPhotoAnalysisReady(analyzed) || isPhotoAnalysisFailed(analyzed)) {
    return analyzed
  }

  if (analyzed.analysisStatus === 'ANALYZING') {
    return pollGarmentPhotoDraft(userId, photoId)
  }

  return analyzed
}

export async function fetchGarmentPhotoDraft(
  userId: number,
  photoId: number,
): Promise<PhotoGarmentDraftResponse | null> {
  try {
    const draft = await unwrap(
      api.get<BeApiResponse<PhotoGarmentDraftResponse>>(
        `${photoBase(userId)}/${photoId}/draft`,
        { timeout: PHOTO_API_TIMEOUT_MS },
      ),
    )
    return normalizePhotoDraft(draft)
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

export async function pollGarmentPhotoDraft(
  userId: number,
  photoId: number,
  options?: { maxAttempts?: number; intervalMs?: number },
): Promise<PhotoGarmentDraftResponse> {
  const maxAttempts = options?.maxAttempts ?? 30
  const intervalMs = options?.intervalMs ?? 2000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const draft = await fetchGarmentPhotoDraft(userId, photoId)
    if (isPhotoAnalysisFailed(draft)) {
      return draft!
    }
    if (draft && isPhotoAnalysisReady(draft)) {
      return draft
    }
    await sleep(intervalMs)
  }

  throw new Error('AI 분석 시간이 초과되었습니다. 직접 입력해 주세요.')
}

export async function saveGarmentFromPhoto(
  userId: number,
  photoId: number,
  payload: PhotoGarmentSaveRequest,
): Promise<ClothesResponse> {
  return unwrap(
    api.post<BeApiResponse<ClothesResponse>>(
      `${photoBase(userId)}/${photoId}/save`,
      payload,
      { timeout: PHOTO_API_TIMEOUT_MS },
    ),
  )
}
