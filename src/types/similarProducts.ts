import type {
  BeApiResponse,
  ClothesGender,
  ClothesResponse,
} from '@/types/be'

export interface NaverShoppingProduct {
  title: string
  link: string
  image: string
  lowestPrice: number
  highestPrice: number | null
  mallName: string
  productId: string
  productType: string
  brand: string
  maker: string
  category1: string
  category2: string
  category3: string
  category4: string
}

export interface SimilarProductRecommendation {
  baseClothes: ClothesResponse
  query: string
  products: NaverShoppingProduct[]
}

export type SimilarProductRecommendationResponse =
  BeApiResponse<SimilarProductRecommendation>

export interface SimilarProductSaveForm {
  category: 'TOP' | 'BOTTOM' | 'OUTER' | 'SHOES'
  itemType: string
  gender: ClothesGender
  primaryColor: string
  styles: string[]
  size: string
  season: string
}
