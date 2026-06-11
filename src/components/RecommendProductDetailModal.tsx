import React, { useState } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import { Heart } from '@/components/icons'
import type { RecommendCardItem, RecommendColorChip } from '@/utils/recommendationMapper'
import { postRecommendationFeedback } from '@/api/recommendations'
import { useToast } from '@/components/Toast'

interface RecommendProductDetailModalProps {
  open: boolean
  item: RecommendCardItem | null
  onClose: () => void
  userId?: number | null
  wishlisted?: boolean
  wishlistSubmitting?: boolean
  onWishlistToggle?: () => void
  isOutfit?: boolean
}

function ColorSwatch({ color }: { color: RecommendColorChip }) {
  const hex = color.hex ?? '#E2E8F0'
  const lightBorder = hex.toUpperCase() === '#FFFFFF' || hex.toUpperCase() === '#FDD835' || hex.toUpperCase() === '#D2B48C'
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1">
      <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${lightBorder ? 'border border-slate-200' : ''}`} style={{ backgroundColor: hex }} aria-hidden />
      <span className="text-xs font-bold text-slate-700">{color.label}</span>
    </span>
  )
}

function BrandDisplay({ label, logoUrl }: { label: string; logoUrl: string | null }) {
  const [failed, setFailed] = useState(false)
  React.useEffect(() => setFailed(false), [logoUrl])
  const showLogo = Boolean(logoUrl) && !failed
  if (showLogo) {
    return (
      <span className="inline-flex h-9 max-w-[140px] items-center">
        <img src={logoUrl!} alt={label} className="max-h-9 w-auto max-w-full object-contain" onError={() => setFailed(true)} />
      </span>
    )
  }
  return <p className="text-sm font-black text-slate-900 truncate">{label}</p>
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-b-0">
      <span className="w-16 shrink-0 text-xs font-black text-slate-400 pt-0.5">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export default function RecommendProductDetailModal({ open, item, onClose, userId = null, wishlisted = false, wishlistSubmitting = false, onWishlistToggle, isOutfit = false, }: RecommendProductDetailModalProps) {
  const [actionLoading, setActionLoading] = useState<{ save?: boolean; dislike?: boolean; exclude?: boolean }>({})
  const { showToast } = useToast()
  if (!open || !item) return null

  const categoryLabel = item.categoryLabel ?? ({ Top: '상의', Bottom: '하의', Outer: '아우터', Shoes: '신발' } as const)[item.category]
  const styles = item.styles.length > 0 ? item.styles : item.style !== '—' ? [item.style] : []
  const allColors: RecommendColorChip[] = [{ label: item.color, hex: item.colorHex }, ...item.secondaryColors]

  const callFeedback = async (type: 'SAVE' | 'DISLIKE' | 'EXCLUDE') => {
    if (!userId) {
      showToast('info', '로그인 후 이용해 주세요.')
      return
    }
    setActionLoading((s) => ({ ...s, [type === 'SAVE' ? 'save' : type === 'DISLIKE' ? 'dislike' : 'exclude']: true }))
    try {
      await postRecommendationFeedback(userId, { type, clothesId: item.clothesId ?? undefined, outfitId: item.outfitId ?? undefined })
      showToast('success', type === 'SAVE' ? '저장 피드백이 전송되었습니다.' : type === 'DISLIKE' ? '싫어요 전송 완료' : '추천 제외 처리되었습니다.')
    } catch (err) {
      showToast('error', '요청에 실패했습니다.')
    } finally {
      setActionLoading({})
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId="recommend-product-detail-title" size="sm" placement="sheet" zIndex={100} closeOnBackdrop panelClassName="max-h-[92vh]">
      <ModalHeader eyebrow={isOutfit ? '추천 코디 상세' : '추천 상품 상세'} title={item.title} titleId="recommend-product-detail-title" className="[&_h3]:text-lg [&_h3]:font-black" trailing={(!isOutfit && onWishlistToggle && item.clothesId != null) ? (
        <button type="button" onClick={onWishlistToggle} disabled={wishlistSubmitting} aria-pressed={wishlisted} aria-label={wishlisted ? '위시리스트에서 빼기' : '위시리스트에 추가'} className={`p-2 rounded-full border bg-white transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${wishlisted ? 'border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300' : 'border-slate-200 text-slate-400 hover:text-rose-500 hover:border-slate-200 hover:bg-rose-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white'}`}>
          <Heart className={`w-5 h-5 ${wishlisted ? 'text-rose-500 fill-rose-500' : ''}`} />
        </button>
      ) : null} />

      <ModalBody>
        <div className="bg-slate-50 border-b border-slate-100">
          <div className="relative">
            <div className="aspect-[4/3] bg-white flex items-center justify-center p-4">
              <AuthenticatedImage src={item.imageUrl} alt={item.title} className="w-full h-full object-contain" fallback={<div className="w-full h-full flex items-center justify-center text-slate-400 text-sm font-bold">이미지 없음</div>} />
            </div>

            <div className="absolute top-3 left-3 inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm">
              <span className="text-xs font-black text-slate-700">{item.price ?? ''}</span>
              {item.matchRate != null ? (<span className="text-xs font-black text-emerald-600">{item.matchRate}%</span>) : null}
            </div>
          </div>
        </div>

        <div className="px-5 py-3">
          <DetailRow label="브랜드">
            <BrandDisplay label={item.brandLabel} logoUrl={item.brandLogoUrl} />
          </DetailRow>

          <DetailRow label="카테고리">
            <div className="space-y-1">
              <p className="text-sm font-black text-slate-900">{categoryLabel}</p>
              {item.itemTypeLabel ? (<p className="text-xs font-bold text-slate-500">{item.itemTypeLabel}</p>) : null}
            </div>
          </DetailRow>

          <DetailRow label="설명">
            <p className="text-sm text-slate-600 font-bold leading-relaxed">{item.reason ?? '설명 없음'}</p>
          </DetailRow>

          <DetailRow label="스타일">
            {styles.length > 0 ? (<div className="flex flex-wrap gap-1.5">{styles.map((style) => (<span key={style} className="inline-flex rounded-full bg-[#F3E8FF] text-[#1E3A8A] px-2.5 py-1 text-xs font-black">{style}</span>))}</div>) : (<p className="text-sm font-bold text-slate-400">—</p>)}
          </DetailRow>

          <DetailRow label="컬러">
            <div className="flex flex-wrap gap-1.5">{allColors.map((color, index) => (<ColorSwatch key={`${color.label}-${index}`} color={color} />))}</div>
          </DetailRow>
        </div>
      </ModalBody>

      <ModalFooter className="px-5 py-4 space-y-2">
        {!isOutfit ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <button type="button" onClick={() => callFeedback('SAVE')} disabled={actionLoading.save} className="h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 text-sm font-black hover:bg-slate-50">저장</button>
              <button type="button" onClick={() => callFeedback('DISLIKE')} disabled={actionLoading.dislike} className="h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 text-sm font-black hover:bg-slate-50">싫어요</button>
              <a href={item.purchaseUrl} target="_blank" rel="noopener noreferrer" className="h-10 inline-flex items-center justify-center rounded-2xl bg-[#F59E0B] text-white text-sm font-black hover:bg-[#d78a07]">외부 링크</a>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => callFeedback('EXCLUDE')} disabled={actionLoading.exclude} className="h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 text-sm font-black hover:bg-slate-50">추천 제외</button>
              <button type="button" onClick={onClose} className="h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 text-sm font-black hover:bg-slate-50">닫기</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={onClose} className="w-full h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 text-sm font-black hover:bg-slate-50">닫기</button>
        )}
      </ModalFooter>
    </Modal>
  )
}
