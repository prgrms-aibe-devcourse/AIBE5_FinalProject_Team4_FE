// 공통 API 응답 타입
export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export interface UserProfile {
  nickname: string;
  gender: "Male" | "Female" | "None";
  styles: string[]; // Casual, Minimal, Street, Amekaji, Gorpcore
  onboarded: boolean;
  birthday: string; // 사용자 연령에 따른 추천에 활용
}

export interface Recommendation {
  id: string;
  name: string;
  category: "Top" | "Bottom" | "Outer" | "Shoes";
  color: string;
  matchRate: number;
  imageName: string;
  styleTag: string;
  price: string;
}

export interface AnatomicalFitGuide {
  shoulderPrecision: number;
  chestTightness: number;
  muscularStressLevel: string;
  skeletonDrapeFactor: string;
  recommendedBodyType: string;
}

/** BE ClothesResponse 기반 수정/전환 API용 메타 (clothesMapper가 채움) */
export interface GarmentBeMeta {
  categoryCode: string;
  itemTypeCode: string;
  primaryColorCode: string;
  secondaryColorCodes: string[];
  styleCodes: string[];
  brandName: string;
  imageUrl: string;
  isVerified: boolean;
  /** CLOTHES.clothes_info_source */
  clothesInfoSource?: string;
  /** WARDROBE_CLOTHES.registration_source */
  registrationSource?: string | null;
}

export interface Garment {
  id: string;
  name: string;
  category: "Top" | "Bottom" | "Outer" | "Shoes";
  color: string;
  style: string;
  fitType: string;
  fabricMaterial: string;
  thumbnailUrl?: string; // custom base64 or styling draft
  isFavorite: boolean;
  isWishlist: boolean;
  anatomicalFit?: AnatomicalFitGuide;
  /** BE productCode — 보유 전환·수정 시 사용 */
  productCode?: string;
  size?: string;
  season?: string;
  userImageUrl?: string;
  be?: GarmentBeMeta;
}

