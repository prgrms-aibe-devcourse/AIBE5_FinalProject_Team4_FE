import api from '@/api'
import type { BeApiResponse } from '@/types/be'
import type { ClothesRecommendationResponse } from '@/types/recommendations'

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

export async function fetchClothesRecommendations(
  userId: number,
  clothesId: number,
): Promise<ClothesRecommendationResponse> {
  return unwrap(
    api.get<BeApiResponse<ClothesRecommendationResponse>>(
      `/api/v1/users/${userId}/clothes/${clothesId}/recommendations`,
    ),
  )
}
