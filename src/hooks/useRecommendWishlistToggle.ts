import { useCallback, useEffect, useState } from 'react'
import { useToast } from '@/components/Toast'
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
import {
  postRecommendationFeedback,
  type RecommendationFeedbackType,
} from '@/api/recommendations'

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
  const { showToast } = useToast() || { showToast: () => {} }
  const [submittingClothesId, setSubmittingClothesId] = useState<number | null>(null)
  const [feedbackSubmittingId, setFeedbackSubmittingId] = useState<number | null>(null)
  const [overrides, setOverrides] = useState<Map<number, boolean>>(new Map())

  useEffect(() => {
    setOverrides(new Map())
  }, [existingGarments])

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

  const triggerToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      showToast(type === 'info' ? 'info' : type === 'error' ? 'error' : 'success', message)
    },
    [showToast],
  )

  const toggleWishlist = useCallback(
    async (item: RecommendCardItem) => {
      const clothesId = item.clothesId
      if (clothesId == null || item.isAnchor) return

      if (userId == null) {
        triggerToast('로그인 후 위시리스트에 추가할 수 있어요', 'error')
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
          triggerToast('위시리스트에서 제거했어요')
        } else {
          await addExistingClothesToWishlist(userId, clothesId)
          setOverrides((prev) => new Map(prev).set(clothesId, true))
          triggerToast('위시리스트에 추가했어요')
        }
        onWishlistChanged?.()
      } catch (error) {
        const message =
          normalizeDuplicateRegisterError(extractApiErrorMessage(error)) ??
          extractApiErrorMessage(error)
        triggerToast(message, 'error')
        if (!currentlyWishlisted && message === DUPLICATE_WISHLIST_MESSAGE) {
          setOverrides((prev) => new Map(prev).set(clothesId, true))
        }
      } finally {
        setSubmittingClothesId(null)
      }
    },
    [existingGarments, onWishlistChanged, submittingClothesId, triggerToast, userId],
  )

  const isFeedbackSubmitting = useCallback(
    (clothesId: number | null | undefined) =>
      clothesId != null && feedbackSubmittingId === clothesId,
    [feedbackSubmittingId],
  )

  const handleFeedback = useCallback(
    async (item: RecommendCardItem, type: RecommendationFeedbackType) => {
      const clothesId = item.clothesId
      if (clothesId == null || item.isAnchor) return

      if (userId == null) {
        triggerToast('로그인이 필요한 작업입니다.', 'error')
        return
      }
      if (feedbackSubmittingId != null) return

      setFeedbackSubmittingId(clothesId)

      try {
        await postRecommendationFeedback(userId, {
          feedbackType: type,
          clothesId: clothesId,
        })

        if (type === 'DISLIKE') {
          triggerToast('해당 추천을 싫어요 처리했습니다.')
        } else if (type === 'EXCLUDE') {
          triggerToast('해당 상품을 추천에서 제외했습니다.')
        }

        onWishlistChanged?.()
      } catch (error) {
        triggerToast(
          extractApiErrorMessage(error, '피드백 처리에 실패했습니다.'),
          'error',
        )
      } finally {
        setFeedbackSubmittingId(null)
      }
    },
    [userId, feedbackSubmittingId, triggerToast, onWishlistChanged],
  )

  const addPurchasedToCloset = useCallback(
    async (item: RecommendCardItem): Promise<boolean> => {
      const clothesId = item.clothesId
      if (clothesId == null || item.isAnchor) return false

      if (userId == null) {
        triggerToast('로그인 후 이용할 수 있어요', 'error')
        return false
      }
      if (submittingClothesId != null) return false

      if (findOwnedGarmentForRecommendation(clothesId, existingGarments)) {
        triggerToast('이미 보유 옷장에 있어요', 'info')
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
          triggerToast('옷장 추가에 필요한 이미지 URL이 없습니다.', 'error')
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
        triggerToast('보유 옷장에 추가했어요')
        onWishlistChanged?.()
        return true
      } catch (error) {
        triggerToast(
          extractApiErrorMessage(error, '옷장 추가에 실패했습니다.'),
          'error',
        )
        return false
      } finally {
        setSubmittingClothesId(null)
      }
    },
    [existingGarments, onWishlistChanged, submittingClothesId, triggerToast, userId],
  )

  return {
    isWishlisted,
    isSubmitting,
    isFeedbackSubmitting,
    toggleWishlist,
    handleFeedback,
    addPurchasedToCloset,
  }
}
