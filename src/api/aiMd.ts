import api from '@/api'
import type { BeApiResponse } from '@/types/be'
import type {
  AiMd,
  AiMdId,
  AiMdOutfitRecommendation,
  AiMdOutfitRecommendationData,
  AiMdOutfitSaveRequest,
  AiMdProductRecommendationData,
} from '@/types/aiMd'

const AI_REQUEST_TIMEOUT = 120_000
const SKIP_REDIRECT_HEADER = { 'X-Skip-Global-Error-Redirect': 'true' }

async function unwrap<T>(
  promise: Promise<{ data: BeApiResponse<T | null> }>,
): Promise<T> {
  const { data: body } = await promise
  if (!body.success || body.data == null) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

export function fetchAiMds(userId: number): Promise<AiMd[]> {
  return unwrap(
    api.get<BeApiResponse<AiMd[]>>(
      `/api/v1/users/${userId}/recommendations/ai-md/personas`,
    ),
  )
}

export function fetchAiMdOutfits(
  userId: number,
  mdId: AiMdId,
): Promise<AiMdOutfitRecommendationData> {
  return unwrap(
    api.post<BeApiResponse<AiMdOutfitRecommendationData>>(
      `/api/v1/users/${userId}/recommendations/ai-md/${mdId}/outfits`,
      undefined,
      { timeout: AI_REQUEST_TIMEOUT, headers: SKIP_REDIRECT_HEADER },
    ),
  )
}

export function fetchAiMdProducts(
  userId: number,
  mdId: AiMdId,
): Promise<AiMdProductRecommendationData> {
  return unwrap(
    api.get<BeApiResponse<AiMdProductRecommendationData>>(
      `/api/v1/users/${userId}/recommendations/ai-md/${mdId}/products`,
      { timeout: AI_REQUEST_TIMEOUT, headers: SKIP_REDIRECT_HEADER },
    ),
  )
}

export function toAiMdOutfitSaveRequest(
  outfit: AiMdOutfitRecommendation,
): AiMdOutfitSaveRequest {
  const wardrobeClothesIds = outfit.ownedItems.map((item) => {
    if (item.wardrobeClothesId == null) {
      throw new Error('보유 옷 ID가 없는 코디는 저장할 수 없습니다.')
    }
    return item.wardrobeClothesId
  })

  return {
    title: outfit.title,
    description: outfit.description,
    situation: outfit.situation,
    season: outfit.season,
    reason: outfit.reason,
    stylingTip: outfit.stylingTip,
    wardrobeClothesIds,
    externalProducts: outfit.externalProducts,
  }
}

export function saveAiMdOutfit(
  userId: number,
  mdId: AiMdId,
  request: AiMdOutfitSaveRequest,
): Promise<unknown> {
  return unwrap(
    api.post<BeApiResponse<unknown>>(
      `/api/v1/users/${userId}/recommendations/ai-md/${mdId}/outfits/save`,
      request,
      { timeout: AI_REQUEST_TIMEOUT, headers: SKIP_REDIRECT_HEADER },
    ),
  )
}
