/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ToastType = 'success' | 'error' | 'info'

export type ToastConfirmOptions = {
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}

type ToastEntry =
  | { id: string; kind: 'message'; type: ToastType; message: string }
  | {
      id: string
      kind: 'confirm'
      message: string
      onConfirm: () => void
      confirmLabel: string
      cancelLabel: string
      variant: 'danger' | 'default'
    }

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
  showConfirm: (message: string, onConfirm: () => void, options?: ToastConfirmOptions) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

function toSingleLine(message: string): string {
  return message.replace(/\s+/g, ' ').trim()
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((t) => [{ id, kind: 'message', type, message: toSingleLine(message) }, ...t])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    options?: ToastConfirmOptions,
  ) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((t) => [{
      id,
      kind: 'confirm',
      message: toSingleLine(message),
      onConfirm,
      confirmLabel: options?.confirmLabel ?? '삭제',
      cancelLabel: options?.cancelLabel ?? '취소',
      variant: options?.variant ?? 'danger',
    }, ...t])
  }, [])

  const confirms = toasts.filter((t): t is Extract<ToastEntry, { kind: 'confirm' }> => t.kind === 'confirm')
  const messages = toasts.filter((t): t is Extract<ToastEntry, { kind: 'message' }> => t.kind === 'message')

  const toastLayer =
    mounted && toasts.length > 0
      ? createPortal(
          <>
            {confirms.length > 0 ? (
              <div
                className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/40 p-5 pointer-events-auto animate-fade-in"
                onClick={() => {
                  const top = confirms[0]
                  if (top) dismiss(top.id)
                }}
              >
                <div
                  className="relative w-full max-w-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  {confirms.map((t, index) => {
                    const isTop = index === 0
                    return (
                      <div
                        key={t.id}
                        className={`absolute inset-x-0 top-0 flex flex-col items-center gap-2.5 rounded-xl border border-slate-100 bg-white px-5 py-3 shadow-lg transition-transform ${
                          isTop ? 'relative' : 'pointer-events-none'
                        }`}
                        style={{
                          transform: `translate(${index * 6}px, ${index * 6}px) scale(${Math.max(0.94, 1 - index * 0.03)})`,
                          zIndex: confirms.length - index,
                          opacity: index > 2 ? 0.55 : 1 - index * 0.12,
                        }}
                      >
                        <span
                          className="block max-w-[calc(100vw-3rem)] truncate text-sm font-bold text-slate-800 text-center whitespace-nowrap"
                          title={t.message}
                        >
                          {t.message}
                        </span>
                        {isTop ? (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => { t.onConfirm(); dismiss(t.id) }}
                              className={`rounded-lg px-4 py-1.5 text-xs font-black text-white cursor-pointer transition-colors ${
                                t.variant === 'danger'
                                  ? 'bg-red-500 hover:bg-red-600'
                                  : 'bg-[#1E3A8A] hover:bg-[#172f72]'
                              }`}
                            >
                              {t.confirmLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => dismiss(t.id)}
                              className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-black text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
                            >
                              {t.cancelLabel}
                            </button>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}

            {messages.length > 0 ? (
              <div className="pointer-events-none fixed bottom-24 left-1/2 z-[130] -translate-x-1/2">
                <div
                  className="relative w-max max-w-[calc(100vw-2rem)]"
                  style={{ height: 48 + Math.max(0, messages.length - 1) * 8 }}
                >
                  {messages.map((t, index) => (
                    <div
                      key={t.id}
                      title={t.message}
                      className="absolute bottom-0 left-1/2 max-w-[calc(100vw-2rem)] -translate-x-1/2 rounded-xl border border-slate-100 bg-white px-5 py-3 text-center text-sm font-bold text-slate-800 shadow-lg whitespace-nowrap transition-transform"
                      style={{
                        transform: `translate(-50%, ${index * -8}px) scale(${Math.max(0.94, 1 - index * 0.03)})`,
                        zIndex: messages.length - index,
                        opacity: index > 2 ? 0.55 : 1 - index * 0.12,
                      }}
                    >
                      <span className="block truncate max-w-[calc(100vw-3rem)]">{t.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </>,
          document.body,
        )
      : null

  return (
    <ToastContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {toastLayer}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

export default ToastProvider
