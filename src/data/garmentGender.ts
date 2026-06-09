/** CLOTHES.target_gender ENUM */
export type ClothesGender = 'MALE' | 'FEMALE' | 'UNISEX'

export const CLOTHES_GENDER_OPTIONS = [
  { code: 'MALE' as const, label: '남성' },
  { code: 'FEMALE' as const, label: '여성' },
  { code: 'UNISEX' as const, label: '유니섹스' },
] as const

export function isClothesGender(value: string | null | undefined): value is ClothesGender {
  return value === 'MALE' || value === 'FEMALE' || value === 'UNISEX'
}

export function resolveClothesGender(
  value: string | null | undefined,
  fallback: ClothesGender = 'UNISEX',
): ClothesGender {
  return isClothesGender(value) ? value : fallback
}

export function getClothesGenderLabel(code: ClothesGender | string | null | undefined): string {
  const resolved = resolveClothesGender(code)
  return CLOTHES_GENDER_OPTIONS.find((option) => option.code === resolved)?.label ?? '유니섹스'
}
