import type { ClothesGender } from '@/types/be'

// 공통 API 응답 타입
export interface ApiResponse<T> {
  data: T
  message: string
  status: number
}

export type RegionCode =
  | 'SEOUL'
  | 'BUSAN'
  | 'DAEGU'
  | 'INCHEON'
  | 'GWANGJU'
  | 'DAEJEON'
  | 'ULSAN'
  | 'SEJONG'
  | 'GYEONGGI'
  | 'GANGWON'
  | 'CHUNGBUK'
  | 'CHUNGNAM'
  | 'JEONBUK'
  | 'JEONNAM'
  | 'GYEONGBUK'
  | 'GYEONGNAM'
  | 'JEJU'


export interface UserProfile {
  email?: string;
  nickname: string;
  gender: "Male" | "Female" | "None";
  styles: string[]; // BE StyleCode 문자열 목록
  onboarded: boolean;
  birthday: string; // 사용자 연령에 따른 추천에 활용
  region?: RegionCode;
  profileImageUrl?: string;
  profileBio?: string;
  externalLinkUrl?: string;
  socialProviders?: string[];
  socialAccounts?: {
    provider: string;
    providerEmail: string;
  }[];
  guideTourCompletedHome?: boolean;
  guideTourCompletedWardrobe?: boolean;
  guideTourCompletedFeed?: boolean;
  guideTourCompletedMypage?: boolean;
  guideTourCompletedOutfitBook?: boolean;
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
  genderCode: ClothesGender;
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
