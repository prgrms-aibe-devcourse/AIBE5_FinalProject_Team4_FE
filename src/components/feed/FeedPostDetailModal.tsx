import { useCallback, useEffect, useRef, useState } from 'react'
import {
  createFeedComment,
  deleteFeedComment,
  deleteFeedPost,
  fetchFeedComments,
  fetchFeedPost,
  toggleFeedLike,
  toggleFeedSave,
  toggleFollow,
  updateFeedComment,
  updateFeedPost,
} from '@/api/feed'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import FeedClothesImage from '@/components/feed/FeedClothesImage'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import Spinner from '@/components/common/Spinner'
import { Heart, MessageSquare, User, X } from '@/components/icons'
import { useToast } from '@/components/Toast'
import type { ClothesResponse } from '@/types/be'
import { addExistingClothesToWishlist, createWishlistClothes } from '@/api/wardrobe'
import { resolveGarmentColorCode } from '@/data/garmentColors'
import { CATEGORY_ITEM_TYPES } from '@/data/categoryItemTypes'
import type { FeedComment, FeedPost } from '@/types/feed'
import type { Garment } from '@/types'
import { extractApiErrorMessage } from '@/utils/apiError'
import {
  DUPLICATE_WISHLIST_MESSAGE,
  normalizeDuplicateRegisterError,
} from '@/utils/garmentDuplicateCheck'
import {
  feedWishlistProductCode,
  findWishlistGarmentForFeedClothes,
} from '@/utils/recommendWishlistPayload'
import { resolveClothesDisplayImageUrl } from '@/utils/clothesImageUrl'

function ClothesDetailSheet({
  clothes,
  isMine,
  userId,
  existingGarments,
  onWishlistChanged,
  onClose,
}: {
  clothes: ClothesResponse
  isMine: boolean
  userId: number
  existingGarments: Garment[]
  onWishlistChanged?: () => void
  onClose: () => void
}) {
  const { showToast } = useToast()
  const displayImageUrl = resolveClothesDisplayImageUrl(clothes)
  const [wishlisted, setWishlisted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setWishlisted(findWishlistGarmentForFeedClothes(clothes.clothesId, existingGarments) != null)
  }, [clothes.clothesId, existingGarments])

  const handleAddToWishlist = async () => {
    if (isMine || wishlisted || submitting) return
    const imageUrl = resolveClothesDisplayImageUrl(clothes) ?? ''
    if (!imageUrl.startsWith('http')) {
      showToast('error', '이미지 URL이 없어 추가할 수 없습니다.')
      return
    }
    setSubmitting(true)
    try {
      // 1순위: EXTERNAL_SHOPPING 마스터 연결 시도
      try {
        await addExistingClothesToWishlist(userId, clothes.clothesId)
      } catch {
        // EXTERNAL_SHOPPING 이 아닌 옷(PHOTO/PURCHASE 등)은 새 위시리스트 항목 생성
        const beCategory = clothes.category as 'TOP' | 'BOTTOM' | 'OUTER' | 'SHOES'
        const uiCategory = beCategory === 'TOP' ? 'Top' : beCategory === 'BOTTOM' ? 'Bottom' : beCategory === 'OUTER' ? 'Outer' : 'Shoes'
        const styleCodes = (clothes.styles ?? []).map((s) => s.code).filter(Boolean)
        const itemType = clothes.itemType?.trim() || CATEGORY_ITEM_TYPES[uiCategory]?.[0]?.code || 'LONG_SLEEVE'
        const rawUrl = clothes.externalProductUrl
        const externalProductUrl =
          rawUrl && rawUrl.startsWith('https://') && !rawUrl.includes('localhost') && !rawUrl.includes('127.0.0.1')
            ? rawUrl
            : `https://search.shopping.naver.com/search/all?query=${encodeURIComponent(clothes.name)}`

        await createWishlistClothes(userId, {
          name: clothes.name,
          brandName: (clothes.brandName?.trim() || 'UNKNOWN').slice(0, 100),
          productCode: feedWishlistProductCode(clothes.clothesId),
          imageUrl,
          category: beCategory,
          itemType,
          gender: clothes.gender ?? 'UNISEX',
          primaryColor: resolveGarmentColorCode(clothes.primaryColor),
          secondaryColors: (clothes.secondaryColors ?? []).map((c) => c.code).filter(Boolean),
          styles: styleCodes.length > 0 ? styleCodes : ['CASUAL'],
          size: 'FREE',
          externalSource: 'NAVER_SHOPPING',
          externalProductId: String(clothes.clothesId),
          externalProductUrl,
        })
      }
      setWishlisted(true)
      showToast('success', '미보유 옷에 추가했어요.')
      onWishlistChanged?.()
    } catch (err) {
      const message =
        normalizeDuplicateRegisterError(extractApiErrorMessage(err)) ??
        extractApiErrorMessage(err, '미보유 옷 추가에 실패했습니다.')
      if (message === DUPLICATE_WISHLIST_MESSAGE) {
        setWishlisted(true)
        onWishlistChanged?.()
      }
      showToast('error', message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-900/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-white shadow-2xl animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <p className="text-xs font-black text-[#1E3A8A] uppercase tracking-wide">옷 상세</p>
          <div className="flex items-center gap-1.5">
            {!isMine ? (
              <button
                type="button"
                onClick={() => void handleAddToWishlist()}
                disabled={wishlisted || submitting}
                title={wishlisted ? '미보유 옷에 추가됨' : '미보유 옷으로 추가'}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Heart className={`w-4 h-4 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
              </button>
            ) : null}
            <button type="button" onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="mx-5 mt-4 aspect-square w-[calc(100%-2.5rem)] rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
          {displayImageUrl ? (
            <FeedClothesImage
              clothes={clothes}
              alt={clothes.name}
              className="w-full h-full object-contain p-4"
            />
          ) : null}
        </div>
        <div className="px-5 py-4 space-y-1 pb-8">
          <p className="text-base font-black text-slate-900 leading-snug">{clothes.name}</p>
          {clothes.brandName ? (
            <p className="text-sm font-bold text-slate-500">{clothes.brandName}</p>
          ) : null}
          {clothes.externalProductUrl ? (
            <div className="pt-3">
              <a
                href={clothes.externalProductUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-full items-center justify-center rounded-2xl bg-[#03C75A] text-white text-sm font-black hover:bg-[#02b351] transition-colors cursor-pointer"
              >
                쇼핑몰 바로가기
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function formatFeedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function InlineEditableComment({
  comment,
  bgClassName,
  onSave,
  onDelete,
  onReply,
  onViewProfile,
}: {
  comment: FeedComment
  bgClassName: string
  onSave: (commentId: number, content: string) => Promise<void>
  onDelete: (commentId: number) => void
  onReply?: () => void
  onViewProfile?: (userId: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = draft.trim()
    if (!trimmed || saving) return
    setSaving(true)
    try {
      await onSave(comment.feedCommentId, trimmed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setDraft(comment.content)
    setEditing(false)
  }

  return (
    <div className={`rounded-xl border border-slate-100 ${bgClassName} px-3 py-2.5`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {onViewProfile ? (
            <button
              type="button"
              onClick={() => onViewProfile(comment.author.userId)}
              className="text-xs font-black text-slate-900 cursor-pointer hover:underline"
              aria-label={`${comment.author.nickname} 프로필 보기`}
            >
              {comment.author.nickname}
            </button>
          ) : (
            <p className="text-xs font-black text-slate-900">{comment.author.nickname}</p>
          )}
          {editing ? (
            <div className="mt-1 space-y-1.5">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs font-bold text-slate-800 resize-none focus:outline-none focus:border-[#1E3A8A]"
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={saving || !draft.trim()}
                  className="rounded-lg bg-[#1E3A8A] px-3 py-1 text-[10px] font-black text-[#BBF7D0] cursor-pointer disabled:opacity-60"
                >
                  {saving ? '저장 중…' : '저장'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="rounded-lg border border-slate-200 px-3 py-1 text-[10px] font-black text-slate-500 cursor-pointer"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-1 text-xs font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
              <p className="mt-1 text-[10px] font-bold text-slate-400">
                {formatFeedDate(comment.createdAt)}
              </p>
            </>
          )}
        </div>
        {!editing ? (
          <div className="flex shrink-0 gap-1">
            {comment.isOwner ? (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-[10px] font-black text-[#1E3A8A] cursor-pointer"
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(comment.feedCommentId)}
                  className="text-[10px] font-black text-red-500 cursor-pointer"
                >
                  삭제
                </button>
              </>
            ) : onReply ? (
              <button
                type="button"
                onClick={onReply}
                className="text-[10px] font-black text-[#1E3A8A] cursor-pointer"
              >
                댓글
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function CommentItem({
  comment,
  onDelete,
  onSave,
  onSubmitReply,
  onViewProfile,
}: {
  comment: FeedComment
  onDelete: (commentId: number) => void
  onSave: (commentId: number, content: string) => Promise<void>
  onSubmitReply: (parentCommentId: number, content: string) => Promise<void>
  onViewProfile?: (userId: number) => void
}) {
  // 현재 인라인 입력이 열린 댓글 ID (null = 닫힘)
  const [replyingToId, setReplyingToId] = useState<number | null>(null)
  const [replyDraft, setReplyDraft] = useState('')
  const [replySubmitting, setReplySubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const openReply = (targetId: number) => {
    if (replyingToId === targetId) {
      setReplyingToId(null)
    } else {
      setReplyingToId(targetId)
      setReplyDraft('')
      // 다음 렌더 후 포커스
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleSubmitReply = async () => {
    if (!replyingToId) return
    const content = replyDraft.trim()
    if (!content || replySubmitting) return
    setReplySubmitting(true)
    try {
      await onSubmitReply(replyingToId, content)
      setReplyDraft('')
      setReplyingToId(null)
    } finally {
      setReplySubmitting(false)
    }
  }

  const inlineInput = (targetId: number) =>
    replyingToId === targetId ? (
      <div className="ml-4 flex gap-2 border-l-2 border-slate-100 pl-3">
        <input
          ref={inputRef}
          type="text"
          value={replyDraft}
          onChange={(e) => setReplyDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmitReply() }}
          placeholder="댓글을 입력하세요"
          className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
        />
        <button
          type="button"
          onClick={() => void handleSubmitReply()}
          disabled={replySubmitting || !replyDraft.trim()}
          className="shrink-0 rounded-xl bg-[#1E3A8A] px-4 py-2 text-xs font-black text-[#BBF7D0] cursor-pointer disabled:opacity-60"
        >
          {replySubmitting ? '…' : '등록'}
        </button>
        <button
          type="button"
          onClick={() => setReplyingToId(null)}
          className="shrink-0 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-500 cursor-pointer"
        >
          취소
        </button>
      </div>
    ) : null

  return (
    <div className="space-y-2">
      <InlineEditableComment
        comment={comment}
        bgClassName="bg-slate-50"
        onSave={onSave}
        onDelete={onDelete}
        onReply={() => openReply(comment.feedCommentId)}
        onViewProfile={onViewProfile}
      />
      {inlineInput(comment.feedCommentId)}

      {comment.replies.length > 0 ? (
        <div className="ml-4 space-y-2 border-l-2 border-slate-100 pl-3">
          {comment.replies.map((reply) => (
            <div key={reply.feedCommentId} className="space-y-2">
              <InlineEditableComment
                comment={reply}
                bgClassName="bg-white"
                onSave={onSave}
                onDelete={onDelete}
                onReply={() => openReply(reply.feedCommentId)}
                onViewProfile={onViewProfile}
              />
              {inlineInput(reply.feedCommentId)}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

interface FeedPostDetailModalProps {
  open: boolean
  postId: number | null
  userId: number
  wardrobeGarments?: Garment[]
  onWishlistChanged?: () => void
  onClose: () => void
  onPostUpdated: (post: FeedPost) => void
  onPostDeleted: (postId: number) => void
  onViewProfile?: (userId: number) => void
}

export default function FeedPostDetailModal({
  open,
  postId,
  userId,
  wardrobeGarments = [],
  onWishlistChanged,
  onClose,
  onPostUpdated,
  onPostDeleted,
  onViewProfile,
}: FeedPostDetailModalProps) {
  const { showToast, showConfirm } = useToast()

  const handleViewAuthorProfile = useCallback((targetUserId: number) => {
    if (!onViewProfile) return
    onClose()
    onViewProfile(targetUserId)
  }, [onClose, onViewProfile])

  const [post, setPost] = useState<FeedPost | null>(null)
  const [comments, setComments] = useState<FeedComment[]>([])
  const [loading, setLoading] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [interactionSubmitting, setInteractionSubmitting] = useState(false)
  const [following, setFollowing] = useState<boolean | null>(null)
  const [followSubmitting, setFollowSubmitting] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [selectedClothes, setSelectedClothes] = useState<ClothesResponse | null>(null)
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState('')
  const [captionSubmitting, setCaptionSubmitting] = useState(false)

  const loadDetail = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await fetchFeedPost(id)
      setPost(detail)
      setFollowing(detail.author.followedByMe ?? null)
    } catch (loadError) {
      setError(extractApiErrorMessage(loadError, '피드 상세를 불러오지 못했습니다.'))
      setPost(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadComments = useCallback(async (id: number) => {
    setCommentsLoading(true)
    try {
      const data = await fetchFeedComments(id)
      setComments(data)
    } catch {
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open || postId == null) {
      setPost(null)
      setComments([])
      setCommentDraft('')
      setFollowing(null)
      setError(null)
      return
    }

    void loadDetail(postId)
    void loadComments(postId)
  }, [open, postId, loadDetail, loadComments])

  const syncPost = (next: FeedPost) => {
    setPost(next)
    onPostUpdated(next)
  }

  const handleToggleLike = async () => {
    if (!post || interactionSubmitting) return
    // 낙관적 업데이트: 즉시 UI 반영
    const prevPost = post
    const nextLiked = !post.likedByMe
    syncPost({
      ...post,
      likedByMe: nextLiked,
      likeCount: nextLiked ? post.likeCount + 1 : Math.max(0, post.likeCount - 1),
    })
    setInteractionSubmitting(true)
    try {
      const result = await toggleFeedLike(post.feedPostId)
      syncPost({ ...prevPost, likedByMe: result.active, likeCount: result.count })
      showToast('success', result.active ? '좋아요 눌렀어요' : '좋아요 취소했어요')
    } catch (toggleError) {
      syncPost(prevPost) // 실패 시 원상 복구
      const message = extractApiErrorMessage(toggleError, '좋아요 처리에 실패했습니다.')
      setError(message)
      showToast('error', message)
    } finally {
      setInteractionSubmitting(false)
    }
  }

  const handleToggleSave = async () => {
    if (!post || interactionSubmitting) return
    if (!post.outfit) {
      showToast('error', '연결된 코디가 없어 저장할 수 없습니다.')
      return
    }
    setInteractionSubmitting(true)
    try {
      const result = await toggleFeedSave(post.feedPostId)
      syncPost({
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
      setInteractionSubmitting(false)
    }
  }

  const handleToggleFollow = async () => {
    if (!post || followSubmitting || post.author.userId === userId) return
    setFollowSubmitting(true)
    try {
      const result = await toggleFollow(post.author.userId)
      setFollowing(result.active)
    } catch (toggleError) {
      setError(extractApiErrorMessage(toggleError, '팔로우 처리에 실패했습니다.'))
    } finally {
      setFollowSubmitting(false)
    }
  }

  const handleSaveComment = async (commentId: number, content: string) => {
    if (!post) return
    await updateFeedComment(post.feedPostId, commentId, { content })
    await loadComments(post.feedPostId)
  }

  const handleSubmitComment = async () => {
    if (!post || commentSubmitting) return
    const content = commentDraft.trim()
    if (!content) return

    // 입력창 즉시 초기화 + 카운트 낙관적 업데이트
    const prevDraft = commentDraft
    setCommentDraft('')
    syncPost({ ...post, commentCount: post.commentCount + 1 })

    setCommentSubmitting(true)
    setError(null)
    try {
      await createFeedComment(post.feedPostId, { content, parentCommentId: null })
      await loadComments(post.feedPostId)
    } catch (submitError) {
      setCommentDraft(prevDraft)
      syncPost({ ...post, commentCount: Math.max(0, post.commentCount) })
      setError(extractApiErrorMessage(submitError, '댓글 작성에 실패했습니다.'))
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentCommentId: number, content: string) => {
    if (!post) return
    syncPost({ ...post, commentCount: post.commentCount + 1 })
    try {
      await createFeedComment(post.feedPostId, { content, parentCommentId })
      await loadComments(post.feedPostId)
    } catch (submitError) {
      syncPost({ ...post, commentCount: Math.max(0, post.commentCount) })
      setError(extractApiErrorMessage(submitError, '댓글 작성에 실패했습니다.'))
      throw submitError
    }
  }

  const handleDeleteComment = (commentId: number) => {
    if (!post) return
    showConfirm('삭제할까요?', async () => {
      try {
        await deleteFeedComment(post.feedPostId, commentId)
        await loadComments(post.feedPostId)
        syncPost({
          ...post,
          commentCount: Math.max(0, post.commentCount - 1),
        })
        showToast('success', '댓글이 삭제되었습니다.')
      } catch (deleteError) {
        showToast('error', extractApiErrorMessage(deleteError, '댓글 삭제에 실패했습니다.'))
      }
    })
  }

  const handleStartEditCaption = () => {
    setCaptionDraft(post?.caption ?? '')
    setEditingCaption(true)
  }

  const handleSaveCaption = async () => {
    if (!post || captionSubmitting) return
    setCaptionSubmitting(true)
    try {
      const updated = await updateFeedPost(post.feedPostId, { caption: captionDraft.trim() || undefined })
      syncPost(updated)
      setEditingCaption(false)
    } catch (e) {
      setError(extractApiErrorMessage(e, '피드 수정에 실패했습니다.'))
    } finally {
      setCaptionSubmitting(false)
    }
  }

  const handleDeletePost = () => {
    if (!post || deleteSubmitting) return
    showConfirm('삭제할까요?', async () => {
      setDeleteSubmitting(true)
      try {
        await deleteFeedPost(post.feedPostId)
        onPostDeleted(post.feedPostId)
        onClose()
      } catch (deleteError) {
        showToast('error', extractApiErrorMessage(deleteError, '피드 삭제에 실패했습니다.'))
      } finally {
        setDeleteSubmitting(false)
      }
    })
  }

  const handleClose = () => {
    const hasUnsavedCaption = editingCaption
      && captionDraft.trim() !== (post?.caption ?? '').trim()

    if (hasUnsavedCaption) {
      showConfirm('저장하지 않고 닫을까요?', () => {
        setEditingCaption(false)
        onClose()
      }, { confirmLabel: '닫기', variant: 'default' })
      return
    }

    if (editingCaption) {
      setEditingCaption(false)
    }
    onClose()
  }

  if (!open) return null

  return (
    <>
    <Modal
      open={open}
      onClose={handleClose}
      titleId="feed-detail-title"
      size="md"
      placement="sheet"
      zIndex={110}
      closeOnBackdrop={!commentSubmitting && !deleteSubmitting}
      panelClassName="max-h-[92vh]"
    >
      <ModalHeader
        eyebrow="코디 공유 상세"
        title={post?.author.nickname ?? '룩피드'}
        titleId="feed-detail-title"
        className="[&_h3]:text-lg [&_h3]:font-black"
        trailing={post?.mine ? (
          <div className="flex gap-1">
            <button
              type="button"
              onClick={handleStartEditCaption}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              수정
            </button>
            <button
              type="button"
              onClick={handleDeletePost}
              disabled={deleteSubmitting}
              className="rounded-full border border-red-200 bg-white px-3 py-1.5 text-[10px] font-black text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-60"
            >
              {deleteSubmitting ? '삭제 중…' : '삭제'}
            </button>
          </div>
        ) : undefined}
      />

      <ModalBody className="px-0 py-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Spinner />
          </div>
        ) : post ? (
          <div className="space-y-0">
            <div className="aspect-[4/5] w-full bg-slate-50">
              {post.images[0] ? (
                <AuthenticatedImage
                  src={post.images[0].imageUrl}
                  alt={post.caption ?? '피드 이미지'}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="space-y-4 px-5 py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <button
                    type="button"
                    className="shrink-0 cursor-pointer"
                    onClick={() => handleViewAuthorProfile(post.author.userId)}
                    aria-label={`${post.author.nickname} 프로필 보기`}
                  >
                    <div className="rounded-full bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] p-[2px]">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white">
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
                  </button>
                  <div className="min-w-0">
                    {onViewProfile ? (
                      <button
                        type="button"
                        onClick={() => handleViewAuthorProfile(post.author.userId)}
                        className="text-sm font-black text-slate-900 cursor-pointer hover:underline text-left"
                        aria-label={`${post.author.nickname} 프로필 보기`}
                      >
                        {post.author.nickname}
                      </button>
                    ) : (
                      <p className="text-sm font-black text-slate-900">{post.author.nickname}</p>
                    )}
                    <p className="text-[10px] font-bold text-slate-400">
                      {formatFeedDate(post.createdAt)}
                    </p>
                  </div>
                </div>
                {!post.mine && following !== null ? (
                  <button
                    type="button"
                    onClick={() => void handleToggleFollow()}
                    disabled={followSubmitting}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-black transition-colors cursor-pointer disabled:opacity-60 ${
                      following
                        ? 'border-[#1E3A8A]/20 bg-[#BBF7D0]/30 text-[#1E3A8A]'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#1E3A8A]/20'
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    {following ? '팔로잉' : '팔로우'}
                  </button>
                ) : null}
              </div>

              {editingCaption ? (
                <div className="space-y-2">
                  <textarea
                    value={captionDraft}
                    onChange={(e) => setCaptionDraft(e.target.value)}
                    rows={3}
                    placeholder="내용을 입력하세요"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-slate-800 resize-none focus:outline-none focus:border-[#1E3A8A]"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleSaveCaption()}
                      disabled={captionSubmitting}
                      className="rounded-xl bg-[#1E3A8A] px-4 py-1.5 text-xs font-black text-[#BBF7D0] cursor-pointer disabled:opacity-60"
                    >
                      {captionSubmitting ? '저장 중…' : '저장'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingCaption(false)}
                      className="rounded-xl border border-slate-200 px-4 py-1.5 text-xs font-black text-slate-500 cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : post.caption ? (
                <p className="text-sm font-bold text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {post.caption}
                </p>
              ) : null}

              {post.outfit?.items && post.outfit.items.length > 0 ? (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {post.outfit.items.map((item) => (
                    <button
                      key={item.outfitItemId}
                      type="button"
                      onClick={() => setSelectedClothes(item.clothes)}
                      className="shrink-0 w-16 space-y-1 text-center cursor-pointer group"
                    >
                      <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white group-hover:border-[#1E3A8A]/40 transition-colors">
                        <FeedClothesImage
                          clothes={item.clothes}
                          alt={item.clothes.name}
                          className="h-full w-full object-contain p-1"
                        />
                      </div>
                      <p className="line-clamp-2 text-[9px] font-bold text-slate-500 group-hover:text-[#1E3A8A] transition-colors">
                        {item.clothes.name}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                {!post.mine ? (
                  <button
                    type="button"
                    onClick={() => void handleToggleLike()}
                    disabled={interactionSubmitting}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-black transition-colors cursor-pointer disabled:opacity-60 ${
                      post.likedByMe
                        ? 'border-rose-200 bg-rose-50 text-rose-500'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${post.likedByMe ? 'fill-rose-500' : ''}`} />
                    {post.likeCount}
                  </button>
                ) : null}
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-black text-slate-600">
                  <MessageSquare className="h-4 w-4" />
                  {post.commentCount}
                </span>
                {!post.mine ? (
                  <button
                    type="button"
                    onClick={() => void handleToggleSave()}
                    disabled={interactionSubmitting || !post.outfit}
                    title={post.outfit ? '코디북에 저장' : '연결된 코디가 없습니다'}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-black transition-colors cursor-pointer disabled:opacity-40 ${
                      post.savedByMe
                        ? 'border-[#1E3A8A]/20 bg-[#BBF7D0]/30 text-[#1E3A8A]'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    저장
                  </button>
                ) : null}
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
                <p className="text-xs font-black text-slate-500">댓글</p>
                {commentsLoading ? (
                  <p className="text-xs font-bold text-slate-400">댓글 불러오는 중…</p>
                ) : comments.length > 0 ? (
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <CommentItem
                        key={comment.feedCommentId}
                        comment={comment}
                        onDelete={handleDeleteComment}
                        onSave={handleSaveComment}
                        onSubmitReply={handleSubmitReply}
                        onViewProfile={onViewProfile ? handleViewAuthorProfile : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400">첫 댓글을 남겨보세요.</p>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmitComment() }}
                    placeholder="댓글을 입력하세요"
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:border-[#1E3A8A]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleSubmitComment()}
                    disabled={commentSubmitting || !commentDraft.trim()}
                    className="shrink-0 rounded-xl bg-[#1E3A8A] px-4 py-2 text-xs font-black text-[#BBF7D0] cursor-pointer disabled:opacity-60"
                  >
                    등록
                  </button>
                </div>
              </div>

              {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
            </div>
          </div>
        ) : (
          <div className="px-5 py-10 text-center text-sm font-bold text-slate-500">
            {error ?? '피드를 불러오지 못했습니다.'}
          </div>
        )}
      </ModalBody>

      <ModalFooter className="px-5 py-4">
        <button
          type="button"
          onClick={handleClose}
          className="w-full h-11 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          닫기
        </button>
      </ModalFooter>
    </Modal>

    {selectedClothes ? (
      <ClothesDetailSheet
        clothes={selectedClothes}
        isMine={post?.mine ?? false}
        userId={userId}
        existingGarments={wardrobeGarments}
        onWishlistChanged={onWishlistChanged}
        onClose={() => setSelectedClothes(null)}
      />
    ) : null}
    </>
  )
}
