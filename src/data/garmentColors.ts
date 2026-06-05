/** BE `CLOTHING_COLORS` / docs/domain/catalog.md 기준 */
export type GarmentColorCode =
  | 'PINK'
  | 'RED'
  | 'ORANGE'
  | 'BEIGE'
  | 'YELLOW'
  | 'GREEN'
  | 'LIGHT_BLUE'
  | 'NAVY'
  | 'PURPLE'
  | 'BROWN'
  | 'GRAY'
  | 'WHITE'
  | 'BLACK'

export type GarmentColor = {
  code: GarmentColorCode
  name: string
  hex: string
}

export const GARMENT_COLORS: GarmentColor[] = [
  { code: 'PINK', name: '핑크', hex: '#FFB6C1' },
  { code: 'RED', name: '레드', hex: '#E53935' },
  { code: 'ORANGE', name: '오렌지', hex: '#FF9800' },
  { code: 'BEIGE', name: '베이지', hex: '#D2B48C' },
  { code: 'YELLOW', name: '옐로우', hex: '#FDD835' },
  { code: 'GREEN', name: '그린', hex: '#43A047' },
  { code: 'LIGHT_BLUE', name: '라이트블루', hex: '#81D4FA' },
  { code: 'NAVY', name: '네이비', hex: '#1F3A5F' },
  { code: 'PURPLE', name: '퍼플', hex: '#8E24AA' },
  { code: 'BROWN', name: '브라운', hex: '#795548' },
  { code: 'GRAY', name: '그레이', hex: '#9E9E9E' },
  { code: 'WHITE', name: '화이트', hex: '#FFFFFF' },
  { code: 'BLACK', name: '블랙', hex: '#212121' },
]

const COLOR_BY_CODE = Object.fromEntries(
  GARMENT_COLORS.map((c) => [c.code, c]),
) as Record<GarmentColorCode, GarmentColor>

const COLOR_BY_NAME = Object.fromEntries(
  GARMENT_COLORS.map((c) => [c.name, c]),
) as Record<string, GarmentColor>

export function isGarmentColorCode(value: string): value is GarmentColorCode {
  return value in COLOR_BY_CODE
}

export function getGarmentColor(code: string): GarmentColor | undefined {
  return isGarmentColorCode(code) ? COLOR_BY_CODE[code] : undefined
}

export function getGarmentColorLabel(code: string): string {
  return isGarmentColorCode(code) ? COLOR_BY_CODE[code].name : code
}

export function resolveGarmentColorCode(value: string | null | undefined): GarmentColorCode {
  const trimmed = (value ?? '').trim()
  if (!trimmed) return 'WHITE'
  if (isGarmentColorCode(trimmed)) return trimmed
  if (COLOR_BY_NAME[trimmed]) return COLOR_BY_NAME[trimmed].code
  const upper = trimmed.toUpperCase().replace(/\s+/g, '_')
  if (isGarmentColorCode(upper)) return upper
  return 'WHITE'
}

export function needsLightColorBorder(code: GarmentColorCode): boolean {
  return code === 'WHITE' || code === 'BEIGE' || code === 'YELLOW'
}
