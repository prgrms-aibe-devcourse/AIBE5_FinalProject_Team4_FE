/** BE `external_source` / docs/domain/catalog.md 기준 */
export const EXTERNAL_SOURCES = [
  { code: 'MUSINSA', label: '무신사', logoDomain: 'www.musinsa.com' },
  { code: 'NAVER_SHOPPING', label: '네이버쇼핑', logoDomain: 'shopping.naver.com' },
  { code: 'COUPANG', label: '쿠팡', logoDomain: 'www.coupang.com' },
  { code: 'ABLY', label: '에이블리', logoDomain: 'm.a-bly.com' },
  { code: 'ZIGZAG', label: '지그재그', logoDomain: 'zigzag.kr' },
  { code: 'TWENTYNINE_CM', label: '29CM', logoDomain: 'www.29cm.co.kr' },
  { code: 'WCONCEPT', label: 'W컨셉', logoDomain: 'www.wconcept.co.kr' },
  { code: 'BRANDI', label: '브랜디', logoDomain: 'www.brandi.co.kr' },
  { code: 'UNIQLO', label: '유니클로', logoDomain: 'www.uniqlo.com' },
  { code: 'SPAO', label: '스파오', logoDomain: 'www.spao.com' },
  { code: 'EIGHT_SECONDS', label: '에잇세컨즈', logoDomain: 'www.8seconds.co.kr' },
  { code: 'HM', label: 'H&M', logoDomain: 'www2.hm.com' },
  { code: 'CUSTOM', label: '직접입력' },
] as const

export type ExternalSourceCode = (typeof EXTERNAL_SOURCES)[number]['code']

const EXTERNAL_SOURCE_CODES = new Set<string>(EXTERNAL_SOURCES.map((s) => s.code))

const EXTERNAL_SOURCE_ALIASES: Record<string, ExternalSourceCode> = {
  MUSINSA: 'MUSINSA',
  무신사: 'MUSINSA',
  NAVER: 'NAVER_SHOPPING',
  NAVER_SHOPPING: 'NAVER_SHOPPING',
  네이버: 'NAVER_SHOPPING',
  네이버쇼핑: 'NAVER_SHOPPING',
  COUPANG: 'COUPANG',
  쿠팡: 'COUPANG',
  ABLY: 'ABLY',
  에이블리: 'ABLY',
  ZIGZAG: 'ZIGZAG',
  지그재그: 'ZIGZAG',
  TWENTYNINE_CM: 'TWENTYNINE_CM',
  '29CM': 'TWENTYNINE_CM',
  WCONCEPT: 'WCONCEPT',
  BRANDI: 'BRANDI',
  UNIQLO: 'UNIQLO',
  SPAO: 'SPAO',
  EIGHT_SECONDS: 'EIGHT_SECONDS',
  HM: 'HM',
  CUSTOM: 'CUSTOM',
}

export function isExternalSourceCode(value: string): value is ExternalSourceCode {
  return EXTERNAL_SOURCE_CODES.has(value.trim().toUpperCase())
}

export function resolveExternalSourceCode(
  raw: string | null | undefined,
): ExternalSourceCode | '' {
  if (!raw?.trim()) return ''
  const key = raw.trim()
  const upper = key.toUpperCase()
  if (isExternalSourceCode(upper)) return upper
  return EXTERNAL_SOURCE_ALIASES[key] ?? EXTERNAL_SOURCE_ALIASES[upper] ?? ''
}

export function getExternalSourceLogoUrl(code: ExternalSourceCode): string | null {
  const source = EXTERNAL_SOURCES.find((s) => s.code === code)
  if (!source || !('logoDomain' in source) || !source.logoDomain) return null
  return `https://www.google.com/s2/favicons?domain=${source.logoDomain}&sz=64`
}
