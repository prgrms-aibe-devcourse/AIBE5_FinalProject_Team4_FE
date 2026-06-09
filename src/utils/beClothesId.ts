/** BE `ClothesResponse.clothesId`와 FE `Garment.id`(String) 정합 */
export function parseBeClothesId(id: string): number | null {
  if (!/^\d+$/.test(id)) return null
  const parsed = Number(id)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null
  return parsed
}

export function isBeClothesId(id: string): boolean {
  return parseBeClothesId(id) != null
}
