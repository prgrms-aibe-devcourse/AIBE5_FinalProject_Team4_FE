export interface UserProfile {
  nickname: string;
  gender: "Male" | "Female" | "None";
  styles: string[]; // Casual, Minimal, Street, Amekaji, Gorpcore
  onboarded: boolean;
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
}

