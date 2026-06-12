import type { ClothesResponse } from '@/types/be'
import type { NaverShoppingProduct } from '@/types/similarProducts'

export type AiMdId =
  | 'taesik'
  | 'junsik'
  | 'sesoon'
  | 'gahyun'
  | 'seongmi'

export interface AiMd {
  id: AiMdId
  name: string
  gender: 'MALE' | 'FEMALE'
  styleCodes: string[]
  styleNames: string[]
  speechStyle: string
  description: string
}

export interface AiMdOutfitRecommendation {
  title: string
  description: string
  situation: string
  season: string
  reason: string
  stylingTip: string
  ownedItems: ClothesResponse[]
  externalProducts: NaverShoppingProduct[]
}

export interface AiMdOutfitRecommendationData {
  md: AiMd
  outfits: AiMdOutfitRecommendation[]
}

export interface AiMdOutfitSaveRequest {
  title: string
  description: string
  situation?: string | null
  season?: string | null
  reason?: string | null
  stylingTip?: string | null
  wardrobeClothesIds: number[]
  externalProducts: NaverShoppingProduct[]
}

export interface AiMdProductRecommendation {
  product: NaverShoppingProduct
  reason: string
}

export interface AiMdProductRecommendationData {
  md: AiMd
  query: string
  products: AiMdProductRecommendation[]
}
