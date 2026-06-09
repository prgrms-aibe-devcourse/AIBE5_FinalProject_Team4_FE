import { resolveClothesGender, type ClothesGender } from '@/data/garmentGender'
import type { UserProfile } from '@/types'

export type UserGender = UserProfile['gender']

export type { ClothesGender }

const FEMALE_KEYWORDS = [
  '여성',
  '여자',
  'woman',
  'women',
  'womens',
  'ladies',
  'lady',
  'girl',
  'girls',
  '우먼',
  '레이디',
  '원피스',
  '블라우스',
  '스커트',
  '미디스커트',
  '플레어스커트',
  '치마',
  '자라',
  'zara',
] as const

const MALE_KEYWORDS = [
  '남성',
  '남자',
  '남성용',
  '남성용품',
] as const

/** woman/women/garment 등에서 man·men 오탐을 막기 위한 영문 남성 키워드 */
const MALE_BOUNDARY_KEYWORDS = ['men', 'mens', 'man', 'boy', 'boys'] as const

function normalizeForMatch(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '')
}

function containsSubstringKeyword(text: string, keywords: readonly string[]): boolean {
  const normalized = normalizeForMatch(text)
  if (!normalized) return false
  return keywords.some((keyword) => normalized.includes(normalizeForMatch(keyword)))
}

/** woman/women 등을 제거한 뒤 man·men 매칭 (woman → man 오탐 방지) */
function stripFemaleEnglishCompounds(normalized: string): string {
  return normalized
    .replace(/womens/g, '')
    .replace(/women/g, '')
    .replace(/woman/g, '')
    .replace(/ladies/g, '')
    .replace(/lady/g, '')
    .replace(/girls/g, '')
    .replace(/girl/g, '')
}

function isAlphaChar(char: string): boolean {
  return char >= 'a' && char <= 'z'
}

function containsBoundaryKeyword(normalized: string, keywords: readonly string[]): boolean {
  return keywords.some((keyword) => {
    const token = normalizeForMatch(keyword)
    let fromIndex = 0
    while (fromIndex <= normalized.length - token.length) {
      const idx = normalized.indexOf(token, fromIndex)
      if (idx === -1) return false
      const before = idx === 0 ? '' : normalized[idx - 1]
      const after = normalized[idx + token.length] ?? ''
      if ((!before || !isAlphaChar(before)) && (!after || !isAlphaChar(after))) {
        return true
      }
      fromIndex = idx + 1
    }
    return false
  })
}

function detectFemaleSignal(name: string): boolean {
  return containsSubstringKeyword(name, FEMALE_KEYWORDS)
}

function detectMaleSignal(name: string): boolean {
  if (containsSubstringKeyword(name, MALE_KEYWORDS)) return true
  const normalized = stripFemaleEnglishCompounds(normalizeForMatch(name))
  if (!normalized) return false
  return containsBoundaryKeyword(normalized, MALE_BOUNDARY_KEYWORDS)
}

/** 상품명에 성별 키워드가 사용자 성별과 맞는지 확인. None이면 필터하지 않음. */
export function matchesUserGender(name: string, gender: UserGender): boolean {
  if (gender === 'None') return true

  const hasFemale = detectFemaleSignal(name)
  const hasMale = detectMaleSignal(name)

  if (hasFemale && hasMale) return true

  if (gender === 'Male') {
    return !hasFemale || hasMale
  }

  if (gender === 'Female') {
    return !hasMale || hasFemale
  }

  return true
}

/** CLOTHES.gender(enum) 기준 필터. 값이 없으면 상품명 휴리스틱으로 fallback. */
export function matchesClothesGender(
  clothesGender: ClothesGender | string | null | undefined,
  userGender: UserGender,
  fallbackName?: string,
): boolean {
  if (userGender === 'None') return true

  const resolved = resolveClothesGender(clothesGender ?? undefined)
  if (resolved === 'UNISEX') return true
  if (userGender === 'Male') return resolved === 'MALE'
  if (userGender === 'Female') return resolved === 'FEMALE'

  if (fallbackName) return matchesUserGender(fallbackName, userGender)
  return true
}
