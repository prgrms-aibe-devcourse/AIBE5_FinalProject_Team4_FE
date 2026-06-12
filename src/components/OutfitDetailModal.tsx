import React, { useState } from 'react'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { createOutfit } from '@/api/outfits'
import { postRecommendationFeedback } from '@/api/recommendations'
import { useToast } from './Toast'
import { Shirt, CloudRain, Sparkles, ThumbsDown } from '@/components/icons'

interface OutfitItem {
  clothesId?: number
  name?: string
  brand?: string
  imageUrl?: string
  userImageUrl?: string
  category?: string
}

interface OutfitDetailModalProps {
  open: boolean
  combination: {
    top?: OutfitItem | null
    bottom?: OutfitItem | null
    outer?: OutfitItem | null
    totalScore?: number
    weatherLabel?: string
    outfitId?: number
    bookId?: number
  } | null
  onClose: () => void
  onSaved?: () => void
  userId?: number | null  // 추가
}

export default function OutfitDetailModal({ open, combination, onClose, onSaved, userId }: OutfitDetailModalProps) {
  const [saving, setSaving] = useState(false)
  const [disliking, setDisliking] = useState(false)
  const { showToast } = useToast()
  if (!open || !combination) return null

  const items: Array<{ key: string; item?: any | null; label: string }> = [
    { key: 'top', item: combination.top, label: '상의' },
    { key: 'bottom', item: combination.bottom, label: '하의' },
    { key: 'outer', item: combination.outer, label: '아우터' },
  ].filter(it => it.item != null)

  const handleSave = async () => {
    if (!combination.bookId) return
    setSaving(true)
    try {
      const payload = {
        title: [combination.top?.name, combination.bottom?.name].filter(Boolean).join(' + ') || '추천 코디',
        description: combination.weatherLabel ?? '추천 코디',
        thumbnailUrl: combination.top?.imageUrl ?? combination.bottom?.imageUrl ?? combination.outer?.imageUrl ?? '',
        situation: '일상',
        season: 'ALL',
        favorite: false,
        items: [
          { item: combination.top, itemRole: 'TOP', layerOrder: 1 },
          { item: combination.bottom, itemRole: 'BOTTOM', layerOrder: 2 },
          { item: combination.outer, itemRole: 'OUTER', layerOrder: 3 },
        ]
            .filter(it => it.item != null && it.item?.clothesId != null)  // clothesId null 체크 추가
            .map(it => ({
              clothesId: it.item!.clothesId as number,  // undefined 제거
              itemRole: it.itemRole,
              layerOrder: it.layerOrder,
            })),
      }
      await createOutfit(combination.bookId, payload)
      showToast('success', '코디가 저장되었습니다.')
      onSaved?.()
      onClose()
    } catch {
      showToast('error', '코디 저장에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDislike = async () => {
    if (!userId) return
    // 코디 구성 옷들 전체에 DISLIKE 피드백
    const clothesIds = [combination.top, combination.bottom, combination.outer]
      .filter(Boolean)
      .map(item => item?.clothesId)
      .filter(Boolean) as number[]

    if (clothesIds.length === 0) return
    setDisliking(true)
    try {
      await Promise.all(
        clothesIds.map(clothesId =>
          postRecommendationFeedback(userId, { feedbackType: 'DISLIKE', clothesId })
        )
      )
      showToast('success', '이 코디를 싫어요 처리했습니다.')
      onClose()
    } catch {
      showToast('error', '싫어요 처리에 실패했습니다.')
    } finally {
      setDisliking(false)
    }
  }

  const WeatherIcon = (() => {
    const label = (combination.weatherLabel || '').toLowerCase()
    if (label.includes('맑') || label.includes('clear') || label.includes('sun')) return Sparkles
    if (label.includes('비') || label.includes('rain')) return CloudRain
    return CloudRain
  })()

  return (
    <Modal open={open} onClose={onClose} titleId="outfit-detail-title" size="md" placement="center" zIndex={120} closeOnBackdrop>
      <ModalHeader
        onClose={onClose}
        title={[combination.top?.name, combination.bottom?.name].filter(Boolean).join(' + ') || '코디 상세'}
        titleId="outfit-detail-title"
      />
      <ModalBody className="p-5">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            {items.map(({ key, item, label }) => (
              <div key={key} className={`${items.length === 2 ? 'w-1/2' : 'w-1/3'} text-center`}>
                <div className="aspect-[4/5] bg-slate-50 rounded-xl overflow-hidden mb-2 flex items-center justify-center">
                  {(() => {
                    const img = item?.imageUrl || item?.userImageUrl
                    return img ? (
                      <AuthenticatedImage src={img} alt={item?.name ?? ''} className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-300">
                        <Shirt className="w-8 h-8 opacity-40" />
                        <span className="text-[10px] font-bold">이미지 없음</span>
                      </div>
                    )
                  })()}
                </div>
                <p className="text-sm font-black text-slate-900 truncate px-1">{item?.name ?? '—'}</p>
                <p className="text-[11px] font-bold text-slate-500 mb-1.5 truncate px-1">{item?.brand ?? ''}</p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-[#111827]">
              <WeatherIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">날씨</p>
              <p className="text-sm font-black text-slate-800">{combination.weatherLabel ?? '—'}</p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="px-5 py-4 space-y-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex w-full h-12 items-center justify-center rounded-2xl bg-[#111827] text-white text-sm font-black hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
        >
          {saving ? '저장 중…' : '코디 저장하기'}
        </button>
        <button
          type="button"
          onClick={handleDislike}
          disabled={disliking || !userId}
          className="flex w-full h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white text-slate-500 text-sm font-black hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <ThumbsDown className="w-4 h-4" />
          {disliking ? '처리 중…' : '이 코디 싫어요'}
        </button>
      </ModalFooter>
    </Modal>
  )
}