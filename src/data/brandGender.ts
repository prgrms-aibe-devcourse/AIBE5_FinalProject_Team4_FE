import { resolveClothesGender, type ClothesGender } from '@/data/garmentGender'

const FEMALE_BRAND_KEYS = new Set([
  'OLIVEDESOLIVE',
  'OLIVEDEOLIVE',
  '올리브데올리브',
  'JJJIGOTT',
  'JJ JIGOTT',
  'JJ지고트',
  'JIGOTT',
  'BCBG',
  'BCBGMAXAZRIA',
  'BCBG MAXAZRIA',
  'PLASTICISLAND',
  'PLASTIC ISLAND',
  '플라스틱아일랜드',
  '플라스틱 아일랜드',
  'SOUP',
  '숲',
  '제시뉴욕',
  'JESSI NEW YORK',
  'JESSINEWYORK',
  'JESSI NY',
  'ROEM',
  '로엠',
  'TRIANA',
  '트리아나',
  'MINIMUM',
  '미니멈',
  'EGOIST',
  '에고이스트',
  'EAR PAPILLONNER',
  'EARPAPILLONNER',
  '마담엘레강스',
  'MADAME ELEGANCE',
  'MADAMEELEGANCE',
  '몰리올리',
  'MOLLY OLLIE',
  'MOLLYOLLIE',
  'LIST',
  '리스트',
  'SHEMISS',
  'SHES MISS',
  "SHE'S MISS",
  '쉬즈미스',
])

function normalizeBrandKey(value: string): string {
  return value.trim().toUpperCase().replace(/[\s.'\-&]/g, '')
}

export function isFemaleBrand(brandName?: string | null): boolean {
  const trimmed = (brandName ?? '').trim()
  if (!trimmed) return false
  return (
    FEMALE_BRAND_KEYS.has(trimmed)
    || FEMALE_BRAND_KEYS.has(trimmed.toUpperCase())
    || FEMALE_BRAND_KEYS.has(normalizeBrandKey(trimmed))
  )
}

export function resolveClothesGenderWithBrand(
  gender: string | null | undefined,
  brandName?: string | null,
  fallback: ClothesGender = 'UNISEX',
): ClothesGender {
  if (isFemaleBrand(brandName)) {
    return 'FEMALE'
  }
  return resolveClothesGender(gender, fallback)
}
