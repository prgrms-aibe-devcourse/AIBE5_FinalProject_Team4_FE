import { useEffect, useState } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Layers, Sparkles } from './icons'
import type { Garment } from '@/types'
import {
  fetchClothesDetail,
  updateClothes,
  deleteClothes,
} from '@/api/wardrobe'

interface ClosetGarmentDetailProps {
  garment: Garment | null
  onGarmentChange: (garment: Garment | null) => void
  onGarmentUpdated: (garment: Garment) => void
  onGarmentDeleted: (clothesId: string) => void
  onToast: (message: string) => void
}

function GarmentEditModal({
  open,
  saving,
  editName,
  editBrand,
  editSize,
  editSeason,
  onNameChange,
  onBrandChange,
  onSizeChange,
  onSeasonChange,
  onSave,
  onClose,
}: {
  open: boolean
  saving: boolean
  editName: string
  editBrand: string
  editSize: string
  editSeason: string
  onNameChange: (v: string) => void
  onBrandChange: (v: string) => void
  onSizeChange: (v: string) => void
  onSeasonChange: (v: string) => void
  onSave: () => void
  onClose: () => void
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, saving, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="garment-edit-title"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-md bg-white rounded-[24px] border border-slate-100 shadow-xl p-6 space-y-4 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              id="garment-edit-title"
              className="text-base font-black text-slate-900"
            >
              옷 정보 수정
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              이름·브랜드·사이즈·시즌만 변경됩니다.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer disabled:opacity-40"
            aria-label="닫기"
          >
            ×
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <label className="block font-bold text-slate-600">
            이름
            <input
              value={editName}
              onChange={(e) => onNameChange(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
          </label>
          <label className="block font-bold text-slate-600">
            브랜드
            <input
              value={editBrand}
              onChange={(e) => onBrandChange(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
          </label>
          <label className="block font-bold text-slate-600">
            사이즈
            <input
              value={editSize}
              onChange={(e) => onSizeChange(e.target.value)}
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
          </label>
          <label className="block font-bold text-slate-600">
            시즌
            <input
              value={editSeason}
              onChange={(e) => onSeasonChange(e.target.value)}
              placeholder="예: SPRING"
              className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 font-normal focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
          </label>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onSave}
            disabled={saving || !editName.trim()}
            className="flex-1 py-2.5 rounded-xl text-xs font-black bg-[#1E3A8A] text-white cursor-pointer disabled:opacity-50"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-xs font-black bg-slate-100 text-slate-600 cursor-pointer disabled:opacity-50"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ClosetGarmentDetail({
  garment,
  onGarmentChange,
  onGarmentUpdated,
  onGarmentDeleted,
  onToast,
}: ClosetGarmentDetailProps) {
  const [detail, setDetail] = useState<Garment | null>(garment)
  const [loading, setLoading] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState('')
  const [editBrand, setEditBrand] = useState('')
  const [editSize, setEditSize] = useState('')
  const [editSeason, setEditSeason] = useState('')

  useEffect(() => {
    if (!garment) {
      setDetail(null)
      setEditModalOpen(false)
      return
    }

    let cancelled = false
    setLoading(true)
    fetchClothesDetail(Number(garment.id))
      .then((fetched) => {
        if (!cancelled) {
          setDetail(fetched)
          onGarmentChange(fetched)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDetail(garment)
          onToast('상세 정보를 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garment?.id, onToast])

  const openEditModal = () => {
    if (!detail?.be) {
      onToast('수정할 수 없는 데이터입니다. 다시 선택해 주세요.')
      return
    }
    setEditName(detail.name)
    setEditBrand(detail.be.brandName)
    setEditSize(detail.size ?? '')
    setEditSeason(detail.season ?? '')
    setEditModalOpen(true)
  }

  const closeEditModal = () => {
    if (!saving) setEditModalOpen(false)
  }

  const handleSave = async () => {
    if (!detail) return
    setSaving(true)
    try {
      const updated = await updateClothes(Number(detail.id), detail, {
        name: editName.trim(),
        brandName: editBrand.trim(),
        size: editSize.trim() || 'FREE',
        season: editSeason.trim() || undefined,
      })
      setDetail(updated)
      onGarmentUpdated(updated)
      setEditModalOpen(false)
      onToast('옷 정보가 수정되었습니다.')
    } catch {
      onToast('수정에 실패했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!detail) return
    const label = detail.isWishlist ? '위시리스트' : '보유 옷장'
    const confirmed = window.confirm(
      `"${detail.name}"을(를) ${label}에서 삭제할까요?\n삭제 후에는 목록에서 제거됩니다.`,
    )
    if (!confirmed) return

    try {
      await deleteClothes(Number(detail.id))
      onGarmentDeleted(detail.id)
      onGarmentChange(null)
      setDetail(null)
      setEditModalOpen(false)
      onToast('삭제되었습니다.')
    } catch (err) {
      console.error('[ClosetGarmentDetail] deleteClothes failed:', err)
      onToast('삭제에 실패했습니다.')
    }
  }

  if (!garment) {
    return (
      <div className="bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 flex flex-col justify-center items-center h-72 select-none">
        <span className="text-3xl block mb-2">👚</span>
        <h4 className="text-xs font-bold text-slate-700">의상 분석 상세 정보</h4>
        <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
          좌측 컬렉션에서 의상을 선택하면 BE에서 불러온 상세 정보가 표시됩니다.
        </p>
      </div>
    )
  }

  if (loading && !detail) {
    return (
      <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs font-bold">
        상세 정보 불러오는 중...
      </div>
    )
  }

  const g = detail ?? garment
  const statusLabel = g.isWishlist ? '미보유 (위시리스트)' : '보유'

  return (
    <>
      <GarmentEditModal
        open={editModalOpen}
        saving={saving}
        editName={editName}
        editBrand={editBrand}
        editSize={editSize}
        editSeason={editSeason}
        onNameChange={setEditName}
        onBrandChange={setEditBrand}
        onSizeChange={setEditSize}
        onSeasonChange={setEditSeason}
        onSave={handleSave}
        onClose={closeEditModal}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={openEditModal}
            disabled={!g.be || g.isWishlist}
            title={g.isWishlist ? '미보유 옷은 보유 전환 후 수정할 수 있습니다' : undefined}
            className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-[#1E3A8A] text-white disabled:opacity-40 cursor-pointer"
          >
            수정
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-[10px] font-black px-3 py-1.5 rounded-lg bg-rose-100 text-rose-800 border border-rose-200 cursor-pointer"
          >
            삭제
          </button>
        </div>

        <div className="bg-white rounded-[24px] border border-slate-100 p-4.5 shadow-2xs text-left space-y-3">
          {g.thumbnailUrl && (
            <AuthenticatedImage
              src={g.thumbnailUrl}
              alt={g.name}
              className="w-full h-40 object-cover rounded-xl border border-slate-100"
            />
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {statusLabel}
            </span>
            {g.isFavorite && (
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                즐겨찾기
              </span>
            )}
          </div>
          <h4 className="text-sm font-black text-slate-900">{g.name}</h4>
          <p className="text-[10px] text-slate-500">
            브랜드: {g.be?.brandName ?? g.fabricMaterial} · 코드: {g.productCode ?? '—'}
          </p>
          <p className="text-[10px] text-slate-500">
            카테고리: {g.category} · 타입: {g.fitType}
          </p>
          <p className="text-[10px] text-slate-500">
            색상: {g.color} · 스타일: {g.style}
          </p>
          {(g.size || g.season) && (
            <p className="text-[10px] text-slate-500">
              사이즈: {g.size ?? '—'} · 시즌: {g.season ?? '—'}
            </p>
          )}
        </div>

        <div className="bg-slate-900 text-slate-300 p-5 rounded-[24px] space-y-3 font-mono text-xs text-left">
          <div className="flex items-center space-x-1.5 text-[#BBF7D0] font-black text-[12px] border-b border-white/10 pb-2">
            <Layers className="w-4 h-4" />
            <span>BE 상세 스펙</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div>
              <span className="text-slate-500 block">CATEGORY</span>
              <span className="text-white font-bold">{g.be?.categoryCode ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">ITEM TYPE</span>
              <span className="text-white font-bold">{g.be?.itemTypeCode ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">COLOR CODE</span>
              <span className="text-emerald-300 font-bold">{g.be?.primaryColorCode ?? '—'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">STYLES</span>
              <span className="text-white font-bold truncate">
                {g.be?.styleCodes.join(', ') || '—'}
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 font-sans border-t border-white/10 pt-2 flex items-start gap-1">
            <Sparkles className="w-3 h-3 shrink-0 mt-0.5 text-[#BBF7D0]" />
            즐겨찾기한 옷은 추후 코디·어울리는 옷 추천 API와 연동할 수 있습니다.
          </p>
        </div>
      </div>
    </>
  )
}
