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
  const [ownedResult, wishlistResult] = await Promise.allSettled([
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

  const owned = ownedResult.status === 'fulfilled' ? ownedResult.value : []
  const wishlist =
    wishlistResult.status === 'fulfilled' ? wishlistResult.value : []

  if (ownedResult.status === 'rejected' && wishlistResult.status === 'rejected') {
    throw new Error('기준 옷 목록을 불러오지 못했습니다.')
  }

  const clothesById = new Map<number, ClothesResponse>()

  owned.forEach((item) => {
    clothesById.set(item.clothesId, {
      ...item,
      ownershipStatus: 'OWNED',
    })
  })

  wishlist.forEach((item) => {
    clothesById.set(item.clothesId, {
      ...item,
      ownershipStatus: 'WISHLIST',
    })
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
