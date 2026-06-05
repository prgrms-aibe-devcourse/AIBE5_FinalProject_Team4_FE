import type { Garment } from '@/types/index'

export type UiCategory = Garment['category']

export const CATEGORY_ITEM_TYPES: Record<
  UiCategory,
  { code: string; label: string }[]
> = {
  Top: [
    { code: 'LONG_SLEEVE', label: '긴팔' },
    { code: 'SHORT_SLEEVE', label: '반팔' },
    { code: 'SHIRT', label: '셔츠' },
    { code: 'HOODIE', label: '후드' },
    { code: 'SWEAT', label: '맨투맨' },
    { code: 'COLLAR_TEE', label: '카라 티' },
    { code: 'SLEEVELESS', label: '민소매' },
    { code: 'KNIT', label: '니트' },
  ],
  Bottom: [
    { code: 'DENIM', label: '데님' },
    { code: 'TRAINING', label: '트레이닝' },
    { code: 'COTTON', label: '코튼 팬츠' },
    { code: 'SLACKS', label: '슬랙스' },
    { code: 'SHORTS', label: '반바지' },
    { code: 'CARGO', label: '카고' },
    { code: 'SKIRT', label: '스커트' },
  ],
  Outer: [
    { code: 'WINDBREAKER', label: '윈드브레이커' },
    { code: 'HOOD_ZIPUP', label: '후드 집업' },
    { code: 'TRAINING_JACKET', label: '트레이닝 자켓' },
    { code: 'BLOUSON', label: '블루종' },
    { code: 'PADDING', label: '패딩' },
    { code: 'LIGHT_PADDING', label: '경량 패딩' },
    { code: 'DENIM_JACKET', label: '데님 자켓' },
    { code: 'BLAZER', label: '블레이저' },
    { code: 'COACH_JACKET', label: '코치 자켓' },
    { code: 'VEST', label: '베스트' },
    { code: 'SINGLE_COAT', label: '싱글 코트' },
    { code: 'DOUBLE_COAT', label: '더블 코트' },
  ],
  Shoes: [
    { code: 'SNEAKERS', label: '스니커즈' },
    { code: 'SPORTS_SHOES', label: '운동화' },
    { code: 'LOAFER', label: '로퍼' },
    { code: 'DERBY', label: '더비' },
    { code: 'BOOTS', label: '부츠' },
    { code: 'SANDALS_SLIPPERS', label: '샌들·슬리퍼' },
    { code: 'FLAT', label: '플랫' },
    { code: 'HEEL', label: '힐' },
  ],
}

export function getItemTypeLabel(
  category: UiCategory,
  itemTypeCode: string,
): string {
  return (
    CATEGORY_ITEM_TYPES[category].find((t) => t.code === itemTypeCode)?.label ??
    itemTypeCode
  )
}
