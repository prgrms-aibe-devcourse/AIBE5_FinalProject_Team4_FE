import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import AuthenticatedImage from '@/components/common/AuthenticatedImage'
import { Check, Star } from '@/components/icons'

interface GarmentPickerGridCardProps {
  name: string
  imageUrl: string
  subtitle?: string
  selected?: boolean
  owned?: boolean
  showOwnershipBadge?: boolean
  onClick: () => void
  favorite?: {
    active: boolean
    onToggle: (event: MouseEvent<HTMLButtonElement>) => void
  }
  footer?: ReactNode
  size?: 'sm' | 'md'
}

export default function GarmentPickerGridCard({
  name,
  imageUrl,
  subtitle,
  selected = false,
  owned = true,
  showOwnershipBadge = true,
  onClick,
  favorite,
  footer,
  size = 'sm',
}: GarmentPickerGridCardProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onClick()
    }
  }

  const isMd = size === 'md'

  return (
    <div className="min-w-0 text-left group">
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-pressed={selected}
        className="cursor-pointer"
      >
        <div
          className={`relative aspect-square overflow-hidden bg-slate-100 border-2 transition group-hover:-translate-y-0.5 group-hover:shadow-md ${
            isMd ? 'rounded-2xl' : 'rounded-xl'
          } ${
            selected ? 'border-[#111827] ring-2 ring-[#C4B5FD]' : 'border-transparent'
          }`}
        >
          <AuthenticatedImage
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover"
            fallback={
              <div className="w-full h-full grid place-items-center text-slate-400 text-xs font-bold">
                이미지 없음
              </div>
            }
          />
          {favorite && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                favorite.onToggle(event)
              }}
              aria-label={favorite.active ? '즐겨찾기 해제' : '즐겨찾기'}
              className={`absolute top-1.5 right-1.5 z-10 rounded-full border bg-white/95 shadow-sm transition-colors cursor-pointer hover:bg-white ${
                isMd ? 'p-2' : 'p-1.5'
              }`}
            >
              <Star
                className={`${
                  isMd ? 'w-4 h-4' : 'w-3.5 h-3.5'
                } ${
                  favorite.active ? 'text-amber-500 fill-amber-500' : 'text-slate-400'
                }`}
              />
            </button>
          )}
          {selected && !favorite && (
            <span className={`absolute top-1.5 right-1.5 rounded-full bg-[#111827] text-white grid place-items-center shadow ${
              isMd ? 'w-7 h-7' : 'w-6 h-6'
            }`}>
              <Check className={isMd ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </span>
          )}
          {selected && favorite && (
            <span className={`absolute ${showOwnershipBadge ? 'top-7 left-1.5' : 'top-1.5 left-1.5'} rounded-full bg-[#111827] text-white grid place-items-center shadow ${
              isMd ? 'w-7 h-7' : 'w-6 h-6'
            }`}>
              <Check className={isMd ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
            </span>
          )}
          {showOwnershipBadge && (
            <span
              className={`absolute left-1.5 top-1.5 h-5 px-2 rounded-full text-[10px] font-black shadow-sm inline-flex items-center justify-center ${
                owned ? 'bg-emerald-500 text-white' : 'bg-orange-500 text-white'
              }`}
            >
              {owned ? '보유' : '위시리스트'}
            </span>
          )}
        </div>
        <p className={`font-black text-slate-800 truncate ${isMd ? 'mt-2 text-sm' : 'mt-1.5 text-[11px]'}`}>{name}</p>
        {subtitle ? (
          <p className={`font-bold text-slate-400 truncate ${isMd ? 'text-xs' : 'text-[10px]'}`}>{subtitle}</p>
        ) : null}
      </div>
      {footer}
    </div>
  )
}
