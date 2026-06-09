import type { ClothesGender } from '@/types/be'

export interface RecommendationColorInfo {
  code: string
  label: string
  hex: string
}

/** GET .../recommendations — anchor (보유 옷) */
export interface RecommendationAnchorItem {
  clothesId: number
  name: string
  imageUrl: string
  userImageUrl: string | null
  category: string
  itemType: string
  primaryColor: string
  primaryColorDisplay: RecommendationColorInfo | null
}

/** GET .../recommendations — recommendations 맵 값 (외부 쇼핑 상품 후보) */
export interface RecommendedClothesItem {
  clothesId: number
  wardrobeClothesId: number | null
  name: string
  imageUrl: string
  userImageUrl: string | null
  category: string
  itemType: string
  primaryColor: string
  primaryColorDisplay: RecommendationColorInfo | null
  secondaryColors: string[]
  styleCodes: string[]
  season: string | null
  gender?: ClothesGender
  compatibilityScore: number
}

export interface ClothesRecommendationResponse {
  anchor: RecommendationAnchorItem
  recommendations: Record<string, RecommendedClothesItem[]>
}
