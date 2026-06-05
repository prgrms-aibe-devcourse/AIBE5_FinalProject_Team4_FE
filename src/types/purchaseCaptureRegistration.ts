import type { ClothesResponse, OwnershipStatus } from '@/types/be'

export interface PurchaseCaptureUploadResponse {
  captureId: number
  previewUrl?: string | null
  imageUrl?: string | null
  originalFilename?: string | null
  contentType?: string | null
}

export type PurchaseCaptureAnalysisStatus =
  | 'UPLOADED'
  | 'ANALYZING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SAVED'
  | string

/** BE가 복수 상품을 감지하면 `items` 배열로 내려줄 수 있음 */
export interface PurchaseCaptureItemDraft {
  itemIndex?: number | null
  draftItemId?: string | null
  name?: string | null
  brandName?: string | null
  productCode?: string | null
  category?: string | null
  itemType?: string | null
  primaryColor?: string | null
  secondaryColors?: string[] | null
  styles?: string[] | null
  size?: string | null
  season?: string | null
  optionText?: string | null
  suggestedExternalSource?: string | null
  externalSource?: string | null
  /** 쇼핑몰 상품 썸네일 이미지 URL (BE가 추출할 수 있는 경우) */
  imageUrl?: string | null
  thumbnailUrl?: string | null
}

export interface PurchaseCaptureDraftResponse {
  captureId?: number | null
  name?: string | null
  brandName?: string | null
  productCode?: string | null
  category?: string | null
  itemType?: string | null
  primaryColor?: string | null
  secondaryColors?: string[] | null
  styles?: string[] | null
  size?: string | null
  season?: string | null
  optionText?: string | null
  suggestedExternalSource?: string | null
  externalSource?: string | null
  items?: PurchaseCaptureItemDraft[] | null
  detectedItems?: PurchaseCaptureItemDraft[] | null
  itemCount?: number | null
  savedItemIndexes?: number[] | null
  analysisStatus?: PurchaseCaptureAnalysisStatus | null
  failureMessage?: string | null
  aiFailed?: boolean | null
  imageUrl?: string | null
  previewUrl?: string | null
}

export interface PurchaseCaptureSaveRequest {
  /** 복수 상품 캡처에서 저장 대상 행 식별 (BE 지원 시) */
  itemIndex?: number
  name: string
  brandName: string
  productCode: string
  category: string
  itemType: string
  primaryColor: string
  secondaryColors: string[]
  styles: string[]
  externalSource?: string
  size?: string
  season?: string
  favorite?: boolean
  isVerified?: boolean
}

export interface PurchaseClothesRegistrationResponse {
  clothes: ClothesResponse
  wardrobeClothesId: number
  wardrobeId?: number | null
  userImageUrl?: string | null
  favorite?: boolean | null
  size?: string | null
  season?: string | null
  ownershipStatus?: OwnershipStatus | null
  captureId?: number | null
  itemIndex?: number | null
}
