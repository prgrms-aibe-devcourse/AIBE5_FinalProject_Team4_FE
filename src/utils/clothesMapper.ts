import type { ClothesResponse } from '@/types/be'
import type { Garment } from '@/types'

const CATEGORY_TO_UI: Record<string, Garment['category']> = {
  TOP: 'Top',
  BOTTOM: 'Bottom',
  OUTER: 'Outer',
  SHOES: 'Shoes',
}

export function mapClothesToGarment(item: ClothesResponse): Garment {
  const primaryStyle = item.styles[0]
  return {
    id: String(item.clothesId),
    name: item.name,
    category: CATEGORY_TO_UI[item.category] ?? 'Top',
    color: item.primaryColorDisplay?.name ?? item.primaryColor ?? '',
    style: primaryStyle?.name ?? primaryStyle?.code ?? '',
    fitType: item.itemType,
    fabricMaterial: item.brandName || '—',
    thumbnailUrl: (item.userImageUrl ?? item.imageUrl) || undefined,
    isFavorite: item.isFavorite ?? false,
    isWishlist: item.ownershipStatus === 'WISHLIST',
    productCode: item.productCode,
    size: item.size ?? undefined,
    userImageUrl: item.userImageUrl ?? undefined,
  }
}

export function mapClothesListToGarments(items: ClothesResponse[]): Garment[] {
  return items.map(mapClothesToGarment)
}
