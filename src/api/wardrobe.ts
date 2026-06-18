import api from '@/api'
import type {
  BeApiResponse,
  ClothesGender,
  ClothesResponse,
  WardrobeStatisticsResponse,
} from '@/types/be'
import {
  mapClothesListToGarments,
  mapClothesToGarment,
  buildClothesUpdatePayload,
} from '@/utils/clothesMapper'
import type { Garment } from '@/types'
import type { WishlistClothesCreatePayload } from '@/utils/recommendWishlistPayload'

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

function toErrorMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message
  return '요청에 실패했습니다.'
}

/** BE WishlistClothesController — `/api/v1` prefix 없음 */
const wishlistClothesPath = (userId: number) =>
  `/api/users/${userId}/wishlist-clothes`

export interface WardrobeMeta {
  wardrobeId: number
  userId: number
}

export interface WardrobeGarmentsResult {
  garments: Garment[]
  partialErrors?: {
    owned?: string
    wishlist?: string
  }
}

export async function fetchWardrobeStatistics(
  userId: number,
): Promise<WardrobeStatisticsResponse | null> {
  try {
    return await unwrap(
      api.get<BeApiResponse<WardrobeStatisticsResponse>>(
        `/api/v1/wardrobes/users/${userId}/statistics`,
      ),
    )
  } catch {
    return null
  }
}

export async function fetchWardrobeMeta(userId: number): Promise<WardrobeMeta | null> {
  try {
    return await unwrap(
      api.get<BeApiResponse<WardrobeMeta>>(
        `/api/v1/wardrobes/users/${userId}`,
      ),
    )
  } catch {
    return null
  }
}

export async function fetchWardrobeGarments(
  userId: number,
  options?: { favoritesOnly?: boolean },
): Promise<WardrobeGarmentsResult> {
  const ownedPath = options?.favoritesOnly
    ? `/api/v1/users/${userId}/clothes/favorites`
    : `/api/v1/users/${userId}/clothes`

  const wishlistPath = options?.favoritesOnly
    ? `${wishlistClothesPath(userId)}/favorites`
    : wishlistClothesPath(userId)

  const [ownedResult, wishlistResult] = await Promise.allSettled([
    unwrap(api.get<BeApiResponse<ClothesResponse[]>>(ownedPath)),
    unwrap(api.get<BeApiResponse<ClothesResponse[]>>(wishlistPath)),
  ])

  const partialErrors: WardrobeGarmentsResult['partialErrors'] = {}

  const owned =
    ownedResult.status === 'fulfilled' ? ownedResult.value : []
  if (ownedResult.status === 'rejected') {
    partialErrors.owned = toErrorMessage(ownedResult.reason)
  }

  const wishlist =
    wishlistResult.status === 'fulfilled' ? wishlistResult.value : []
  if (wishlistResult.status === 'rejected') {
    partialErrors.wishlist = toErrorMessage(wishlistResult.reason)
  }

  const hasPartialFailure = Boolean(
    partialErrors.owned || partialErrors.wishlist,
  )

  if (hasPartialFailure && owned.length === 0 && wishlist.length === 0) {
    const messages = [partialErrors.owned, partialErrors.wishlist]
      .filter(Boolean)
      .join(' / ')
    throw new Error(messages || '옷장 데이터를 불러오지 못했습니다.')
  }

  return {
    garments: mapClothesListToGarments([...owned, ...wishlist]),
    partialErrors: hasPartialFailure ? partialErrors : undefined,
  }
}

export async function fetchClothesDetail(clothesId: number): Promise<Garment> {
  const data = await unwrap(
    api.get<BeApiResponse<ClothesResponse>>(
      `/api/v1/clothes/${clothesId}`,
    ),
  )
  return mapClothesToGarment(data)
}

export async function updateClothes(
  clothesId: number,
  garment: Garment,
  edits: {
    name?: string
    brandName?: string
    productCode?: string
    category?: string
    itemType?: string
    gender?: ClothesGender
    primaryColor?: string
    secondaryColors?: string[]
    styles?: string[]
    size?: string
    season?: string
    imageUrl?: string
  },
): Promise<Garment> {
  const payload = buildClothesUpdatePayload(garment, edits)
  const updated = await unwrap(
    api.patch<BeApiResponse<ClothesResponse>>(
      `/api/v1/clothes/${clothesId}`,
      payload,
    ),
  )
  return mapClothesToGarment(updated)
}

export async function deleteClothes(clothesId: number): Promise<void> {
  await api.delete(`/api/v1/clothes/${clothesId}`)
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
      `/api/v1/clothes/${clothesId}/convert-to-owned`,
      payload,
    ),
  )
  return mapClothesToGarment(updated)
}

/** BE `WishlistClothesCreateRequest` — POST /api/users/{userId}/wishlist-clothes */
export async function createWishlistClothes(
  userId: number,
  payload: WishlistClothesCreatePayload,
): Promise<Garment> {
  const data = await unwrap(
    api.post<BeApiResponse<ClothesResponse>>(
      wishlistClothesPath(userId),
      payload,
    ),
  )
  return mapClothesToGarment(data)
}

export async function connectWishlistClothes(
  userId: number,
  clothesId: number,
): Promise<Garment> {
  const data = await unwrap(
    api.post<BeApiResponse<ClothesResponse>>(
      `${wishlistClothesPath(userId)}/${clothesId}`,
    ),
  )
  return mapClothesToGarment(data)
}
