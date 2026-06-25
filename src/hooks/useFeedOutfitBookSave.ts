import { useCallback, useState } from 'react'
import { toggleFeedOutfitSave } from '@/api/feed'
import { useToast } from '@/components/Toast'
import type { FeedPost } from '@/types/feed'
import { extractApiErrorMessage } from '@/utils/apiError'

interface UseFeedOutfitBookSaveOptions {
  onOutfitBookChanged?: () => void
  onPostUpdated?: (post: FeedPost) => void
}

export function useFeedOutfitBookSave({
  onOutfitBookChanged,
  onPostUpdated,
}: UseFeedOutfitBookSaveOptions = {}) {
  const { showToast } = useToast()
  const [submittingPostId, setSubmittingPostId] = useState<number | null>(null)

  const saveOutfitFromPost = useCallback(
    async (post: FeedPost) => {
      if (submittingPostId != null) return
      if (post.mine) return
      if (!post.outfit || post.outfit.items.length === 0) {
        showToast('error', '연결된 코디가 없어 저장할 수 없습니다.')
        return
      }

      const prevPost = post
      const nextSaved = !post.savedByMe
      onPostUpdated?.({ ...post, savedByMe: nextSaved })

      setSubmittingPostId(post.feedPostId)
      try {
        const result = await toggleFeedOutfitSave(post.feedPostId)
        onPostUpdated?.({ ...prevPost, savedByMe: result.active })
        onOutfitBookChanged?.()
        showToast(
          'success',
          result.active ? '코디북에 저장했어요.' : '코디북 저장을 취소했어요.',
        )
      } catch (err) {
        onPostUpdated?.(prevPost)
        showToast('error', extractApiErrorMessage(err, '코디북 저장에 실패했습니다.'))
      } finally {
        setSubmittingPostId(null)
      }
    },
    [onOutfitBookChanged, onPostUpdated, showToast, submittingPostId],
  )

  return {
    saveOutfitFromPost,
    outfitSaveSubmittingPostId: submittingPostId,
  }
}
