import api from '@/api'
import type { BeApiResponse } from '@/types/be'
import type { ClothesRecommendationResponse, RecommendedClothesItem } from '@/types/recommendations'

/** BE `@Max(10)` — 카테고리당 추천 상품 수 상한 */
export const MAX_RECOMMENDATIONS_PER_CATEGORY = 10

/** BE 기본값 5. UI 가로 스크롤을 위해 10 사용 */
export const DEFAULT_RECOMMENDATIONS_PER_CATEGORY = 10

export interface FetchClothesRecommendationsOptions {
  /** 카테고리당 최대 추천 수 (1~10, BE 기본 5) */
  limitPerCategory?: number
}

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

function clampLimitPerCategory(limit: number): number {
  return Math.min(MAX_RECOMMENDATIONS_PER_CATEGORY, Math.max(1, Math.floor(limit)))
}

export async function fetchClothesRecommendations(
  userId: number,
  clothesId: number,
  options?: FetchClothesRecommendationsOptions,
): Promise<ClothesRecommendationResponse> {
  if (!Number.isSafeInteger(clothesId) || clothesId <= 0) {
    throw new Error('유효하지 않은 clothesId입니다.')
  }

  const limitPerCategory = clampLimitPerCategory(
    options?.limitPerCategory ?? DEFAULT_RECOMMENDATIONS_PER_CATEGORY,
  )

  return unwrap(
    api.get<BeApiResponse<ClothesRecommendationResponse>>(
      `/api/v1/users/${userId}/clothes/${clothesId}/recommendations`,
      { params: { limitPerCategory } },
    ),
  )
}

/**
 * GET /api/v1/recommendations/{wardrobeId}
 * 취향 기반 추천 (RECO-002)
 */
export async function fetchWardrobeRecommendations(
  wardrobeId: number,
  currentTemp?: number,
): Promise<RecommendedClothesItem[]> {
  return unwrap(
    api.get<BeApiResponse<RecommendedClothesItem[]>>(
      `/api/v1/recommendations/${wardrobeId}`,
      { params: { currentTemp } },
    ),
  )
}

/**
 * GET /api/v1/ootd/{wardrobeId}
 * OOTD 추천 (RECO-001)
 */
export async function fetchOotdRecommendations(
  wardrobeId: number,
  currentTemp?: number,
): Promise<any> {
  return unwrap(
    api.get<BeApiResponse<any>>(
      `/api/v1/ootd/${wardrobeId}`,
      { params: { currentTemp } },
    ),
  )
}

export type RecommendationFeedbackType = 'SAVED' | 'DISLIKE' | 'EXCLUDE'

export interface RecommendationFeedbackPayload {
  feedbackType: RecommendationFeedbackType
  clothesId?: number | null
  outfitId?: number | null
}

/** POST /api/v1/users/{userId}/recommendations/feedback */
export async function postRecommendationFeedback(
  userId: number,
  payload: RecommendationFeedbackPayload,
): Promise<void> {
  if (!userId) throw new Error('userId is required')
  await unwrap(api.post(`/api/v1/users/${userId}/recommendations/feedback`, payload))
}
