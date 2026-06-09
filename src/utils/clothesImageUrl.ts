/** BE ClothesResponse / 추천 DTO 공통 — 표시용 이미지 (내 사진 우선, 없으면 상품 이미지) */
export type ClothesImageFields = {
  userImageUrl?: string | null
  imageUrl?: string | null
}

export function resolveClothesDisplayImageUrl(
  item: ClothesImageFields | null | undefined,
): string | undefined {
  const userImage = item?.userImageUrl?.trim()
  if (userImage) return userImage
  const image = item?.imageUrl?.trim()
  return image || undefined
}
