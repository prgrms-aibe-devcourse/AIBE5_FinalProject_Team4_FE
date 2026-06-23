import type { FeedComment } from '@/types/feed'

export function countFeedComments(comments: FeedComment[]): number {
  return comments.reduce(
    (sum, comment) => sum + 1 + countFeedComments(comment.replies),
    0,
  )
}

export const FEED_COMMENTS_POLL_MS = 4000
