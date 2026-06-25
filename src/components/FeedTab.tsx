import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchFeedPosts, toggleFeedLike } from '@/api/feed'
import { useToast } from '@/components/Toast'
import Spinner from '@/components/common/Spinner'
import FeedEmptyState from '@/components/feed/FeedEmptyState'
import FeedPostCard from '@/components/feed/FeedPostCard'
import FeedPostDetailModal from '@/components/feed/FeedPostDetailModal'
import FeedWriteModal from '@/components/feed/FeedWriteModal'
import { Plus } from '@/components/icons'
import type { FeedPost } from '@/types/feed'
import type { Garment } from '@/types'
import { extractApiErrorMessage } from '@/utils/apiError'
import { buildFeedPostShareUrl, consumeFeedPostIdFromUrl } from '@/utils/feedShare'
import GuideTour from '@/components/common/GuideTour'
import { useFeedOutfitBookSave } from '@/hooks/useFeedOutfitBookSave'

interface FeedTabProps {
  userId: number
  wardrobeGarments?: Garment[]
  onWishlistChanged?: () => void
  guideTourCompleted: boolean
  onGuideTourComplete: () => void
  onViewProfile?: (userId: number) => void
  onOutfitBookChanged?: () => void
}

export default function FeedTab({
  userId,
  wardrobeGarments = [],
  onWishlistChanged,
  guideTourCompleted,
  onGuideTourComplete,
  onViewProfile,
  onOutfitBookChanged,
}: FeedTabProps) {
  const { showToast } = useToast()
  const {
    isOutfitInBook,
    saveOutfitFromPost,
    outfitSaveSubmittingPostId,
  } = useFeedOutfitBookSave({ onOutfitBookChanged })

  const handleShare = async (postId: number) => {
    try {
      await navigator.clipboard.writeText(buildFeedPostShareUrl(postId))
      showToast('success', '링크 복사됨')
    } catch {
      showToast('error', '링크 복사 실패')
    }
  }
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [hasNext, setHasNext] = useState(false)
  const [writeOpen, setWriteOpen] = useState(false)
  const [detailPostId, setDetailPostId] = useState<number | null>(null)
  const [submittingPostId, setSubmittingPostId] = useState<number | null>(null)
  const [submittingAction, setSubmittingAction] = useState<'like' | null>(null)
  // posts가 로드된 후에 투어를 시작 — 로드 전엔 firstPostRef가 null이라 투어가 안 보임
  const [tourOpen, setTourOpen] = useState(false)
  const tourStartedRef = useRef(false)
  const feedHeaderRef = useRef<HTMLDivElement>(null)
  const postListRef = useRef<HTMLDivElement>(null)
  const writeButtonRef = useRef<HTMLButtonElement>(null)
  const firstPostRef = useRef<HTMLElement>(null)
  const firstPostTitleRef = useRef<HTMLDivElement>(null)
  const firstPostActionRef = useRef<HTMLDivElement>(null)
  const activeCommentComposersRef = useRef(0)
  const [hideUploadForComments, setHideUploadForComments] = useState(false)

  const handleCommentComposerActiveChange = useCallback((active: boolean) => {
    activeCommentComposersRef.current += active ? 1 : -1
    activeCommentComposersRef.current = Math.max(0, activeCommentComposersRef.current)
    setHideUploadForComments(activeCommentComposersRef.current > 0)
  }, [])

  const showFeedUploadButton = !writeOpen && !hideUploadForComments && detailPostId == null

  const detailListPost = useMemo(
    () => (detailPostId != null ? posts.find((p) => p.feedPostId === detailPostId) ?? null : null),
    [posts, detailPostId],
  )

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

  // 로딩 완료 후 한 번만 투어 시작
  // - 게시글 있음: firstPostRef가 DOM에 붙은 뒤이므로 정상 동작
  // - 게시글 없음: writeButtonRef만으로 구성된 단축 투어
  useEffect(() => {
    if (guideTourCompleted || tourStartedRef.current) return
    if (loading) return
    tourStartedRef.current = true
    setTourOpen(true)
  }, [loading, guideTourCompleted])

  useEffect(() => {
    const postId = consumeFeedPostIdFromUrl()
    if (postId != null) {
      setDetailPostId(postId)
    }
  }, [])

  const updatePostInList = useCallback((updated: FeedPost) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.feedPostId === updated.feedPostId ? updated : post,
      ),
    )
  }, [])

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
      showToast('success', result.active ? '좋아요 눌렀어요' : '좋아요 취소했어요')
    } catch (toggleError) {
      // 실패 시 원상 복구
      updatePostInList(post)
      const message = extractApiErrorMessage(toggleError, '좋아요 처리에 실패했습니다.')
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
          {posts.map((post, index) => (
            <FeedPostCard
              key={post.feedPostId}
              post={post}
              userId={userId}
              onOpen={() => setDetailPostId(post.feedPostId)}
              onToggleLike={() => void handleToggleLike(post)}
              onSaveOutfit={() => void saveOutfitFromPost(post)}
              onShare={() => void handleShare(post.feedPostId)}
              onCommentCountChange={(commentCount) =>
                updatePostInList({ ...post, commentCount })
              }
              onCommentComposerActiveChange={handleCommentComposerActiveChange}
              onViewProfile={onViewProfile}
              likeSubmitting={
                submittingPostId === post.feedPostId && submittingAction === 'like'
              }
              outfitSaved={isOutfitInBook(post.outfit)}
              outfitSaveSubmitting={outfitSaveSubmittingPostId === post.feedPostId}
              {...(index === 0 && {
                containerRef: firstPostRef,
                titleRef: firstPostTitleRef,
                actionRef: firstPostActionRef,
              })}
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
        wardrobeGarments={wardrobeGarments}
        onWishlistChanged={onWishlistChanged}
        onClose={() => setDetailPostId(null)}
        onPostUpdated={updatePostInList}
        onPostDeleted={handleDeleted}
        onViewProfile={onViewProfile}
        listPost={detailListPost}
        isOutfitInBook={isOutfitInBook}
        onSaveOutfit={(post) => void saveOutfitFromPost(post)}
        outfitSaveSubmitting={
          detailPostId != null && outfitSaveSubmittingPostId === detailPostId
        }
      />

      {showFeedUploadButton ? (
        <div className="fixed bottom-20 left-0 right-0 z-20 flex justify-center px-5 pointer-events-none">
          <button
              ref={writeButtonRef}
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
          steps={
            posts.length > 0
              ? [
                  { targetRef: firstPostTitleRef, message: "다른 사람들의 실제 코디에서 스타일 힌트를 얻어보세요" },
                  { targetRef: firstPostActionRef, message: "좋아요로 마음에 드는 코디를 바로 기록할 수 있어요" },
                  { targetRef: writeButtonRef, message: "내 코디를 업로드하면 팔로워와 공유할 수 있어요" },
                ]
              : [
                  { targetRef: writeButtonRef, message: "아직 공유된 코디가 없어요. 내 코디를 첫 번째로 업로드해보세요!" },
                ]
          }
          onComplete={() => {
            setTourOpen(false)
            onGuideTourComplete()
          }}
        />
      )}
      {!tourOpen && showFeedUploadButton && (
          <button
              type="button"
              className="fixed right-5 bottom-20 z-40 w-11 h-11 rounded-full bg-white border border-slate-200 text-[#1E3A8A] shadow-lg flex items-center justify-center transition active:scale-90"
              onClick={() => setTourOpen(true)}
          >?</button>
      )}
    </div>
  )
}
