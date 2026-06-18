/** BE `STYLES` / docs/domain/catalog.md 기준 */
export type GarmentStyleCode =
  | 'CASUAL'
  | 'STREET'
  | 'MINIMAL'
  | 'SPORTY'
  | 'CLASSIC'
  | 'CHIC'
  | 'WORKWEAR'
  | 'CITYBOY'
  | 'GORPCORE'
  | 'RETRO'

export type GarmentStyle = {
  code: GarmentStyleCode
  label: string
  description?: string
}

export const GARMENT_STYLES: GarmentStyle[] = [
  { code: 'CASUAL', label: '캐주얼' },
  { code: 'STREET', label: '스트릿' },
  { code: 'MINIMAL', label: '미니멀' },
  { code: 'SPORTY', label: '스포티' },
  { code: 'CLASSIC', label: '클래식' },
  { code: 'CHIC', label: '시크' },
  { code: 'WORKWEAR', label: '워크웨어' },
  { code: 'CITYBOY', label: '시티보이' },
  { code: 'GORPCORE', label: '고프코어' },
  { code: 'RETRO', label: '레트로' },
]

const STYLE_BY_CODE = Object.fromEntries(
  GARMENT_STYLES.map((s) => [s.code, s]),
) as Record<GarmentStyleCode, GarmentStyle>

const STYLE_ALIASES: Record<string, GarmentStyleCode> = {
  CASUAL: 'CASUAL',
  Casual: 'CASUAL',
  캐주얼: 'CASUAL',
  STREET: 'STREET',
  Street: 'STREET',
  스트릿: 'STREET',
  MINIMAL: 'MINIMAL',
  Minimal: 'MINIMAL',
  미니멀: 'MINIMAL',
  SPORTY: 'SPORTY',
  Sporty: 'SPORTY',
  스포티: 'SPORTY',
  CLASSIC: 'CLASSIC',
  Classic: 'CLASSIC',
  클래식: 'CLASSIC',
  CHIC: 'CHIC',
  Chic: 'CHIC',
  시크: 'CHIC',
  WORKWEAR: 'WORKWEAR',
  Workwear: 'WORKWEAR',
  워크웨어: 'WORKWEAR',
  AMEKAJI: 'RETRO',
  Amekaji: 'RETRO',
  아메카지: 'RETRO',
  CITYBOY: 'CITYBOY',
  Cityboy: 'CITYBOY',
  시티보이: 'CITYBOY',
  GORPCORE: 'GORPCORE',
  Gorpcore: 'GORPCORE',
  고프코어: 'GORPCORE',
  RETRO: 'RETRO',
  Retro: 'RETRO',
  레트로: 'RETRO',
}

export function isGarmentStyleCode(value: string): value is GarmentStyleCode {
  return value in STYLE_BY_CODE
}

export function getGarmentStyleLabel(code: string): string {
  return isGarmentStyleCode(code) ? STYLE_BY_CODE[code].label : code
}

export function resolveGarmentStyleCode(
  value: string | null | undefined,
): GarmentStyleCode {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return 'MINIMAL'
  if (isGarmentStyleCode(trimmed)) return trimmed
  if (STYLE_ALIASES[trimmed]) return STYLE_ALIASES[trimmed]
  const upper = trimmed.toUpperCase()
  if (isGarmentStyleCode(upper)) return upper
  if (STYLE_ALIASES[upper]) return STYLE_ALIASES[upper]
  return 'MINIMAL'
}
