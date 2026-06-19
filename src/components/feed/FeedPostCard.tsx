import { useEffect, useMemo, useState } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Heart,
  MessageSquare,
  MoreHorizontal,
  Send,
} from '@/components/icons'
import type { FeedPost } from '@/types/feed'

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
  onOpen: () => void
  onToggleLike: () => void
  onToggleSave: () => void
  likeSubmitting?: boolean
  saveSubmitting?: boolean
}

export default function FeedPostCard({
  post,
  onOpen,
  onToggleLike,
  onToggleSave,
  likeSubmitting = false,
  saveSubmitting = false,
}: FeedPostCardProps) {
  const [imageIndex, setImageIndex] = useState(0)

  const images = useMemo(
    () => [...post.images].sort((a, b) => a.sortOrder - b.sortOrder),
    [post.images],
  )

  useEffect(() => {
    setImageIndex(0)
  }, [post.feedPostId])

  const currentImage = images[imageIndex]
  const hasMultipleImages = images.length > 1

  const showPrev = () => {
    setImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))
  }

  const showNext = () => {
    setImageIndex((prev) => (prev + 1) % images.length)
  }

  return (
    <article
      className="cursor-pointer border-b border-slate-100 bg-white"
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onOpen()
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${post.author.nickname} 피드 게시물 보기`}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 text-left">
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
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {post.author.nickname}
            </p>
            {post.outfit ? (
              <p className="truncate text-xs text-slate-500">{post.outfit.title}</p>
            ) : null}
          </div>
        </div>
        <div className="shrink-0 p-1 text-slate-800" aria-hidden="true">
          <MoreHorizontal className="h-5 w-5" />
        </div>
      </div>

      {/* 이미지 */}
      <div className="relative aspect-square w-full bg-slate-100">
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
              onClick={(event) => {
                event.stopPropagation()
                showPrev()
              }}
              aria-label="이전 사진"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/85 p-1 shadow-sm cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4 text-slate-800" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                showNext()
              }}
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
            onClick={(event) => {
              event.stopPropagation()
              onToggleLike()
            }}
            disabled={likeSubmitting}
            aria-pressed={post.likedByMe}
            aria-label="좋아요"
            className="cursor-pointer disabled:opacity-60"
          >
            <Heart
              className={`h-6 w-6 ${
                post.likedByMe ? 'fill-rose-500 text-rose-500' : 'text-slate-900'
              }`}
            />
          </button>
          <span aria-hidden="true">
            <MessageSquare className="h-6 w-6 text-slate-900" />
          </span>
          <span aria-hidden="true">
            <Send className="h-6 w-6 text-slate-900" />
          </span>
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleSave()
          }}
          disabled={saveSubmitting || !post.outfit}
          aria-pressed={post.savedByMe}
          aria-label="코디북에 저장"
          title={post.outfit ? '코디북에 저장' : '연결된 코디가 없습니다'}
          className="cursor-pointer disabled:opacity-40"
        >
          <Bookmark
            className={`h-6 w-6 ${
              post.savedByMe ? 'fill-slate-900 text-slate-900' : 'text-slate-900'
            }`}
          />
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

        {post.commentCount > 0 ? (
          <p className="text-sm text-slate-500">
            댓글 {post.commentCount.toLocaleString()}개 모두 보기
          </p>
        ) : null}

        <p className="pt-0.5 text-[10px] uppercase tracking-wide text-slate-400">
          {formatRelativeTime(post.createdAt)}
        </p>
      </div>
    </article>
  )
}
