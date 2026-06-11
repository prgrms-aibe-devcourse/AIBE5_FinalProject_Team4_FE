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
  role: 'TOP' | 'BOTTOM' | 'OUTER' | string
  clothesId?: number | null
  name?: string | null
  brand?: string | null
  imageUrl?: string | null
  category?: string | null
}

export interface OutfitSavePayload {
  outfitId?: number | null
  title?: string | null
  items: OutfitSaveItem[]
  metadata?: {
    weatherLabel?: string | null
    totalScore?: number | null
  }
}

/** POST /api/v1/outfit-books/{bookId}/outfits */
export async function createOutfit(bookId: number, payload: OutfitSavePayload): Promise<void> {
  await unwrap(api.post(`/api/v1/outfit-books/${bookId}/outfits`, payload))
}
