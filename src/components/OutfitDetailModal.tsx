import React, { useState } from 'react'
import { Modal, ModalBody, ModalFooter, ModalHeader } from '@/components/common/Modal'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import type { Garment } from '@/types'
import { createOutfit, OutfitSavePayload } from '@/api/outfits'
import { useToast } from './Toast'

interface OutfitItem {
  clothesId?: number
  name?: string
  brand?: string
  imageUrl?: string
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
}

export default function OutfitDetailModal({ open, combination, onClose, onSaved }: OutfitDetailModalProps) {
  const [saving, setSaving] = useState(false)
  const { showToast } = useToast()
  if (!open || !combination) return null

  const items: Array<{ key: string; item?: OutfitItem | null }> = [
    { key: 'top', item: combination.top },
    { key: 'bottom', item: combination.bottom },
    { key: 'outer', item: combination.outer },
  ]

  const handleSave = async () => {
    if (!combination.bookId) return
    setSaving(true)
    try {
      const payload: OutfitSavePayload = {
        outfitId: combination.outfitId ?? null,
        title: [combination.top?.name, combination.bottom?.name, combination.outer?.name].filter(Boolean).join(' + ') || null,
        items: items.map((it) => ({
          role: it.key.toUpperCase(),
          clothesId: it.item?.clothesId ?? null,
          name: it.item?.name ?? null,
          brand: it.item?.brand ?? null,
          imageUrl: it.item?.imageUrl ?? null,
          category: it.item?.category ?? null,
        })),
        metadata: {
          weatherLabel: combination.weatherLabel ?? null,
          totalScore: combination.totalScore ?? null,
        },
      }

      await createOutfit(combination.bookId, payload)
      showToast('success', '코디가 저장되었습니다.')
      onSaved?.()
      onClose()
    } catch (err) {
      // minimal feedback
      try {
        showToast('error', '코디 저장에 실패했습니다.')
      } catch {
        // fallback
        // eslint-disable-next-line no-alert
        alert('코디 저장에 실패했습니다.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} titleId="outfit-detail-title" size="md" placement="center" zIndex={120}>
      <ModalHeader eyebrow="추천 코디" title={combination.top?.name || combination.bottom?.name || '코디 상세'} titleId="outfit-detail-title" />
      <ModalBody>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            {items.map(({ key, item }) => (
              <div key={key} className="w-1/3 text-center">
                <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-2">
                  {item?.imageUrl ? (
                    <AuthenticatedImage src={item.imageUrl} alt={item?.name ?? ''} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold">이미지 없음</div>
                  )}
                </div>
                <p className="text-sm font-black text-slate-900 truncate">{item?.name ?? '—'}</p>
                <p className="text-xs text-slate-500">{item?.brand ?? ''}</p>
                <p className="text-xs text-slate-400 font-bold">{item?.category ?? ''}</p>
              </div>
            ))}
          </div>

          <div className="px-1">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-bold">날씨</p>
              <p className="text-sm font-black text-slate-800">{combination.weatherLabel ?? '—'}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-slate-500 font-bold">합산 점수</p>
              <p className="text-sm font-black text-emerald-600">{combination.totalScore ?? '—'}</p>
            </div>
          </div>
        </div>
      </ModalBody>

      <ModalFooter className="px-5 py-4 space-y-2">
        <button type="button" onClick={handleSave} disabled={saving} className="flex w-full h-11 items-center justify-center rounded-2xl bg-[#03C75A] text-white text-sm font-black hover:bg-[#02b351] transition-colors">
          {saving ? '저장 중…' : '코디 저장'}
        </button>
        <button type="button" onClick={onClose} className="w-full h-10 rounded-2xl border border-slate-200 bg-white text-slate-600 text-sm font-black hover:bg-slate-50">
          닫기
        </button>
      </ModalFooter>
    </Modal>
  )
}
