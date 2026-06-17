import { useCallback, useEffect, useState } from 'react'
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
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import Spinner from '@/components/common/Spinner'
import { Heart, MessageSquare, User, X } from '@/components/icons'
import { useToast } from '@/components/Toast'
import type { ClothesResponse } from '@/types/be'
import { updateClothesFavorite } from '@/api/wardrobe'
import type { FeedComment, FeedPost } from '@/types/feed'
import { extractApiErrorMessage } from '@/utils/apiError'


function ClothesDetailSheet({
  clothes,
  isMine,
  onClose,
}: {
  clothes: ClothesResponse
  isMine: boolean
  onClose: () => void
}) {
  const imageUrl = clothes.userImageUrl ?? clothes.imageUrl
  const canFavorite = !isMine && clothes.wardrobeClothesId != null
  const [favorite, setFavorite] = useState(clothes.isFavorite ?? false)
  const [favoriteSubmitting, setFavoriteSubmitting] = useState(false)

  const handleToggleFavorite = async () => {
    if (!canFavorite || favoriteSubmitting) return
    setFavoriteSubmitting(true)
    try {
      await updateClothesFavorite(clothes.clothesId, !favorite)
      setFavorite((prev) => !prev)
    } finally {
      setFavoriteSubmitting(false)
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
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
          <p className="text-xs font-black text-[#1E3A8A] uppercase tracking-wide">옷 상세</p>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => void handleToggleFavorite()}
              disabled={!canFavorite || favoriteSubmitting}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Heart className={`w-4 h-4 ${favorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button type="button" onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 이미지 */}
        <div className="mx-5 mt-4 aspect-square w-[calc(100%-2.5rem)] rounded-2xl border border-slate-200 bg-slate-50 overflow-hidden">
          {imageUrl ? (
            <AuthenticatedImage src={imageUrl} alt={clothes.name} className="w-full h-full object-contain p-4" />
          ) : null}
        </div>

        {/* 정보 */}
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
}: {
  comment: FeedComment
  bgClassName: string
  onSave: (commentId: number, content: string) => Promise<void>
  onDelete: (commentId: number) => void
  onReply?: (commentId: number) => void
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
          <p className="text-xs font-black text-slate-900">{comment.author.nickname}</p>
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
                onClick={() => onReply(comment.feedCommentId)}
                className="text-[10px] font-black text-[#1E3A8A] cursor-pointer"
              >
                답글
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
  onReply,
  onDelete,
  onSave,
}: {
  comment: FeedComment
  onReply: (commentId: number) => void
  onDelete: (commentId: number) => void
  onSave: (commentId: number, content: string) => Promise<void>
}) {
  return (
    <div className="space-y-2">
      <InlineEditableComment
        comment={comment}
        bgClassName="bg-slate-50"
        onSave={onSave}
        onDelete={onDelete}
        onReply={onReply}
      />
      {comment.replies.length > 0 ? (
        <div className="ml-4 space-y-2 border-l-2 border-slate-100 pl-3">
          {comment.replies.map((reply) => (
            <InlineEditableComment
              key={reply.feedCommentId}
              comment={reply}
              bgClassName="bg-white"
              onSave={onSave}
              onDelete={onDelete}
            />
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
  onClose: () => void
  onPostUpdated: (post: FeedPost) => void
  onPostDeleted: (postId: number) => void
}

export default function FeedPostDetailModal({
  open,
  postId,
  userId,
  onClose,
  onPostUpdated,
  onPostDeleted,
}: FeedPostDetailModalProps) {
  const { showToast } = useToast()
  const [post, setPost] = useState<FeedPost | null>(null)
  const [comments, setComments] = useState<FeedComment[]>([])
  const [loading, setLoading] = useState(false)
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [commentDraft, setCommentDraft] = useState('')
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null)
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [interactionSubmitting, setInteractionSubmitting] = useState(false)
  const [following, setFollowing] = useState(false)
  const [followSubmitting, setFollowSubmitting] = useState(false)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [editingCaption, setEditingCaption] = useState(false)
  const [captionDraft, setCaptionDraft] = useState('')
  const [captionSubmitting, setCaptionSubmitting] = useState(false)
  const [selectedClothes, setSelectedClothes] = useState<ClothesResponse | null>(null)

  const loadDetail = useCallback(async (id: number) => {
    setLoading(true)
    setError(null)
    try {
      const detail = await fetchFeedPost(id)
      setPost(detail)
      setFollowing(detail.author.followedByMe)
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
      setReplyToCommentId(null)
      setFollowing(false)
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
    setInteractionSubmitting(true)
    try {
      const result = await toggleFeedLike(post.feedPostId)
      syncPost({
        ...post,
        likedByMe: result.active,
        likeCount: result.count,
      })
    } catch (toggleError) {
      setError(extractApiErrorMessage(toggleError, '좋아요 처리에 실패했습니다.'))
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

    setCommentSubmitting(true)
    setError(null)
    try {
      await createFeedComment(post.feedPostId, {
        content,
        parentCommentId: replyToCommentId,
      })
      setCommentDraft('')
      setReplyToCommentId(null)
      await loadComments(post.feedPostId)
      syncPost({ ...post, commentCount: post.commentCount + 1 })
    } catch (submitError) {
      setError(extractApiErrorMessage(submitError, '댓글 작성에 실패했습니다.'))
    } finally {
      setCommentSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    if (!post) return
    try {
      await deleteFeedComment(post.feedPostId, commentId)
      await loadComments(post.feedPostId)
      syncPost({
        ...post,
        commentCount: Math.max(0, post.commentCount - 1),
      })
    } catch (deleteError) {
      setError(extractApiErrorMessage(deleteError, '댓글 삭제에 실패했습니다.'))
    }
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

  const handleDeletePost = async () => {
    if (!post || deleteSubmitting) return
    if (!confirm('이 피드를 삭제할까요?')) return

    setDeleteSubmitting(true)
    try {
      await deleteFeedPost(post.feedPostId)
      onPostDeleted(post.feedPostId)
      onClose()
    } catch (deleteError) {
      setError(extractApiErrorMessage(deleteError, '피드 삭제에 실패했습니다.'))
    } finally {
      setDeleteSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
    <Modal
      open={open}
      onClose={onClose}
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
              onClick={() => void handleDeletePost()}
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
                <div className="min-w-0">
                  <p className="text-sm font-black text-slate-900">{post.author.nickname}</p>
                  <p className="text-[10px] font-bold text-slate-400">
                    {formatFeedDate(post.createdAt)}
                  </p>
                </div>
                {!post.mine ? (
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

              {post.outfit ? (
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                  <div>
                    <p className="text-[10px] font-black text-slate-400">연결 코디</p>
                    <p className="text-sm font-black text-[#1E3A8A]">{post.outfit.title}</p>
                    {post.outfit.description ? (
                      <p className="mt-1 text-xs font-bold text-slate-600">
                        {post.outfit.description}
                      </p>
                    ) : null}
                  </div>
                  {post.outfit.items.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {post.outfit.items.map((item) => (
                        <button
                          key={item.outfitItemId}
                          type="button"
                          onClick={() => setSelectedClothes(item.clothes)}
                          className="shrink-0 w-16 space-y-1 text-center cursor-pointer group"
                        >
                          <div className="aspect-square overflow-hidden rounded-xl border border-slate-200 bg-white group-hover:border-[#1E3A8A]/40 transition-colors">
                            <AuthenticatedImage
                              src={item.clothes.userImageUrl ?? item.clothes.imageUrl}
                              alt={item.clothes.name}
                              className="h-full w-full object-contain p-1"
                            />
                          </div>
                          <p className="line-clamp-2 text-[9px] font-bold text-slate-600 group-hover:text-[#1E3A8A] transition-colors">
                            {item.clothes.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  ) : null}
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
                        onReply={setReplyToCommentId}
                        onDelete={(commentId) => void handleDeleteComment(commentId)}
                        onSave={handleSaveComment}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400">첫 댓글을 남겨보세요.</p>
                )}

                {replyToCommentId ? (
                  <p className="text-[10px] font-black text-[#1E3A8A]">
                    답글 작성 중
                    <button
                      type="button"
                      onClick={() => setReplyToCommentId(null)}
                      className="ml-2 text-slate-400 cursor-pointer"
                    >
                      취소
                    </button>
                  </p>
                ) : null}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commentDraft}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder={replyToCommentId ? '답글을 입력하세요' : '댓글을 입력하세요'}
                    className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-800"
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
          onClick={onClose}
          className="w-full h-11 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          닫기
        </button>
      </ModalFooter>
    </Modal>

    {selectedClothes ? (
      <ClothesDetailSheet clothes={selectedClothes} isMine={post?.mine ?? false} onClose={() => setSelectedClothes(null)} />
    ) : null}
    </>
  )
}
