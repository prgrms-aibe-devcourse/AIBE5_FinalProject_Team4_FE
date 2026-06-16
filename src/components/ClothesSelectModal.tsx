import React, { useState } from 'react'
import { Modal, ModalBody, ModalHeader } from '@/components/common/Modal'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Garment } from '@/types'
import { Shirt } from '@/components/icons'

interface ClothesSelectModalProps {
  open: boolean
  onClose: () => void
  onSelect: (garment: Garment) => void
  clothes: Garment[]
  category: string
  title: string
}

export default function ClothesSelectModal({
  open,
  onClose,
  onSelect,
  clothes,
  category,
  title
}: ClothesSelectModalProps) {
  const [filter, setFilter] = useState('')

  const filtered = clothes
    .filter(c => !c.isWishlist)
    .filter(c => c.category.toUpperCase() === category.toUpperCase())
    .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))

  return (
    <Modal open={open} onClose={onClose} size="md" zIndex={120} closeOnBackdrop>
      <ModalHeader title={title} onClose={onClose} />
      <ModalBody className="p-4 space-y-4">
        <div className="sticky top-0 bg-white pb-2 z-10">
          <input
            type="text"
            placeholder="이름으로 검색..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full h-10 px-4 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#1E3A8A] outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                onSelect(item)
                onClose()
              }}
              className="p-3 border border-slate-100 rounded-2xl hover:border-[#1E3A8A] hover:bg-slate-50 cursor-pointer transition-all"
            >
              <div className="aspect-square bg-white rounded-xl overflow-hidden mb-2 flex items-center justify-center border border-slate-50">
                {item.thumbnailUrl ? (
                  <AuthenticatedImage src={item.thumbnailUrl} alt={item.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <Shirt className="w-8 h-8 text-slate-200" />
                )}
              </div>
              <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
              <p className="text-[10px] text-slate-400">{item.color} · {item.style}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-2 py-10 text-center text-slate-400 text-sm">
              해당하는 옷이 없습니다.
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  )
}
