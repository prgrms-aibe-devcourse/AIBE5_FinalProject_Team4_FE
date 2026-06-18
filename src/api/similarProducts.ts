import api from '@/api'
import type { BeApiResponse, ClothesResponse } from '@/types/be'
import type {
  SimilarProductRecommendation,
} from '@/types/similarProducts'

async function unwrap<T>(
  promise: Promise<{ data: BeApiResponse<T> }>,
): Promise<T> {
  const { data: body } = await promise
  if (!body.success || body.data == null) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

export async function getBaseClothesForSimilarProducts(
  userId: number,
): Promise<ClothesResponse[]> {
  const clothes = await unwrap(
    api.get<BeApiResponse<ClothesResponse[]>>(
      `/api/v1/users/${userId}/clothes`,
    ),
  )
  return clothes.filter((item) =>
    item.ownershipStatus === 'OWNED' || item.ownershipStatus === 'WISHLIST',
  )
}

export async function getSimilarProducts(
  userId: number,
  clothesId: number,
): Promise<SimilarProductRecommendation> {
  return unwrap(
    api.get<BeApiResponse<SimilarProductRecommendation>>(
      `/api/v1/users/${userId}/clothes/${clothesId}/similar-products`,
    ),
  )
}
