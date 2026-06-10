import { useCallback, useEffect, useState } from 'react'
import {
  addExistingClothesToWishlist,
  deleteClothes,
} from '@/api/wardrobe'
import type { Garment } from '@/types'
import { extractApiErrorMessage } from '@/utils/apiError'
import {
  DUPLICATE_WISHLIST_MESSAGE,
  normalizeDuplicateRegisterError,
} from '@/utils/garmentDuplicateCheck'

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
      return existingGarments.some(
        (garment) => garment.isWishlist && garment.id === String(clothesId),
      )
    },
    [existingGarments, overrides],
  )

  const isSubmitting = useCallback(
    (clothesId: number | null | undefined) =>
      clothesId != null && submittingClothesId === clothesId,
    [submittingClothesId],
  )

  const toggleWishlist = useCallback(
    async (clothesId: number) => {
      if (userId == null) {
        setToastMessage('로그인 후 위시리스트에 추가할 수 있어요')
        return
      }
      if (submittingClothesId != null) return

      const currentlyWishlisted = isWishlisted(clothesId)
      setSubmittingClothesId(clothesId)

      try {
        if (currentlyWishlisted) {
          await deleteClothes(clothesId)
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
    [isWishlisted, onWishlistChanged, submittingClothesId, userId],
  )

  return {
    toastMessage,
    isWishlisted,
    isSubmitting,
    toggleWishlist,
  }
}
