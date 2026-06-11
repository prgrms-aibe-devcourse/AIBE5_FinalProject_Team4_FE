import api from '@/api'
import type { BeApiResponse } from '@/types/be'
import type { ClothesRecommendationResponse } from '@/types/recommendations'

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
 * Submit recommendation feedback (SAVE / DISLIKE / EXCLUDE)
 * POST /api/v1/users/{userId}/recommendations/feedback
 */
export async function postRecommendationFeedback(
  userId: number,
  payload: { type: 'SAVE' | 'DISLIKE' | 'EXCLUDE'; clothesId?: number; outfitId?: number; reason?: string },
): Promise<void> {
  await unwrap(api.post(`/api/v1/users/${userId}/recommendations/feedback`, payload))
}
