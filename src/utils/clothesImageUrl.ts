/** BE ClothesResponse / 추천 DTO 공통 — 표시용 이미지 (내 사진 우선, 없으면 상품 이미지) */
export type ClothesImageFields = {
  userImageUrl?: string | null
  imageUrl?: string | null
}

export type GarmentImageSource = {
  userImageUrl?: string | null
  thumbnailUrl?: string | null
  be?: { imageUrl?: string | null }
}

export function resolveClothesDisplayImageUrl(
  item: ClothesImageFields | null | undefined,
): string | undefined {
  const userImage = item?.userImageUrl?.trim()
  if (userImage) return userImage
  const image = item?.imageUrl?.trim()
  return image || undefined
}

export function resolveGarmentImageUrl(garment: GarmentImageSource): string {
  return (
    resolveClothesDisplayImageUrl({
      userImageUrl: garment.userImageUrl,
      imageUrl: garment.be?.imageUrl ?? garment.thumbnailUrl,
    }) ??
    garment.thumbnailUrl?.trim() ??
    ''
  )
}

export function isUsableClothesImageUrl(url: string | undefined | null): url is string {
  if (!url?.trim()) return false
  const trimmed = url.trim()
  return (
    trimmed.startsWith('http://')
    || trimmed.startsWith('https://')
    || trimmed.startsWith('/api/')
  )
}

/** convert-to-owned 등 BE 저장용 — 상대 경로는 절대 URL로 변환 */
export function normalizeClothesImageUrlForApi(url: string): string {
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  if (trimmed.startsWith('/')) {
    const base = import.meta.env.DEV && !import.meta.env.VITE_API_BASE_URL
      ? window.location.origin
      : (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
    return `${base}${trimmed}`
  }
  return trimmed
}
