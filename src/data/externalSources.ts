/** BE `external_source` / docs/domain/catalog.md 기준 */
export const EXTERNAL_SOURCES = [
  { code: 'MUSINSA', label: '무신사' },
  { code: 'NAVER_SHOPPING', label: '네이버쇼핑' },
  { code: 'COUPANG', label: '쿠팡' },
  { code: 'ABLY', label: '에이블리' },
  { code: 'ZIGZAG', label: '지그재그' },
  { code: 'TWENTYNINE_CM', label: '29CM' },
  { code: 'WCONCEPT', label: 'W컨셉' },
  { code: 'BRANDI', label: '브랜디' },
  { code: 'UNIQLO', label: '유니클로' },
  { code: 'SPAO', label: '스파오' },
  { code: 'EIGHT_SECONDS', label: '에잇세컨즈' },
  { code: 'HM', label: 'H&M' },
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
