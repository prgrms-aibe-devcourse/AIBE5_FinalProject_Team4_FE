import type { FeedComment } from '@/types/feed'

export function countFeedComments(comments: FeedComment[]): number {
  return comments.reduce(
    (sum, comment) => sum + 1 + countFeedComments(comment.replies),
    0,
  )
}

export const FEED_COMMENTS_POLL_MS = 4000

export function resolveReplyParentCommentId(
  comments: FeedComment[],
  targetCommentId: number,
): number | null {
  for (const comment of comments) {
    if (comment.feedCommentId === targetCommentId) {
      return comment.feedCommentId
    }
    for (const reply of comment.replies) {
      if (reply.feedCommentId === targetCommentId) {
        return comment.feedCommentId
      }
    }
  }
  return null
}

export function canReplyToFeedComment(
  comment: FeedComment,
  currentUserId: number,
  options?: { allowOwnThreadReply?: boolean },
): boolean {
  if (comment.author.userId === currentUserId) {
    return Boolean(
      options?.allowOwnThreadReply
      && comment.parentCommentId == null
      && comment.replies.length > 0,
    )
  }
  return true
}
