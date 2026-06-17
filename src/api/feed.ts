import api from '@/api'
import type { BeApiResponse } from '@/types/be'
import type {
  FeedComment,
  FeedCommentPayload,
  FeedCommentUpdatePayload,
  FeedCreatePayload,
  FeedInteraction,
  FeedPage,
  FeedPost,
} from '@/types/feed'

const FEED_BASE = '/api/v1/feed'
const FEED_IMAGE_TIMEOUT_MS = 60_000

async function unwrap<T>(promise: Promise<{ data: BeApiResponse<T> }>): Promise<T> {
  const { data: body } = await promise
  if (!body.success) {
    throw new Error(body.message ?? '요청에 실패했습니다.')
  }
  return body.data
}

/** GET /api/v1/feed/posts — FEED-002 */
export async function fetchFeedPosts(page = 0, size = 20): Promise<FeedPage> {
  return unwrap(
    api.get<BeApiResponse<FeedPage>>(`${FEED_BASE}/posts`, {
      params: { page, size },
    }),
  )
}

/** GET /api/v1/feed/posts/{postId} — FEED-003 */
export async function fetchFeedPost(postId: number): Promise<FeedPost> {
  return unwrap(api.get<BeApiResponse<FeedPost>>(`${FEED_BASE}/posts/${postId}`))
}

/** PUT /api/v1/feed/posts/{postId} */
export async function updateFeedPost(
  postId: number,
  payload: Partial<Pick<FeedCreatePayload, 'caption'>>,
): Promise<FeedPost> {
  return unwrap(api.put<BeApiResponse<FeedPost>>(`${FEED_BASE}/posts/${postId}`, payload))
}

/** POST /api/v1/feed/posts — FEED-001 */
export async function createFeedPost(payload: FeedCreatePayload): Promise<FeedPost> {
  return unwrap(
    api.post<BeApiResponse<FeedPost>>(`${FEED_BASE}/posts`, payload),
  )
}

/** POST /api/v1/feed/images */
export async function uploadFeedImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const data = await unwrap(
    api.post<BeApiResponse<{ imageUrl: string }>>(`${FEED_BASE}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: FEED_IMAGE_TIMEOUT_MS,
    }),
  )
  return data.imageUrl
}

/** POST /api/v1/feed/posts/{postId}/likes — FEED-004 */
export async function toggleFeedLike(postId: number): Promise<FeedInteraction> {
  return unwrap(
    api.post<BeApiResponse<FeedInteraction>>(`${FEED_BASE}/posts/${postId}/likes`),
  )
}

/** POST /api/v1/feed/posts/{postId}/saves — FEED-005 */
export async function toggleFeedSave(postId: number): Promise<FeedInteraction> {
  return unwrap(
    api.post<BeApiResponse<FeedInteraction>>(`${FEED_BASE}/posts/${postId}/saves`),
  )
}

/** GET /api/v1/feed/posts/{postId}/comments — FEED-006/007 */
export async function fetchFeedComments(postId: number): Promise<FeedComment[]> {
  return unwrap(
    api.get<BeApiResponse<FeedComment[]>>(`${FEED_BASE}/posts/${postId}/comments`),
  )
}

/** POST /api/v1/feed/posts/{postId}/comments — FEED-006/007 */
export async function createFeedComment(
  postId: number,
  payload: FeedCommentPayload,
): Promise<FeedComment> {
  return unwrap(
    api.post<BeApiResponse<FeedComment>>(
      `${FEED_BASE}/posts/${postId}/comments`,
      payload,
    ),
  )
}

/** PUT /api/v1/feed/posts/{postId}/comments/{commentId} */
export async function updateFeedComment(
  postId: number,
  commentId: number,
  payload: FeedCommentUpdatePayload,
): Promise<FeedComment> {
  return unwrap(
    api.put<BeApiResponse<FeedComment>>(
      `${FEED_BASE}/posts/${postId}/comments/${commentId}`,
      payload,
    ),
  )
}

/** DELETE /api/v1/feed/posts/{postId}/comments/{commentId} */
export async function deleteFeedComment(
  postId: number,
  commentId: number,
): Promise<void> {
  await unwrap(
    api.delete<BeApiResponse<null>>(
      `${FEED_BASE}/posts/${postId}/comments/${commentId}`,
    ),
  )
}

/** POST /api/v1/feed/users/{followeeId}/follows — FEED-008 */
export async function toggleFollow(followeeId: number): Promise<FeedInteraction> {
  return unwrap(
    api.post<BeApiResponse<FeedInteraction>>(`${FEED_BASE}/users/${followeeId}/follows`),
  )
}

/** DELETE /api/v1/feed/posts/{postId} */
export async function deleteFeedPost(postId: number): Promise<void> {
  await unwrap(api.delete<BeApiResponse<null>>(`${FEED_BASE}/posts/${postId}`))
}
