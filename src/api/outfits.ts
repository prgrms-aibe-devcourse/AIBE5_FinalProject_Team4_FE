import api from '@/api'
import type { BeApiResponse } from '@/types/be'

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

export interface OutfitSaveItem {
  clothesId: number
  itemRole: string
  layerOrder: number
}

export interface OutfitSavePayload {
  title: string
  description: string
  thumbnailUrl: string
  situation: string
  season: string
  favorite?: boolean
  items: OutfitSaveItem[]
}

export interface OutfitItemResponse {
  outfitItemId: number
  itemRole: string
  layerOrder: number | null
  clothes: import('@/types/be').ClothesResponse
}

export interface OutfitResponse {
  outfitId: number
  outfitBookId: number
  title: string
  description: string
  thumbnailUrl: string | null
  situation: string | null
  season: string | null
  favorite: boolean
  items: OutfitItemResponse[]
  createdAt: string
  updatedAt: string
}

export interface OutfitBookResponse {
  outfitBookId: number
  userId: number
  outfitCount: number
  outfits: OutfitResponse[]
  createdAt: string | null
  updatedAt: string | null
}

/** GET /api/v1/outfit-books — 코디북 + 코디 목록 한번에 조회 */
export async function fetchMyOutfitBook(): Promise<OutfitBookResponse> {
  return unwrap(api.get<BeApiResponse<OutfitBookResponse>>('/api/v1/outfit-books'))
}

/** POST /api/v1/outfit-books/{bookId}/outfits */
export async function createOutfit(bookId: number, payload: OutfitSavePayload): Promise<void> {
  await unwrap(api.post(`/api/v1/outfit-books/${bookId}/outfits`, payload))
}

/** GET /api/v1/outfit-books/{bookId}/outfits */
export async function fetchOutfits(bookId: number): Promise<OutfitResponse[]> {
  return unwrap(api.get<BeApiResponse<OutfitResponse[]>>(`/api/v1/outfit-books/${bookId}/outfits`))
}

/** PATCH /api/v1/outfit-books/{bookId}/outfits/{outfitId} */
export async function updateOutfit(bookId: number, outfitId: number, payload: Partial<OutfitSavePayload>): Promise<void> {
  await unwrap(api.patch(`/api/v1/outfit-books/${bookId}/outfits/${outfitId}`, payload))
}

/** DELETE /api/v1/outfit-books/{bookId}/outfits/{outfitId} */
export async function deleteOutfit(bookId: number, outfitId: number): Promise<void> {
  await unwrap(api.delete(`/api/v1/outfit-books/${bookId}/outfits/${outfitId}`))
}
