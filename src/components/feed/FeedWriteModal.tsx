import { useCallback, useEffect, useMemo, useState } from 'react'
import { createFeedPost, uploadFeedImage } from '@/api/feed'
import { fetchWardrobeGarments } from '@/api/wardrobe'
import { createOutfit, fetchMyOutfitBook } from '@/api/outfits'
import type { OutfitResponse } from '@/api/outfits'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Modal, ModalBody, ModalHeader } from '@/components/common/Modal'
import { Camera, Plus, Upload, X } from '@/components/icons'
import { useToast } from '@/components/Toast'
import type { Garment } from '@/types'
import type { FeedPost } from '@/types/feed'
import { extractApiErrorMessage } from '@/utils/apiError'
import { resolveClothesDisplayImageUrl } from '@/utils/clothesImageUrl'

interface FeedWriteModalProps {
  open: boolean
  userId: number
  onClose: () => void
  onCreated: (post: FeedPost) => void
}

type OutfitSourceMode = 'book' | 'compose'

type ComposeCategory = 'Top' | 'Bottom' | 'Outer' | 'Shoes'

const COMPOSE_SLOTS: Array<{
  category: ComposeCategory
  label: string
  itemRole: string
  layerOrder: number
}> = [
  { category: 'Top', label: '상의', itemRole: 'TOP', layerOrder: 1 },
  { category: 'Bottom', label: '하의', itemRole: 'BOTTOM', layerOrder: 2 },
  { category: 'Outer', label: '아우터', itemRole: 'OUTER', layerOrder: 3 },
  { category: 'Shoes', label: '신발', itemRole: 'SHOES', layerOrder: 4 },
]

function resolveOutfitPreviewUrl(outfit: OutfitResponse): string | undefined {
  const fromThumb = outfit.thumbnailUrl?.trim()
  if (fromThumb) return fromThumb
  for (const item of outfit.items ?? []) {
    const url = resolveClothesDisplayImageUrl(item.clothes)
    if (url) return url
  }
  return undefined
}

function resolveGarmentPreviewUrl(garment: Garment): string | undefined {
  return garment.thumbnailUrl ?? garment.userImageUrl ?? garment.be?.imageUrl
}

export default function FeedWriteModal({
  open,
  userId,
  onClose,
  onCreated,
}: FeedWriteModalProps) {
  const { showToast } = useToast()
  const [caption, setCaption] = useState('')
  const [sourceMode, setSourceMode] = useState<OutfitSourceMode>('book')
  const [bookId, setBookId] = useState<number | null>(null)
  const [selectedOutfitId, setSelectedOutfitId] = useState<number | null>(null)
  const [outfits, setOutfits] = useState<OutfitResponse[]>([])
  const [ownedGarments, setOwnedGarments] = useState<Garment[]>([])
  const [composed, setComposed] = useState<Partial<Record<ComposeCategory, Garment>>>({})
  const [activeComposeSlot, setActiveComposeSlot] = useState<ComposeCategory | null>(null)
  const [outfitsLoading, setOutfitsLoading] = useState(false)
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setCaption('')
    setSourceMode('book')
    setBookId(null)
    setSelectedOutfitId(null)
    setOutfits([])
    setOwnedGarments([])
    setComposed({})
    setActiveComposeSlot(null)
    setImageUrls([])
    setError(null)
  }, [])

  useEffect(() => {
    if (!open) {
      reset()
      return
    }

    let cancelled = false
    setOutfitsLoading(true)

    Promise.all([
      fetchMyOutfitBook().catch(() => null),
      fetchWardrobeGarments(userId).catch(() => ({ garments: [] as Garment[] })),
    ])
      .then(([book, wardrobe]) => {
        if (cancelled) return
        const savedOutfits = book?.outfits ?? []
        setBookId(book?.outfitBookId ?? null)
        setOutfits(savedOutfits)
        setOwnedGarments(wardrobe.garments.filter((garment) => !garment.isWishlist))
        setSourceMode(savedOutfits.length > 0 ? 'book' : 'compose')
      })
      .finally(() => {
        if (!cancelled) setOutfitsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, reset, userId])

  const composedGarments = useMemo(
    () =>
      COMPOSE_SLOTS.map((slot) => composed[slot.category]).filter(
        (garment): garment is Garment => garment != null,
      ),
    [composed],
  )

  const deriveFeedImageUrls = useCallback((): string[] => {
    if (imageUrls.length > 0) {
      return imageUrls
    }

    if (sourceMode === 'book' && selectedOutfitId != null) {
      const outfit = outfits.find((item) => item.outfitId === selectedOutfitId)
      if (!outfit) return []

      const urls: string[] = []
      const preview = resolveOutfitPreviewUrl(outfit)
      if (preview) urls.push(preview)

      for (const item of outfit.items ?? []) {
        const url = resolveClothesDisplayImageUrl(item.clothes)
        if (url && !urls.includes(url)) urls.push(url)
      }
      return urls.slice(0, 10)
    }

    if (sourceMode === 'compose') {
      return composedGarments
        .map(resolveGarmentPreviewUrl)
        .filter((url): url is string => Boolean(url))
        .slice(0, 10)
    }

    return []
  }, [composedGarments, imageUrls, outfits, selectedOutfitId, sourceMode])

  const outfitReady =
    (sourceMode === 'book' && selectedOutfitId != null)
    || (sourceMode === 'compose' && composedGarments.length > 0)

  const resolvedImageUrls = deriveFeedImageUrls()
  const canSubmit =
    outfitReady
    && resolvedImageUrls.length > 0
    && !submitting
    && !uploading

  const garmentsForActiveSlot = useMemo(() => {
    if (!activeComposeSlot) return []
    return ownedGarments.filter((garment) => garment.category === activeComposeSlot)
  }, [activeComposeSlot, ownedGarments])

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    const remaining = 10 - imageUrls.length
    if (remaining <= 0) {
      setError('피드 이미지는 최대 10장까지 등록할 수 있습니다.')
      return
    }

    const targets = files.slice(0, remaining)
    setUploading(true)
    setError(null)
    try {
      const uploaded = await Promise.all(targets.map((file) => uploadFeedImage(file)))
      setImageUrls((prev) => [...prev, ...uploaded])
    } catch (uploadError) {
      const message = extractApiErrorMessage(uploadError, '이미지 업로드에 실패했습니다.')
      setError(message)
      showToast('error', message)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSelectOutfit = (outfitId: number) => {
    setSourceMode('book')
    setSelectedOutfitId((prev) => (prev === outfitId ? null : outfitId))
    setComposed({})
    setActiveComposeSlot(null)
  }

  const handleSelectGarment = (category: ComposeCategory, garment: Garment) => {
    setSourceMode('compose')
    setSelectedOutfitId(null)
    setComposed((prev) => ({
      ...prev,
      [category]: prev[category]?.id === garment.id ? undefined : garment,
    }))
  }

  const buildComposeOutfitPayload = () => {
    const items = COMPOSE_SLOTS.flatMap((slot) => {
      const garment = composed[slot.category]
      if (!garment) return []
      return [{
        clothesId: Number(garment.id),
        itemRole: slot.itemRole,
        layerOrder: slot.layerOrder,
      }]
    })

    const title =
      composedGarments.map((garment) => garment.name).filter(Boolean).join(' + ')
      || '나의 코디'

    const thumbnailUrl =
      composedGarments.map(resolveGarmentPreviewUrl).find(Boolean)
      ?? imageUrls[0]
      ?? 'https://placehold.co/400x400/png?text=Outfit'

    return {
      title,
      description: caption.trim() || '공유 코디',
      thumbnailUrl,
      situation: '일상',
      season: 'ALL',
      favorite: false,
      items,
    }
  }

  const handleSubmit = async () => {
    const feedImageUrls = deriveFeedImageUrls()

    if (feedImageUrls.length === 0) {
      setError('피드에 사용할 사진이 없습니다. 직접 추가하거나, 이미지가 있는 코디/옷을 선택해 주세요.')
      return
    }

    if (sourceMode === 'book' && outfits.length > 0 && selectedOutfitId == null) {
      setError('코디북에서 연결할 코디를 선택해 주세요.')
      return
    }

    if (sourceMode === 'compose' && composedGarments.length === 0) {
      setError('옷 조합하기에서 최소 1벌 이상 선택해 주세요.')
      return
    }

    if (sourceMode === 'compose' && composedGarments.length > 0 && bookId == null) {
      setError('코디북 정보를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      let outfitId = sourceMode === 'book' ? selectedOutfitId : null

      if (sourceMode === 'compose' && composedGarments.length > 0 && bookId != null) {
        const created = await createOutfit(bookId, buildComposeOutfitPayload())
        outfitId = created.outfitId
      }

      const created = await createFeedPost({
        outfitId,
        caption: caption.trim() || undefined,
        imageUrls: feedImageUrls,
      })
      onCreated(created)
      showToast('success', '피드에 업로드했어요.')
      onClose()
    } catch (submitError) {
      const message = extractApiErrorMessage(submitError, '피드 업로드에 실패했습니다.')
      setError(message)
      showToast('error', message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <Modal
      open={open}
      onClose={onClose}
      titleId="feed-write-title"
      size="md"
      placement="sheet"
      zIndex={110}
      panelClassName="relative flex flex-col max-h-[92vh]"
      closeOnBackdrop={!submitting && !uploading}
      preventClose={submitting || uploading}
    >
      <ModalHeader
        eyebrow="FEED-001"
        title="코디 업로드"
        titleId="feed-write-title"
        onClose={onClose}
        closeDisabled={submitting || uploading}
        className="[&_h3]:text-lg [&_h3]:font-black"
      />

      <ModalBody className="px-5 py-4 space-y-4 pb-28">
        <div className="space-y-2">
          <p className="text-xs font-black text-slate-500">사진</p>
          <div className="grid grid-cols-2 gap-3">
            {imageUrls.map((url, index) => (
              <div key={`${url}-${index}`} className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                <AuthenticatedImage
                  src={url}
                  alt={`업로드 이미지 ${index + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-1.5 right-1.5 rounded-full bg-black/50 p-1 text-white cursor-pointer"
                  aria-label="이미지 제거"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {imageUrls.length < 10 ? (
              <label className="flex aspect-[4/5] cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 text-slate-500 hover:border-[#1E3A8A]/40 hover:text-[#1E3A8A]">
                {imageUrls.length === 0 ? (
                  <>
                    <Upload className="h-6 w-6" />
                    <span className="text-xs font-black">사진 선택</span>
                  </>
                ) : (
                  <>
                    <Camera className="h-5 w-5" />
                    <span className="text-[11px] font-black">추가</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(event) => void handleImageSelect(event)}
                  disabled={uploading || submitting}
                />
              </label>
            ) : null}
          </div>
          {uploading ? (
            <p className="text-xs font-bold text-slate-500">이미지 업로드 중…</p>
          ) : (
            <p className="text-[10px] font-bold text-slate-400">
              한 줄에 2장씩 표시됩니다. 직접 추가하거나 선택한 코디·옷 이미지로도 업로드할 수 있어요.
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-black text-slate-500">코디 연결</p>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => {
                  setSourceMode('book')
                  setComposed({})
                  setActiveComposeSlot(null)
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition-colors cursor-pointer ${
                  sourceMode === 'book'
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                코디북
              </button>
              <button
                type="button"
                onClick={() => {
                  setSourceMode('compose')
                  setSelectedOutfitId(null)
                }}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-black transition-colors cursor-pointer ${
                  sourceMode === 'compose'
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                옷 조합
              </button>
            </div>
          </div>

          {outfitsLoading ? (
            <p className="text-xs font-bold text-slate-400">코디 정보 불러오는 중…</p>
          ) : sourceMode === 'book' ? (
            outfits.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {outfits.map((outfit) => {
                  const preview = resolveOutfitPreviewUrl(outfit)
                  const selected = selectedOutfitId === outfit.outfitId
                  return (
                    <button
                      key={outfit.outfitId}
                      type="button"
                      onClick={() => handleSelectOutfit(outfit.outfitId)}
                      className={`overflow-hidden rounded-2xl border text-left transition-colors cursor-pointer ${
                        selected
                          ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="aspect-[4/5] bg-slate-50">
                        {preview ? (
                          <AuthenticatedImage
                            src={preview}
                            alt={outfit.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-[10px] font-bold text-slate-400">
                            미리보기 없음
                          </div>
                        )}
                      </div>
                      <div className="space-y-0.5 p-2">
                        <p className="line-clamp-2 text-[11px] font-black text-slate-800">
                          {outfit.title}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400">
                          {(outfit.items ?? []).length}벌 구성
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-500">
                저장된 코디가 없습니다. 옷 조합 탭에서 새 코디를 만들 수 있어요.
              </p>
            )
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {COMPOSE_SLOTS.map((slot) => {
                  const garment = composed[slot.category]
                  const preview = garment ? resolveGarmentPreviewUrl(garment) : undefined
                  const active = activeComposeSlot === slot.category
                  return (
                    <button
                      key={slot.category}
                      type="button"
                      onClick={() =>
                        setActiveComposeSlot((prev) =>
                          prev === slot.category ? null : slot.category,
                        )
                      }
                      className={`overflow-hidden rounded-2xl border text-center transition-colors cursor-pointer ${
                        active
                          ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                          : garment
                            ? 'border-emerald-300'
                            : 'border-dashed border-slate-300'
                      }`}
                    >
                      <div className="aspect-[4/5] bg-slate-50">
                        {preview ? (
                          <AuthenticatedImage
                            src={preview}
                            alt={garment?.name ?? slot.label}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center px-2 text-xs font-black text-slate-400">
                            {slot.label}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {activeComposeSlot ? (
                garmentsForActiveSlot.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-black text-slate-500">
                      {COMPOSE_SLOTS.find((slot) => slot.category === activeComposeSlot)?.label} 선택
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {garmentsForActiveSlot.map((garment) => {
                        const preview = resolveGarmentPreviewUrl(garment)
                        const selected = composed[activeComposeSlot]?.id === garment.id
                        return (
                          <button
                            key={garment.id}
                            type="button"
                            onClick={() => handleSelectGarment(activeComposeSlot, garment)}
                            className={`overflow-hidden rounded-2xl border text-left transition-colors cursor-pointer ${
                              selected
                                ? 'border-[#1E3A8A] ring-2 ring-[#1E3A8A]/20'
                                : 'border-slate-200'
                            }`}
                          >
                            <div className="aspect-[4/5] bg-slate-50">
                              {preview ? (
                                <AuthenticatedImage
                                  src={preview}
                                  alt={garment.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full items-center justify-center text-[10px] font-bold text-slate-400">
                                  No img
                                </div>
                              )}
                            </div>
                            <p className="truncate px-2 py-1.5 text-[10px] font-bold text-slate-700">
                              {garment.name}
                            </p>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-500">
                    옷장에 등록된 {COMPOSE_SLOTS.find((slot) => slot.category === activeComposeSlot)?.label}가 없습니다.
                  </p>
                )
              ) : (
                <p className="text-[10px] font-bold text-slate-400">
                  슬롯을 눌러 옷장에서 옷을 골라 조합해 주세요. 업로드 시 코디북에도 함께 저장됩니다.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="feed-caption" className="text-xs font-black text-slate-500">
            설명
          </label>
          <textarea
            id="feed-caption"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
            rows={4}
            maxLength={2000}
            placeholder="오늘의 코디 이야기를 남겨보세요"
            className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-800 placeholder:text-slate-400"
          />
        </div>

        {error ? <p className="text-xs font-bold text-red-600">{error}</p> : null}
      </ModalBody>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center px-5 pb-5 pt-10 bg-gradient-to-t from-white from-55% to-transparent">
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!canSubmit}
          className="pointer-events-auto flex items-center gap-2 h-12 px-6 rounded-2xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-[#BBF7D0] shadow-lg font-bold text-sm transition active:scale-95 cursor-pointer disabled:opacity-60 disabled:active:scale-100"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
          <span>{submitting ? '업로드 중…' : '코디 업로드'}</span>
        </button>
      </div>
    </Modal>
  )
}
