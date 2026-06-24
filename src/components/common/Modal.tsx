import { useEffect, useState, type HTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from '@/components/icons'

export type ModalSize = 'sm' | 'md' | 'lg'
export type ModalPlacement = 'center' | 'sheet'
/** App 고정 UI(header z-30, FAB z-40)보다 위. toast는 z-[130]으로 모달 위에 표시 */
export type ModalZIndex = 100 | 110 | 120 | 130

const SIZE_CLASS: Record<ModalSize, string> = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-xl',
  lg: 'sm:max-w-2xl',
}

const Z_INDEX_CLASS: Record<ModalZIndex, string> = {
  100: 'z-[100]',
  110: 'z-[110]',
  120: 'z-[120]',
  130: 'z-[130]',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  id?: string
  titleId?: string
  ariaDescribedBy?: string
  size?: ModalSize
  placement?: ModalPlacement
  zIndex?: ModalZIndex
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  preventClose?: boolean
  overlayClassName?: string
  panelClassName?: string
  overlayProps?: HTMLAttributes<HTMLDivElement>
}

export function Modal({
  open,
  onClose,
  children,
  id,
  titleId,
  ariaDescribedBy,
  size = 'md',
  placement = 'center',
  zIndex = 100,
  closeOnBackdrop = false,
  closeOnEscape = true,
  preventClose = false,
  overlayClassName = '',
  panelClassName = '',
  overlayProps,
}: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open || !closeOnEscape || preventClose) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [closeOnEscape, onClose, open, preventClose])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open || !mounted) return null

  const placementClass =
    placement === 'sheet'
      ? 'items-end sm:items-center p-0 sm:p-4'
      : 'items-center p-4'

  const panelRadiusClass =
    placement === 'sheet'
      ? 'rounded-t-[28px] sm:rounded-[28px]'
      : 'rounded-[28px]'

  const handleBackdropClick = () => {
    if (closeOnBackdrop && !preventClose) onClose()
  }

  const { className: overlayPropsClassName, onClick: overlayOnClick, ...restOverlayProps } =
    overlayProps ?? {}

  return createPortal(
    <div
      id={id}
      className={`fixed inset-0 flex justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in ${Z_INDEX_CLASS[zIndex]} ${placementClass} ${overlayClassName} ${overlayPropsClassName ?? ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={ariaDescribedBy}
      onClick={(event) => {
        overlayOnClick?.(event)
        if (event.target === event.currentTarget) handleBackdropClick()
      }}
      {...restOverlayProps}
    >
      <div
        className={`w-full ${SIZE_CLASS[size]} bg-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh] ${panelRadiusClass} ${panelClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  )
}

interface ModalHeaderProps {
  title: ReactNode
  titleId?: string
  eyebrow?: ReactNode
  subtitle?: ReactNode
  onClose?: () => void
  closeDisabled?: boolean
  className?: string
  trailing?: ReactNode
  align?: 'start' | 'center'
}

export function ModalHeader({
  title,
  titleId,
  eyebrow,
  subtitle,
  onClose,
  closeDisabled = false,
  className = '',
  trailing,
  align = 'start',
}: ModalHeaderProps) {
  return (
    <div
      className={`flex ${align === 'center' ? 'items-center' : 'items-start'} justify-between gap-3 px-5 sm:px-7 pt-5 sm:pt-6 pb-3 sm:pb-4 border-b border-slate-100 shrink-0 ${className}`}
    >
      <div className="min-w-0 text-left leading-tight">
        {eyebrow ? (
          <p className="text-[11px] font-black text-[#1E3A8A] uppercase tracking-wide">
            {eyebrow}
          </p>
        ) : null}
        <h3
          id={titleId}
          className={`text-lg font-bold text-[#1E3A8A] leading-snug ${eyebrow ? 'mt-1' : ''}`}
        >
          {title}
        </h3>
        {subtitle ? (
          <p className="text-sm text-slate-400 mt-1 leading-snug">{subtitle}</p>
        ) : null}
      </div>
      {(trailing || onClose) ? (
        <div className="flex items-center gap-1.5 shrink-0">
          {trailing}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              disabled={closeDisabled}
              className="shrink-0 p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition disabled:opacity-40 cursor-pointer"
              aria-label="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

interface ModalBodyProps {
  children: ReactNode
  className?: string
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return (
    <div className={`flex-1 min-h-0 overflow-y-auto overscroll-y-contain ${className}`}>
      {children}
    </div>
  )
}

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`shrink-0 border-t border-slate-100 bg-slate-50 ${className}`}>
      {children}
    </div>
  )
}
