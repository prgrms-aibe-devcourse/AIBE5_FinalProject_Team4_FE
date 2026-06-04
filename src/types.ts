export interface UserProfile {
  nickname: string;
  gender: "Male" | "Female" | "None";
  styles: string[]; // Casual, Minimal, Street, Amekaji, Gorpcore
  onboarded: boolean;
  birthday?: string; // 사용자 연령에 따른 추천에 활용
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
  /** BE 연동용 */
  productCode?: string;
  size?: string;
  season?: string;
  userImageUrl?: string;
  /** 수정 API 요청에 필요한 BE code 필드 */
  be?: GarmentBeMeta;
}

export interface GarmentBeMeta {
  categoryCode: string;
  itemTypeCode: string;
  primaryColorCode: string;
  secondaryColorCodes: string[];
  styleCodes: string[];
  brandName: string;
  imageUrl: string;
  isVerified: boolean;
}

