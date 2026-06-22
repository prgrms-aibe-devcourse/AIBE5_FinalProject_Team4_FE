import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchFeedPosts, toggleFeedLike, toggleFeedSave } from '@/api/feed'
import Spinner from '@/components/common/Spinner'
import FeedEmptyState from '@/components/feed/FeedEmptyState'
import FeedPostCard from '@/components/feed/FeedPostCard'
import FeedPostDetailModal from '@/components/feed/FeedPostDetailModal'
import FeedWriteModal from '@/components/feed/FeedWriteModal'
import { Plus } from '@/components/icons'
import { useToast } from '@/components/Toast'
import type { FeedPost } from '@/types/feed'
import { extractApiErrorMessage } from '@/utils/apiError'
import GuideTour from '@/components/common/GuideTour'

interface FeedTabProps {
  userId: number
  guideTourCompleted: boolean
  onGuideTourComplete: () => void
}

export default function FeedTab({ userId, guideTourCompleted, onGuideTourComplete }: FeedTabProps) {
  const { showToast } = useToast()
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [writeOpen, setWriteOpen] = useState(false)
  const [detailPostId, setDetailPostId] = useState<number | null>(null)
  const [submittingPostId, setSubmittingPostId] = useState<number | null>(null)
  const [submittingAction, setSubmittingAction] = useState<'like' | 'save' | null>(null)
  const [tourOpen, setTourOpen] = useState(!guideTourCompleted)
  const feedHeaderRef = useRef<HTMLDivElement>(null)
  const postListRef = useRef<HTMLDivElement>(null)
  const writeButtonRef = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async (nextPage: number, append: boolean) => {
    if (append) {
      setLoadingMore(true)
    } else {
      setLoading(true)
    }
    setError(null)

    try {
      const data = await fetchFeedPosts(nextPage, 20)
      const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000
      const fresh = data.content.filter((p) => new Date(p.createdAt).getTime() >= cutoff)
      setPosts((prev) => (append ? [...prev, ...fresh] : fresh))
      setPage(data.page)
      setHasNext(data.hasNext)
    } catch (loadError) {
      setError(extractApiErrorMessage(loadError, '피드 목록을 불러오지 못했습니다.'))
      if (!append) setPosts([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void loadPosts(0, false)
  }, [loadPosts, userId])

  const updatePostInList = (updated: FeedPost) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.feedPostId === updated.feedPostId ? updated : post,
      ),
    )
  }

  const handleToggleLike = async (post: FeedPost) => {
    if (submittingPostId != null) return
    // 낙관적 업데이트: API 응답 전 즉시 반영
    const nextLiked = !post.likedByMe
    updatePostInList({
      ...post,
      likedByMe: nextLiked,
      likeCount: nextLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1),
    })
    setSubmittingPostId(post.feedPostId)
    setSubmittingAction('like')
    try {
      const result = await toggleFeedLike(post.feedPostId)
      updatePostInList({ ...post, likedByMe: result.active, likeCount: result.count })
    } catch (toggleError) {
      // 실패 시 원상 복구
      updatePostInList(post)
      setError(extractApiErrorMessage(toggleError, '좋아요 처리에 실패했습니다.'))
    } finally {
      setSubmittingPostId(null)
      setSubmittingAction(null)
    }
  }

  const handleToggleSave = async (post: FeedPost) => {
    if (submittingPostId != null) return
    if (!post.outfit) {
      showToast('error', '연결된 코디가 없어 저장할 수 없습니다.')
      return
    }
    setSubmittingPostId(post.feedPostId)
    setSubmittingAction('save')
    try {
      const result = await toggleFeedSave(post.feedPostId)
      updatePostInList({
        ...post,
        savedByMe: result.active,
      })
      showToast(
        'success',
        result.active ? '코디북에 저장했어요.' : '코디북 저장을 취소했어요.',
      )
    } catch (toggleError) {
      const message = extractApiErrorMessage(toggleError, '저장 처리에 실패했습니다.')
      setError(message)
      showToast('error', message)
    } finally {
      setSubmittingPostId(null)
      setSubmittingAction(null)
    }
  }

  const handleCreated = (created: FeedPost) => {
    setPosts((prev) => [created, ...prev])
    setError(null)
  }

  const handleDeleted = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.feedPostId !== postId))
  }

  return (
    <div className="relative -mx-5 pb-24 animate-fade-in text-left">
      <div ref={feedHeaderRef} className="border-b border-slate-100 bg-white px-5 py-3">
        <h3 className="text-center text-base font-semibold text-slate-900">룩피드</h3>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner />
        </div>
      ) : error && posts.length === 0 ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-6 text-center">
          <p className="text-sm font-bold text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => void loadPosts(0, false)}
            className="mt-3 text-xs font-black text-[#1E3A8A] underline cursor-pointer"
          >
            다시 시도
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="px-5">
          <FeedEmptyState onWriteClick={() => setWriteOpen(true)} />
        </div>
      ) : (
        <div ref={postListRef} className="flex flex-col">
          {posts.map((post) => (
            <FeedPostCard
              key={post.feedPostId}
              post={post}
              onOpen={() => setDetailPostId(post.feedPostId)}
              onToggleLike={() => void handleToggleLike(post)}
              onToggleSave={() => void handleToggleSave(post)}
              likeSubmitting={
                submittingPostId === post.feedPostId && submittingAction === 'like'
              }
              saveSubmitting={
                submittingPostId === post.feedPostId && submittingAction === 'save'
              }
            />
          ))}

          {hasNext ? (
            <button
              type="button"
              onClick={() => void loadPosts(page + 1, true)}
              disabled={loadingMore}
              className="mx-5 my-4 w-[calc(100%-2.5rem)] rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              {loadingMore ? '불러오는 중…' : '더 보기'}
            </button>
          ) : null}
        </div>
      )}

      {error && posts.length > 0 ? (
        <p className="text-xs font-bold text-red-600">{error}</p>
      ) : null}

      <FeedWriteModal
        open={writeOpen}
        userId={userId}
        onClose={() => setWriteOpen(false)}
        onCreated={handleCreated}
      />

      <FeedPostDetailModal
        open={detailPostId != null}
        postId={detailPostId}
        userId={userId}
        onClose={() => setDetailPostId(null)}
        onPostUpdated={updatePostInList}
        onPostDeleted={handleDeleted}
      />

      {!writeOpen ? (
        <div ref={writeButtonRef} className="fixed bottom-20 left-0 right-0 z-20 flex justify-center px-5 pointer-events-none">
          <button
            type="button"
            onClick={() => setWriteOpen(true)}
            className="pointer-events-auto flex items-center gap-2 h-12 px-6 rounded-2xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-[#BBF7D0] shadow-lg font-bold text-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>코디 업로드</span>
          </button>
        </div>
      ) : null}
      {tourOpen && (
        <GuideTour
          steps={[
            { targetRef: feedHeaderRef, message: "다른 사람들의 실제 코디에서 스타일 힌트를 얻어보세요" },
            { targetRef: postListRef, message: "좋아요·저장으로 마음에 드는 코디를 바로 기록할 수 있어요" },
            { targetRef: writeButtonRef, message: "내 코디를 업로드하면 팔로워와 공유할 수 있어요" },
          ]}
          onComplete={() => {
            setTourOpen(false)
            onGuideTourComplete()
          }}
        />
      )}
      {!tourOpen && !writeOpen && (
          <button
              type="button"
              className="fixed right-5 bottom-20 z-40 w-11 h-11 rounded-full bg-white border border-slate-200 text-[#1E3A8A] shadow-lg flex items-center justify-center transition active:scale-90"
              onClick={() => setTourOpen(true)}
          >?</button>
      )}
    </div>
  )
}
