import { useEffect, useState } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import BrandDisplay from '@/components/common/BrandDisplay'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Heart } from '@/components/icons'
import type { RecommendCardItem, RecommendColorChip } from '@/utils/recommendationMapper'

interface RecommendProductDetailModalProps {
  open: boolean
  item: RecommendCardItem | null
  onClose: () => void
  wishlisted?: boolean
  wishlistSubmitting?: boolean
  onWishlistToggle?: () => void
  onDislike?: () => void
  dislikeSubmitting?: boolean
  onPurchaseConfirm?: () => Promise<boolean>
  purchaseConfirmSubmitting?: boolean
}

function ColorSwatch({ color }: { color: RecommendColorChip }) {
  const hex = color.hex ?? '#E2E8F0'
  const lightBorder =
    hex.toUpperCase() === '#FFFFFF'
    || hex.toUpperCase() === '#FDD835'
    || hex.toUpperCase() === '#D2B48C'

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1">
      <span
        className={`h-3.5 w-3.5 shrink-0 rounded-full ${lightBorder ? 'border border-slate-200' : ''}`}
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <span className="text-xs font-bold text-slate-700">{color.label}</span>
    </span>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[4rem_1fr] items-start gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <span className="pt-0.5 text-xs font-black text-slate-400">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

export default function RecommendProductDetailModal({
  open,
  item,
  onClose,
  wishlisted = false,
  wishlistSubmitting = false,
  onWishlistToggle,
  onDislike,
  dislikeSubmitting = false,
  onPurchaseConfirm,
  purchaseConfirmSubmitting = false,
}: RecommendProductDetailModalProps) {
  const [purchaseOpened, setPurchaseOpened] = useState(false)

  useEffect(() => {
    if (!open || !item) setPurchaseOpened(false)
  }, [open, item?.id])

  if (!open || !item) return null

  const categoryLabel =
    item.categoryLabel
    ?? ({ Top: '상의', Bottom: '하의', Outer: '아우터', Shoes: '신발' } as const)[item.category]
  const styles = item.styles.length > 0 ? item.styles : item.style !== '—' ? [item.style] : []
  const allColors: RecommendColorChip[] = [
    { label: item.color, hex: item.colorHex },
    ...item.secondaryColors,
  ]
  const canToggleWishlist = !item.isAnchor && item.clothesId != null && onWishlistToggle

  const handlePurchaseClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()
    window.open(item.purchaseUrl!, '_blank', 'noopener,noreferrer')
    if (onPurchaseConfirm) setPurchaseOpened(true)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      titleId="recommend-product-detail-title"
      size="sm"
      placement="center"
      zIndex={100}
      closeOnBackdrop
      panelClassName="max-h-[92vh]"
    >
      <ModalHeader
        eyebrow="추천 상품 상세"
        title={item.title}
        titleId="recommend-product-detail-title"
        className="[&_h3]:text-lg [&_h3]:font-black"
        trailing={
          canToggleWishlist ? (
            <button
              type="button"
              onClick={onWishlistToggle}
              disabled={wishlistSubmitting}
              aria-pressed={wishlisted}
              aria-label={wishlisted ? '위시리스트에서 빼기' : '위시리스트에 추가'}
              className={`rounded-full border bg-white p-2 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 ${
                wishlisted
                  ? 'border-rose-200 text-rose-500 hover:border-rose-300 hover:bg-rose-50'
                  : 'border-slate-200 text-slate-400 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500 disabled:hover:border-slate-200 disabled:hover:bg-white disabled:hover:text-slate-400'
              }`}
            >
              <Heart className={`h-5 w-5 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
          ) : null
        }
      />

      <ModalBody>
        <div className="aspect-square border-b border-slate-100 bg-slate-50">
          <AuthenticatedImage
            src={item.imageUrl}
            alt={item.title}
            className="h-full w-full object-contain p-4"
            fallback={
              <div className="flex h-full w-full items-center justify-center text-sm font-bold text-slate-400">
                이미지 없음
              </div>
            }
          />
        </div>

        <div className="px-5 py-2">
          <DetailRow label="브랜드">
            <BrandDisplay label={item.brandLabel} logoUrl={item.brandLogoUrl} size="large" />
          </DetailRow>

          <DetailRow label="카테고리">
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900">{categoryLabel}</p>
              {item.itemTypeLabel ? (
                <p className="text-xs font-bold text-slate-500">{item.itemTypeLabel}</p>
              ) : null}
            </div>
          </DetailRow>

          <DetailRow label="스타일">
            {styles.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {styles.map((style) => (
                  <span
                    key={style}
                    className="inline-flex rounded-full bg-[#F3E8FF] px-2.5 py-1 text-xs font-black text-[#1E3A8A]"
                  >
                    {style}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-slate-400">—</p>
            )}
          </DetailRow>

          <DetailRow label="컬러">
            <div className="flex flex-wrap gap-1.5">
              {allColors.map((color, index) => (
                <ColorSwatch key={`${color.label}-${index}`} color={color} />
              ))}
            </div>
          </DetailRow>
        </div>
      </ModalBody>

      <ModalFooter className="space-y-2 px-5 py-4">
        {item.hasDirectPurchaseUrl && item.purchaseUrl && item.purchaseUrl !== '#' ? (
          <a
            href={item.purchaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handlePurchaseClick}
            className={`flex h-11 w-full cursor-pointer items-center justify-center rounded-2xl bg-[#03C75A] text-sm font-black text-white transition-colors hover:bg-[#02b351] ${purchaseConfirmSubmitting ? 'cursor-not-allowed opacity-60' : ''}`}
          >
            {purchaseConfirmSubmitting ? '처리 중...' : '네이버쇼핑에서 구매하기'}
          </a>
        ) : null}

        {purchaseOpened && onPurchaseConfirm ? (
          <button
            type="button"
            onClick={() => {
              void onPurchaseConfirm()
              setPurchaseOpened(false)
            }}
            disabled={purchaseConfirmSubmitting}
            className="h-11 w-full rounded-2xl bg-emerald-600 text-sm font-black text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {purchaseConfirmSubmitting ? '처리 중...' : '샀어요! 옷장에 추가하기'}
          </button>
        ) : null}

        {onDislike ? (
          <button
            type="button"
            onClick={onDislike}
            disabled={dislikeSubmitting}
            className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
          >
            {dislikeSubmitting ? '정리 중…' : '해당 추천 싫어요'}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="h-10 w-full cursor-pointer rounded-2xl border border-slate-200 bg-white text-sm font-black text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
        >
          닫기
        </button>
      </ModalFooter>
    </Modal>
  )
}
