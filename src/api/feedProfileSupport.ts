import axios from 'axios'
import {
  fetchFeedUserProfile,
  fetchUserLikedFeedPosts,
} from '@/api/feed'
import type { FeedPage, FeedPost, FeedUserProfile } from '@/types/feed'

/** profile / liked-posts endpoint 가용 여부. 404 응답 시 fallback으로 전환합니다. */
export type FeedProfileApiCapabilities = {
  userProfile: boolean
  likedPosts: boolean
}

let capabilities: FeedProfileApiCapabilities | null = null

export function getFeedProfileApiCapabilities(): FeedProfileApiCapabilities | null {
  return capabilities
}

export function isFeedProfileApiAvailable(): boolean {
  return capabilities?.userProfile !== false
}

export function isFeedLikedPostsApiAvailable(): boolean {
  return capabilities?.likedPosts !== false
}

function isMissingFeedProfileEndpoint(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}

function markProfileEndpointsUnavailable() {
  capabilities = { userProfile: false, likedPosts: false }
}

function markProfileEndpointAvailable() {
  capabilities = {
    userProfile: true,
    likedPosts: capabilities?.likedPosts ?? true,
  }
}

function markLikedPostsEndpointAvailable() {
  capabilities = {
    userProfile: capabilities?.userProfile ?? true,
    likedPosts: true,
  }
}

function markLikedPostsEndpointUnavailable() {
  capabilities = {
    userProfile: capabilities?.userProfile ?? false,
    likedPosts: false,
  }
}

const EMPTY_PAGE = (page: number, size: number): FeedPage => ({
  content: [],
  page,
  size,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
})

export function buildFallbackFeedUserProfile(
  userId: number,
  viewerUserId: number | null,
  options: {
    nickname?: string
    profileImageUrl?: string | null
    profileBio?: string | null
    externalLinkUrl?: string | null
    postsPage?: FeedPage
    samplePost?: FeedPost
  } = {},
): FeedUserProfile {
  const author = options.samplePost?.author
  const mine = viewerUserId != null && viewerUserId === userId

  return {
    userId,
    nickname: options.nickname ?? author?.nickname ?? '룩피드 프로필',
    profileImageUrl: options.profileImageUrl ?? author?.profileImageUrl ?? null,
    profileBio: options.profileBio ?? null,
    externalLinkUrl: options.externalLinkUrl ?? null,
    postCount: options.postsPage?.totalElements ?? options.postsPage?.content.length ?? 0,
    followerCount: 0,
    followingCount: 0,
    followedByMe: mine || viewerUserId == null ? false : (author?.followedByMe ?? false),
    mine,
  }
}

/** profile API 미제공 시 posts·로컬 프로필 정보로 FeedUserProfile을 보완 */
export async function loadFeedUserProfileSafe(
  userId: number,
  viewerUserId: number | null,
  fallback: {
    nickname?: string
    profileImageUrl?: string | null
    profileBio?: string | null
    externalLinkUrl?: string | null
    postsPage?: FeedPage
    samplePost?: FeedPost
  } = {},
): Promise<FeedUserProfile> {
  if (capabilities?.userProfile === false) {
    return buildFallbackFeedUserProfile(userId, viewerUserId, fallback)
  }

  try {
    const profile = await fetchFeedUserProfile(userId)
    markProfileEndpointAvailable()
    return profile
  } catch (error) {
    if (!isMissingFeedProfileEndpoint(error)) throw error
    markProfileEndpointsUnavailable()
    return buildFallbackFeedUserProfile(userId, viewerUserId, fallback)
  }
}

/** liked-posts API 미제공 시 빈 목록 반환 */
export async function loadUserLikedFeedPostsSafe(
  userId: number,
  page = 0,
  size = 20,
): Promise<FeedPage> {
  if (capabilities?.likedPosts === false) {
    return EMPTY_PAGE(page, size)
  }

  try {
    const result = await fetchUserLikedFeedPosts(userId, page, size)
    markLikedPostsEndpointAvailable()
    return result
  } catch (error) {
    if (!isMissingFeedProfileEndpoint(error)) throw error
    markLikedPostsEndpointUnavailable()
    return EMPTY_PAGE(page, size)
  }
}
