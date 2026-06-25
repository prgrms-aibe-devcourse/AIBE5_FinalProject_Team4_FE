import { useCallback, useEffect, useState } from 'react'
import { createOutfit, fetchMyOutfitBook } from '@/api/outfits'
import { useToast } from '@/components/Toast'
import type { FeedOutfit, FeedPost } from '@/types/feed'
import { extractApiErrorMessage } from '@/utils/apiError'
import {
  buildOutfitSavePayloadFromFeedOutfit,
  collectSavedOutfitKeys,
  feedOutfitItemKey,
} from '@/utils/feedOutfitSave'

interface UseFeedOutfitBookSaveOptions {
  onOutfitBookChanged?: () => void
}

export function useFeedOutfitBookSave({ onOutfitBookChanged }: UseFeedOutfitBookSaveOptions = {}) {
  const { showToast } = useToast()
  const [bookId, setBookId] = useState<number | null>(null)
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set())
  const [submittingPostId, setSubmittingPostId] = useState<number | null>(null)

  const refreshSavedState = useCallback(async () => {
    try {
      const book = await fetchMyOutfitBook()
      setBookId(book.outfitBookId)
      setSavedKeys(collectSavedOutfitKeys(book.outfits ?? []))
    } catch {
      setBookId(null)
      setSavedKeys(new Set())
    }
  }, [])

  useEffect(() => {
    void refreshSavedState()
  }, [refreshSavedState])

  const isOutfitInBook = useCallback(
    (outfit: FeedOutfit | null | undefined) => {
      if (!outfit || outfit.items.length === 0) return false
      return savedKeys.has(feedOutfitItemKey(outfit))
    },
    [savedKeys],
  )

  const saveOutfitFromPost = useCallback(
    async (post: FeedPost) => {
      if (submittingPostId != null) return
      if (post.mine) return
      if (!post.outfit || post.outfit.items.length === 0) {
        showToast('error', '연결된 코디가 없어 저장할 수 없습니다.')
        return
      }

      const key = feedOutfitItemKey(post.outfit)
      if (savedKeys.has(key)) {
        showToast('info', '이미 코디북에 저장된 코디예요.')
        return
      }

      let targetBookId = bookId
      if (targetBookId == null) {
        try {
          const book = await fetchMyOutfitBook()
          targetBookId = book.outfitBookId
          setBookId(targetBookId)
        } catch {
          showToast('error', '코디북 정보를 불러오지 못했습니다.')
          return
        }
      }

      setSubmittingPostId(post.feedPostId)
      try {
        await createOutfit(
          targetBookId,
          buildOutfitSavePayloadFromFeedOutfit(post.outfit, post.caption),
        )
        setSavedKeys((prev) => new Set(prev).add(key))
        onOutfitBookChanged?.()
        showToast('success', '코디북에 저장했어요.')
      } catch (err) {
        showToast('error', extractApiErrorMessage(err, '코디북 저장에 실패했습니다.'))
      } finally {
        setSubmittingPostId(null)
      }
    },
    [bookId, onOutfitBookChanged, savedKeys, showToast, submittingPostId],
  )

  return {
    isOutfitInBook,
    saveOutfitFromPost,
    outfitSaveSubmittingPostId: submittingPostId,
    refreshSavedState,
  }
}
