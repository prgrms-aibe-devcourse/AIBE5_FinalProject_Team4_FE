import type { ClothesResponse } from '@/types/be'

export interface FeedAuthor {
  userId: number
  nickname: string
  profileImageUrl: string | null
}

export interface FeedImage {
  feedPostImageId: number
  imageUrl: string
  sortOrder: number
}

export interface FeedOutfitItem {
  outfitItemId: number
  itemRole: string
  layerOrder: number | null
  clothes: ClothesResponse
}

export interface FeedOutfit {
  outfitId: number
  outfitBookId: number
  title: string
  description: string
  thumbnailUrl: string | null
  situation: string | null
  season: string | null
  favorite: boolean
  items: FeedOutfitItem[]
  createdAt: string
  updatedAt: string
}

export interface FeedPost {
  feedPostId: number
  author: FeedAuthor
  outfit: FeedOutfit | null
  caption: string | null
  images: FeedImage[]
  likeCount: number
  commentCount: number
  likedByMe: boolean
  savedByMe: boolean
  hidden: boolean
  mine: boolean
  createdAt: string
  updatedAt: string
}

export interface FeedPage {
  content: FeedPost[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  hasNext: boolean
}

export interface FeedComment {
  feedCommentId: number
  feedPostId: number
  author: FeedAuthor
  parentCommentId: number | null
  content: string
  replies: FeedComment[]
  createdAt: string
}

export interface FeedInteraction {
  active: boolean
  count: number
}

export interface FeedCreatePayload {
  outfitId?: number | null
  caption?: string
  imageUrls: string[]
}

export interface FeedCommentPayload {
  parentCommentId?: number | null
  content: string
}
