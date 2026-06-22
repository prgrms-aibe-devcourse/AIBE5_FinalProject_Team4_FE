import { useEffect, useMemo, useState } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import {
  ChevronLeft,
  ChevronRight,
  Heart,
  LayoutGrid,
  MessageSquare,
  Send,
} from '@/components/icons'
import { createFeedComment, fetchFeedComments } from '@/api/feed'
import type { FeedComment, FeedPost } from '@/types/feed'

function formatRelativeTime(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return '방금 전'
  if (minutes < 60) return `${minutes}분 전`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}시간 전`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}일 전`

  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

interface FeedPostCardProps {
  post: FeedPost
  userId: number
  onOpen: () => void
  onToggleLike: () => void
  onToggleSave: () => void
  onShare: () => void
  onCommentAdded?: () => void
  likeSubmitting?: boolean
  saveSubmitting?: boolean
}

export default function FeedPostCard({
  post,
  userId,
  onOpen,
  onToggleLike,
  onToggleSave,
  onShare,
  onCommentAdded,
  likeSubmitting = false,
  saveSubmitting = false,
}: FeedPostCardProps) {
  const [imageIndex, setImageIndex] = useState(0)
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<FeedComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsFetched, setCommentsFetched] = useState(false)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)

  const images = useMemo(
    () => [...post.images].sort((a, b) => a.sortOrder - b.sortOrder),
    [post.images],
  )

  useEffect(() => {
    setImageIndex(0)
    setCommentsOpen(false)
    setComments([])
    setCommentsFetched(false)
    setCommentDraft('')
    setReplyingToId(null)
    setReplyDraft('')
  }, [post.feedPostId])

  const handleToggleComments = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!commentsOpen && !commentsFetched) {
      setCommentsLoading(true)
      try {
        const data = await fetchFeedComments(post.feedPostId)
        setComments(data)
        setCommentsFetched(true)
      } finally {
        setCommentsLoading(false)
      }
    }
    setCommentsOpen((prev) => !prev)
  }

  const refreshComments = async () => {
    const data = await fetchFeedComments(post.feedPostId)
    setComments(data)
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = commentDraft.trim()
    if (!content || commentSubmitting) return
    setCommentSubmitting(true)
    const prev = commentDraft
    setCommentDraft('')
    try {
      await createFeedComment(post.feedPostId, { content, parentCommentId: null })
      await refreshComments()
      onCommentAdded?.()
    } catch {
      setCommentDraft(prev)
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: number) => {
    const content = replyDraft.trim()
    if (!content || replySubmitting) return
    setReplySubmitting(true)
    const prev = replyDraft
    setReplyDraft('')
    try {
      await createFeedComment(post.feedPostId, { content, parentCommentId: parentId })
      await refreshComments()
      onCommentAdded?.()
      setReplyingToId(null)
    } catch {
      setReplyDraft(prev)
    } finally {
      setReplySubmitting(false)
    }
  }

  const openReply = (id: number) => {
    setReplyingToId((prev) => (prev === id ? null : id))
    setReplyDraft('')
  }

  const replyInput = (parentId: number) =>
    replyingToId === parentId ? (
      <div className="ml-4 flex gap-2 border-l-2 border-slate-100 pl-3 pt-1">
        <input
          type="text"
          value={replyDraft}
          onChange={(e) => setReplyDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmitReply(parentId) }}
          placeholder="댓글 달기…"
          autoFocus
          className="flex-1 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
        />
        <button
          type="button"
          onClick={() => void handleSubmitReply(parentId)}
          disabled={replySubmitting || !replyDraft.trim()}
          className="shrink-0 rounded-xl bg-[#1E3A8A] px-3 py-1.5 text-xs font-black text-[#BBF7D0] cursor-pointer disabled:opacity-50"
        >
          {replySubmitting ? '…' : '등록'}
        </button>
        <button
          type="button"
          onClick={() => setReplyingToId(null)}
          className="shrink-0 rounded-xl border border-slate-200 px-2 py-1.5 text-xs font-black text-slate-500 cursor-pointer"
        >
          취소
        </button>
      </div>
    ) : null

  const currentImage = images[imageIndex]
  const hasMultipleImages = images.length > 1

  return (
    <article className="border-b border-slate-100 bg-white">
      {/* 헤더 — 클릭 시 모달 */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onOpen() }}
        aria-label={`${post.author.nickname} 피드 게시물 보기`}
      >
        <div className="rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white">
            {post.author.profileImageUrl ? (
              <AuthenticatedImage
                src={post.author.profileImageUrl}
                alt={post.author.nickname}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-black text-[#1E3A8A]">
                {(post.author.nickname || '?').slice(0, 1)}
              </span>
            )}
          </div>
        </div>
        <p className="truncate text-sm font-semibold text-slate-900">{post.author.nickname}</p>
      </div>

      {/* 이미지 — 클릭 시 모달 */}
      <div
        className="relative aspect-square w-full bg-slate-100 cursor-pointer"
        onClick={onOpen}
        role="button"
        tabIndex={-1}
        aria-hidden="true"
      >
        {currentImage ? (
          <AuthenticatedImage
            src={currentImage.imageUrl}
            alt={post.caption ?? '피드 이미지'}
            className="h-full w-full object-cover"
            fallback={
              <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
                이미지 없음
              </div>
            }
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm font-bold text-slate-400">
            이미지 없음
          </div>
        )}

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setImageIndex((p) => (p === 0 ? images.length - 1 : p - 1)) }}
              aria-label="이전 사진"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1 shadow-sm cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 text-slate-800" />
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setImageIndex((p) => (p + 1) % images.length) }}
              aria-label="다음 사진"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1 shadow-sm cursor-pointer"
            >
              <ChevronRight className="h-4 w-4 text-slate-800" />
            </button>
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
              {images.map((image, index) => (
                <span
                  key={image.feedPostImageId}
                  className={`h-1.5 rounded-full transition-all ${
                    index === imageIndex ? 'w-1.5 bg-[#0095f6]' : 'w-1.5 bg-white/70'
                  }`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {/* 액션 */}
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleLike() }}
            disabled={likeSubmitting}
            aria-pressed={post.likedByMe}
            aria-label="좋아요"
            className="cursor-pointer disabled:opacity-60"
          >
            <Heart className={`h-6 w-6 ${post.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-900'}`} />
          </button>
          <button
            type="button"
            onClick={(e) => void handleToggleComments(e)}
            aria-label="댓글"
            className={`cursor-pointer transition-colors ${commentsOpen ? 'text-[#1E3A8A]' : 'text-slate-900'}`}
          >
            <MessageSquare className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onShare() }}
            aria-label="링크 복사"
            className="cursor-pointer text-slate-900"
          >
            <Send className="h-6 w-6" />
          </button>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleSave() }}
          disabled={saveSubmitting}
          aria-pressed={post.savedByMe}
          aria-label="코디북에 저장"
          className={`cursor-pointer disabled:opacity-40 transition-colors active:scale-90 ${post.savedByMe ? 'text-[#1E3A8A]' : 'text-slate-300'}`}
        >
          <LayoutGrid className="h-6 w-6" />
        </button>
      </div>

      {/* 본문 */}
      <div className="space-y-1 px-3 pb-3">
        {post.likeCount > 0 ? (
          <p className="text-sm font-semibold text-slate-900">
            좋아요 {post.likeCount.toLocaleString()}개
          </p>
        ) : null}
        {post.caption ? (
          <p className="text-sm leading-snug text-slate-900">
            <span className="mr-1.5 font-semibold">{post.author.nickname}</span>
            <span className="font-normal">{post.caption}</span>
          </p>
        ) : null}
        {post.commentCount > 0 && !commentsOpen ? (
          <button
            type="button"
            onClick={(e) => void handleToggleComments(e)}
            className="text-sm text-slate-400 cursor-pointer hover:text-slate-600 transition-colors text-left"
          >
            댓글 {post.commentCount.toLocaleString()}개 모두 보기
          </button>
        ) : null}
        <p className="pt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
          {formatRelativeTime(post.createdAt)}
        </p>
      </div>

      {/* 인라인 댓글 */}
      {commentsOpen ? (
        <div className="border-t border-slate-100 px-3 pb-4 pt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
          {commentsLoading ? (
            <p className="text-xs font-bold text-slate-400">댓글 불러오는 중…</p>
          ) : comments.length === 0 ? (
            <p className="text-xs font-bold text-slate-400">첫 댓글을 남겨보세요.</p>
          ) : (
            comments.map((c) => (
              <div key={c.feedCommentId} className="space-y-1.5">
                {/* 댓글 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs text-slate-800 flex-1">
                    <span className="font-black mr-1.5">{c.author.nickname}</span>
                    <span className="font-normal">{c.content}</span>
                  </div>
                  {c.author.userId !== userId ? (
                    <button
                      type="button"
                      onClick={() => openReply(c.feedCommentId)}
                      className={`shrink-0 text-[10px] font-black cursor-pointer ${replyingToId === c.feedCommentId ? 'text-[#1E3A8A]' : 'text-slate-400'}`}
                    >
                      댓글
                    </button>
                  ) : null}
                </div>
                {replyInput(c.feedCommentId)}

                {/* 답글 */}
                {c.replies.length > 0 ? (
                  <div className="ml-4 space-y-1.5 border-l-2 border-slate-100 pl-3">
                    {c.replies.map((r) => (
                      <div key={r.feedCommentId} className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="text-xs text-slate-700 flex-1">
                            <span className="font-black mr-1.5">{r.author.nickname}</span>
                            <span className="font-normal">{r.content}</span>
                          </div>
                          {r.author.userId !== userId ? (
                            <button
                              type="button"
                              onClick={() => openReply(r.feedCommentId)}
                              className={`shrink-0 text-[10px] font-black cursor-pointer ${replyingToId === r.feedCommentId ? 'text-[#1E3A8A]' : 'text-slate-400'}`}
                            >
                              댓글
                            </button>
                          ) : null}
                        </div>
                        {replyInput(r.feedCommentId)}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))
          )}

          {/* 댓글 입력 */}
          <form onSubmit={(e) => void handleSubmitComment(e)} className="flex gap-2 pt-1">
            <input
              type="text"
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="댓글 달기…"
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
            />
            <button
              type="submit"
              disabled={commentSubmitting || !commentDraft.trim()}
              className="shrink-0 rounded-xl bg-[#1E3A8A] px-3 py-2 text-xs font-black text-[#BBF7D0] cursor-pointer disabled:opacity-50"
            >
              {commentSubmitting ? '…' : '등록'}
            </button>
          </form>
        </div>
      ) : null}
    </article>
  )
}
