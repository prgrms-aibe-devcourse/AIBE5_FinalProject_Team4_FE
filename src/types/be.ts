/** Spring Boot ApiResponse<T> */
export interface BeApiResponse<T> {
  success: boolean
  data: T
  message: string | null
}

export interface ClothesStyleTag {
  styleId: number
  code: string
  name: string
  styleRole: string
  sortOrder: number
}

export interface ColorDisplay {
  code: string
  name: string
  hex: string
}

export interface SecondaryColorResponse {
  code: string
  colorDisplay: ColorDisplay | null
  sortOrder: number
}

export type OwnershipStatus = 'OWNED' | 'WISHLIST'

/** CLOTHES.clothes_info_source ENUM */
export type ClothesInfoSource = 'PHOTO' | 'PURCHASE_HISTORY' | 'EXTERNAL_SHOPPING'

/** CLOTHES.gender ENUM */
export type ClothesGender = 'MALE' | 'FEMALE' | 'UNISEX'

export interface ClothesResponse {
  clothesId: number
  wardrobeClothesId: number | null
  wardrobeId: number | null
  userId: number | null
  name: string
  brandName: string
  productCode: string
  imageUrl: string
  category: string
  itemType: string
  gender?: ClothesGender
  primaryColor: string | null
  primaryColorDisplay: ColorDisplay | null
  secondaryColors: SecondaryColorResponse[]
  styles: ClothesStyleTag[]
  /** WARDROBE_CLOTHES 조인 시에만 존재 — 단독 CLOTHES 조회 시 null */
  ownershipStatus: OwnershipStatus | null
  /** CLOTHES.clothes_info_source (구 infoSource) */
  clothesInfoSource: ClothesInfoSource | string
  /** WARDROBE_CLOTHES.registration_source — 옷장 등록 방식 */
  registrationSource?: string | null
  externalSource: string | null
  externalProductId: string | null
  externalProductUrl: string | null
  isVerified: boolean | null
  isFavorite: boolean | null
  size: string | null
  season: string | null
  /** WARDROBE_CLOTHES.user_image_url — 사용자가 직접 촬영한 이미지 */
  userImageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface MockTokenData {
  userId: number
  accessToken: string
  headerValue: string
}

/** GET /api/v1/wardrobes/users/{userId}/statistics (WARD-002) */
export interface WardrobeItemTypeCount {
  itemType: string
  itemTypeLabel: string
  category: string | null
  count: number
}

export interface WardrobeUserStylePayload {
  styleId: number
  styleCode: string
  styleName: string
  weightedScore: number
  wardrobeWeight: number
}

export interface WardrobeStatisticsResponse {
  userId: number
  wardrobeId: number
  totalOwnedCount: number
  itemTypes: WardrobeItemTypeCount[]
  userStylePayloads: WardrobeUserStylePayload[]
}

/**
 * 구매내역 캡처 등록(REG-002, BE #77) 타입은 `src/types/purchaseCaptureRegistration.ts`에 정의합니다.
 * - PurchaseCaptureDraftResponse: analyze/draft/skip 응답 (`items`, `pendingItemCount`, `captureCompleted`)
 * - PurchaseCaptureSaveRequest: save 요청 (`itemIndex?`, `imageUrl?`)
 * - PurchaseCaptureRegistrationResponse: save 응답
 */
export type {
  PurchaseCaptureAnalysisStatus,
  PurchaseCaptureDraftResponse,
  PurchaseCaptureItemDraft,
  PurchaseCaptureItemStatus,
  PurchaseCaptureRegistrationResponse,
  PurchaseCaptureSaveRequest,
  PurchaseCaptureUploadResponse,
} from '@/types/purchaseCaptureRegistration'
