import api from '@/api'
import type { BeApiResponse, ClothesResponse } from '@/types/be'
import { mapClothesListToGarments, mapClothesToGarment } from '@/utils/clothesMapper'
import type { Garment } from '@/types'

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

export async function fetchWardrobeGarments(userId: number): Promise<Garment[]> {
  const [owned, wishlist] = await Promise.all([
    unwrap(
      api.get<BeApiResponse<ClothesResponse[]>>(
        `/api/v1/users/${userId}/clothes`,
      ),
    ),
    unwrap(
      api.get<BeApiResponse<ClothesResponse[]>>(
        `/api/v1/users/${userId}/wishlist-clothes`,
      ),
    ),
  ])

  return mapClothesListToGarments([...owned, ...wishlist])
}

export async function updateClothesFavorite(
  clothesId: number,
  isFavorite: boolean,
): Promise<Garment> {
  const updated = await unwrap(
    api.patch<BeApiResponse<ClothesResponse>>(
      `/api/v1/clothes/${clothesId}/favorite`,
      { isFavorite },
    ),
  )
  return mapClothesToGarment(updated)
}

export async function convertWishlistToOwned(
  clothesId: number,
  payload: {
    productCode: string
    size: string
    season?: string
    userImageUrl: string
    isVerified: boolean
  },
): Promise<Garment> {
  const updated = await unwrap(
    api.patch<BeApiResponse<ClothesResponse>>(
      `/api/clothes/${clothesId}/convert-to-owned`,
      payload,
    ),
  )
  return mapClothesToGarment(updated)
}
