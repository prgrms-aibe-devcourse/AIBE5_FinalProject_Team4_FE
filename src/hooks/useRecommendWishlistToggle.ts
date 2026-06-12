import { useCallback, useEffect, useState } from 'react'
import {
  addExistingClothesToWishlist,
  convertWishlistToOwned,
  deleteClothes,
} from '@/api/wardrobe'
import type { Garment } from '@/types'
import { extractApiErrorMessage } from '@/utils/apiError'
import {
  DUPLICATE_WISHLIST_MESSAGE,
  normalizeDuplicateRegisterError,
} from '@/utils/garmentDuplicateCheck'
import type { RecommendCardItem } from '@/utils/recommendationMapper'
import {
  findOwnedGarmentForRecommendation,
  findWishlistGarmentForRecommendation,
  recommendationWishlistProductCode,
} from '@/utils/recommendWishlistPayload'

interface UseRecommendWishlistToggleOptions {
  userId: number | null
  existingGarments: Garment[]
  onWishlistChanged?: () => void
}

export function useRecommendWishlistToggle({
  userId,
  existingGarments,
  onWishlistChanged,
}: UseRecommendWishlistToggleOptions) {
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [submittingClothesId, setSubmittingClothesId] = useState<number | null>(null)
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map())

  useEffect(() => {
    setOverrides(new Map())
  }, [existingGarments])

  useEffect(() => {
    if (!toastMessage) return
    const timer = window.setTimeout(() => setToastMessage(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  const isWishlisted = useCallback(
    (clothesId: number | null | undefined) => {
      if (clothesId == null) return false
      if (overrides.has(clothesId)) return overrides.get(clothesId)!
      return findWishlistGarmentForRecommendation(clothesId, existingGarments) != null
    },
    [existingGarments, overrides],
  )

  const isSubmitting = useCallback(
    (clothesId: number | null | undefined) =>
      clothesId != null && submittingClothesId === clothesId,
    [submittingClothesId],
  )

  const toggleWishlist = useCallback(
    async (item: RecommendCardItem) => {
      const clothesId = item.clothesId
      if (clothesId == null || item.isAnchor) return

      if (userId == null) {
        setToastMessage('로그인 후 위시리스트에 추가할 수 있어요')
        return
      }
      if (submittingClothesId != null) return

      const currentlyWishlisted = isWishlisted(clothesId)
      setSubmittingClothesId(clothesId)

      try {
        if (currentlyWishlisted) {
          const linked = findWishlistGarmentForRecommendation(
            clothesId,
            existingGarments,
          )
          await deleteClothes(Number(linked?.id ?? clothesId))
          setOverrides((prev) => new Map(prev).set(clothesId, false))
          setToastMessage('위시리스트에서 제거했어요')
        } else {
          await addExistingClothesToWishlist(userId, clothesId)
          setOverrides((prev) => new Map(prev).set(clothesId, true))
          setToastMessage('위시리스트에 추가했어요')
        }
        onWishlistChanged?.()
      } catch (error) {
        const message =
          normalizeDuplicateRegisterError(extractApiErrorMessage(error)) ??
          extractApiErrorMessage(error)
        setToastMessage(message)
        if (!currentlyWishlisted && message === DUPLICATE_WISHLIST_MESSAGE) {
          setOverrides((prev) => new Map(prev).set(clothesId, true))
        }
      } finally {
        setSubmittingClothesId(null)
      }
    },
    [existingGarments, isWishlisted, onWishlistChanged, submittingClothesId, userId],
  )

  const addPurchasedToCloset = useCallback(
    async (item: RecommendCardItem): Promise<boolean> => {
      const clothesId = item.clothesId
      if (clothesId == null || item.isAnchor) return false

      if (userId == null) {
        setToastMessage('로그인 후 이용할 수 있어요')
        return false
      }
      if (submittingClothesId != null) return false

      if (findOwnedGarmentForRecommendation(clothesId, existingGarments)) {
        setToastMessage('이미 보유 옷장에 있어요')
        return true
      }

      setSubmittingClothesId(clothesId)

      try {
        let garment = findWishlistGarmentForRecommendation(
          clothesId,
          existingGarments,
        )

        if (!garment) {
          garment = await addExistingClothesToWishlist(userId, clothesId)
        }

        const imageUrl =
          garment.userImageUrl ?? garment.thumbnailUrl ?? item.imageUrl
        if (!imageUrl?.startsWith('http')) {
          setToastMessage('옷장 추가에 필요한 이미지 URL이 없습니다.')
          return false
        }

        await convertWishlistToOwned(Number(garment.id), {
          productCode:
            garment.productCode ?? recommendationWishlistProductCode(clothesId),
          size: garment.size ?? 'FREE',
          userImageUrl: imageUrl,
          isVerified: false,
        })

        setOverrides((prev) => new Map(prev).set(clothesId, false))
        setToastMessage('보유 옷장에 추가했어요')
        onWishlistChanged?.()
        return true
      } catch (error) {
        setToastMessage(
          extractApiErrorMessage(error, '옷장 추가에 실패했습니다.'),
        )
        return false
      } finally {
        setSubmittingClothesId(null)
      }
    },
    [existingGarments, onWishlistChanged, submittingClothesId, userId],
  )

  return {
    toastMessage,
    isWishlisted,
    isSubmitting,
    toggleWishlist,
    addPurchasedToCloset,
  }
}
