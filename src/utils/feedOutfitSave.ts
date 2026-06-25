import type { OutfitResponse } from '@/api/outfits'
import type { OutfitSavePayload } from '@/api/outfits'
import type { FeedOutfit } from '@/types/feed'
import { resolveClothesDisplayImageUrl } from '@/utils/clothesImageUrl'

/** 코디북에 동일 구성(옷 ID 집합)이 이미 있는지 비교할 때 사용 */
export function feedOutfitItemKey(outfit: FeedOutfit): string {
  return [...outfit.items]
    .map((item) => item.clothes.clothesId)
    .sort((a, b) => a - b)
    .join('-')
}

export function collectSavedOutfitKeys(outfits: OutfitResponse[]): Set<string> {
  const keys = new Set<string>()
  for (const outfit of outfits) {
    const clothesIds = (outfit.items ?? [])
      .map((item) => item.clothes?.clothesId)
      .filter((id): id is number => id != null)
    if (clothesIds.length === 0) continue
    keys.add(
      [...clothesIds]
        .sort((a, b) => a - b)
        .join('-'),
    )
  }
  return keys
}

function resolveFeedOutfitThumbnail(outfit: FeedOutfit): string {
  const fromThumb = outfit.thumbnailUrl?.trim()
  if (fromThumb) return fromThumb
  for (const item of outfit.items ?? []) {
    const url = resolveClothesDisplayImageUrl(item.clothes)
    if (url) return url
  }
  return ''
}

/** 피드에 연결된 코디를 내 코디북에 저장할 payload */
export function buildOutfitSavePayloadFromFeedOutfit(
  outfit: FeedOutfit,
  caption?: string | null,
): OutfitSavePayload {
  return {
    title: outfit.title?.trim() || '피드 코디',
    description: outfit.description?.trim() || caption?.trim() || '룩피드에서 저장한 코디',
    thumbnailUrl: resolveFeedOutfitThumbnail(outfit),
    situation: outfit.situation?.trim() || '일상',
    season: outfit.season?.trim() || 'ALL_SEASON',
    favorite: false,
    items: (outfit.items ?? []).map((item, index) => ({
      clothesId: item.clothes.clothesId,
      itemRole: item.itemRole,
      layerOrder: item.layerOrder ?? index + 1,
    })),
  }
}
