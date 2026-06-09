import type { ClothesGender, ClothesResponse, OwnershipStatus } from '@/types/be'

/** BE 사진 기반 등록 DTO (garment-registration.md 기준) */
export interface PhotoUploadResponse {
  photoId: number
  /** BE PhotoUploadResponse.previewUrl */
  previewUrl?: string | null
  imageUrl?: string | null
  originalFilename?: string | null
  contentType?: string | null
}

export type PhotoAnalysisStatus =
  | 'UPLOADED'
  | 'ANALYZING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SAVED'
  | string

export interface PhotoGarmentDraftResponse {
  photoId?: number | null
  name?: string | null
  brandName?: string | null
  productCode?: string | null
  category?: string | null
  itemType?: string | null
  gender?: ClothesGender | string | null
  primaryColor?: string | null
  secondaryColors?: string[] | null
  styles?: string[] | null
  size?: string | null
  season?: string | null
  favorite?: boolean | null
  isVerified?: boolean | null
  analysisStatus?: PhotoAnalysisStatus | null
  failureMessage?: string | null
  aiFailed?: boolean | null
  imageUrl?: string | null
  previewUrl?: string | null
}

export interface PhotoGarmentSaveRequest {
  name: string
  brandName: string
  productCode: string
  category: string
  itemType: string
  gender: ClothesGender
  primaryColor: string
  secondaryColors: string[]
  styles: string[]
  size?: string
  season?: string
  favorite?: boolean
  isVerified?: boolean
}

/** BE `PhotoClothesRegistrationResponse` — POST .../photos/{photoId}/save 의 data 본문 */
export interface PhotoClothesRegistrationResponse {
  clothes: ClothesResponse
  wardrobeClothesId: number
  wardrobeId?: number | null
  userImageUrl?: string | null
  favorite?: boolean | null
  size?: string | null
  season?: string | null
  ownershipStatus?: OwnershipStatus | null
  /** WARDROBE_CLOTHES.registration_source */
  registrationSource?: string | null
  photoId?: number | null
}
