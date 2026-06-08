import type { ClothesInfoSource, ClothesResponse, OwnershipStatus } from '@/types/be'

export interface PurchaseCaptureUploadResponse {
  captureId: number
  imageUrl: string | null
  originalFilename: string | null
  contentType: string | null
}

/** BE `AiAnalysisStatus` */
export type PurchaseCaptureAnalysisStatus =
  | 'UPLOADED'
  | 'ANALYZING'
  | 'SUCCESS'
  | 'FAILED'
  | 'SAVED'

/** BE `PurchaseCaptureItemStatus` */
export type PurchaseCaptureItemStatus = 'PENDING' | 'SAVED' | 'SKIPPED'

export interface PurchaseCaptureItemDraft {
  itemIndex: number
  status: PurchaseCaptureItemStatus
  name: string | null
  brandName: string | null
  category: string | null
  itemType: string | null
  primaryColor: string | null
  secondaryColors: string[]
  styles: string[]
  optionText: string | null
  suggestedExternalSource: string | null
  imageUrl: string | null
}

/** analyze / draft / skip 응답 */
export interface PurchaseCaptureDraftResponse {
  captureId: number
  analysisStatus: PurchaseCaptureAnalysisStatus
  previewUrl: string | null
  failureMessage: string | null
  aiFailed: boolean | null
  name: string | null
  brandName: string | null
  category: string | null
  itemType: string | null
  primaryColor: string | null
  secondaryColors: string[]
  styles: string[]
  optionText: string | null
  suggestedExternalSource: string | null
  items: PurchaseCaptureItemDraft[]
  pendingItemCount: number
  captureCompleted: boolean
}

export interface PurchaseCaptureSaveRequest {
  name: string
  brandName: string
  productCode: string
  category: string
  itemType: string
  primaryColor: string
  secondaryColors: string[]
  styles: string[]
  externalSource: string
  size: string
  season?: string
  favorite: boolean
  isVerified: boolean
  /** 생략 시 BE가 0으로 처리 */
  itemIndex?: number
  /** 다중 상품일 때 상품별 미리보기 URL */
  imageUrl?: string
}

/** save 응답 — BE `PurchaseCaptureRegistrationResponse` */
export interface PurchaseCaptureRegistrationResponse {
  wardrobeClothesId: number
  clothesId: number
  captureId: number
  itemIndex: number
  userImageUrl: string | null
  ownershipStatus: OwnershipStatus
  clothesInfoSource: ClothesInfoSource
  externalSource: string
  size: string
  season: string | null
  favorite: boolean
  pendingItemCount: number
  captureCompleted: boolean
  clothes: ClothesResponse
}

/** @deprecated PurchaseCaptureRegistrationResponse 사용 */
export type PurchaseClothesRegistrationResponse = PurchaseCaptureRegistrationResponse
