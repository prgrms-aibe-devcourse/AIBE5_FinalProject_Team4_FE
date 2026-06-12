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


/** POST /api/v1/outfit-books/{bookId}/outfits */
export async function createOutfit(bookId: number, payload: OutfitSavePayload): Promise<void> {
  await unwrap(api.post(`/api/v1/outfit-books/${bookId}/outfits`, payload))
}
