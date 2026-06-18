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
  const [ownedClothes, wishlistClothes] = await Promise.all([
    unwrap(
      api.get<BeApiResponse<ClothesResponse[]>>(
        `/api/v1/users/${userId}/clothes`,
      ),
    ),
    unwrap(
      api.get<BeApiResponse<ClothesResponse[]>>(
        `/api/users/${userId}/wishlist-clothes`,
      ),
    ),
  ])

  const clothesById = new Map<number, ClothesResponse>()
  const baseClothes = [...ownedClothes, ...wishlistClothes]

  baseClothes.forEach((item) => {
    if (item.ownershipStatus !== 'OWNED' && item.ownershipStatus !== 'WISHLIST') {
      return
    }
    clothesById.set(item.clothesId, item)
  })

  return Array.from(clothesById.values())
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
