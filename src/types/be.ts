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

export type OwnershipStatus = 'OWNED' | 'WISHLIST'

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
  primaryColor: string | null
  primaryColorDisplay: ColorDisplay | null
  secondaryColors: unknown[]
  styles: ClothesStyleTag[]
  ownershipStatus: OwnershipStatus
  infoSource: string
  externalSource: string | null
  externalProductId: string | null
  externalProductUrl: string | null
  isVerified: boolean | null
  isFavorite: boolean | null
  size: string | null
  season: string | null
  userImageUrl: string | null
  createdAt: string
  updatedAt: string
}

export interface MockTokenData {
  userId: number
  accessToken: string
  headerValue: string
}
