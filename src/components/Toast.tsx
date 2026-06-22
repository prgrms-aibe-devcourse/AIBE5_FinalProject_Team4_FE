/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ToastType = 'success' | 'error' | 'info'
type ToastEntry =
  | { id: string; kind: 'message'; type: ToastType; message: string }
  | { id: string; kind: 'confirm'; message: string; onConfirm: () => void }

interface ToastContextValue {
  showToast: (type: ToastType, message: string) => void
  showConfirm: (message: string, onConfirm: () => void) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((t) => [{ id, kind: 'message', type, message }, ...t])
    setTimeout(() => dismiss(id), 3500)
  }, [dismiss])

  const showConfirm = useCallback((message: string, onConfirm: () => void) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((t) => [{ id, kind: 'confirm', message, onConfirm }, ...t])
    // 자동 닫힘 없음 — 사용자가 직접 선택
  }, [])

  const toastLayer =
    mounted && toasts.length > 0
      ? createPortal(
          <div className="pointer-events-none fixed bottom-24 left-1/2 z-[130] flex -translate-x-1/2 flex-col items-center gap-2">
            {toasts.map((t) =>
              t.kind === 'confirm' ? (
                <div
                  key={t.id}
                  className="pointer-events-auto flex flex-col items-center gap-2.5 rounded-xl bg-white px-5 py-3 shadow-lg border border-slate-100"
                >
                  <span className="text-sm font-bold text-slate-800 whitespace-nowrap">{t.message}</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { t.onConfirm(); dismiss(t.id) }}
                      className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-black text-white cursor-pointer hover:bg-red-600 transition-colors"
                    >
                      삭제
                    </button>
                    <button
                      type="button"
                      onClick={() => dismiss(t.id)}
                      className="rounded-lg border border-slate-200 bg-slate-100 px-4 py-1.5 text-xs font-black text-slate-600 cursor-pointer hover:bg-slate-200 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={t.id}
                  className={`pointer-events-auto max-w-[min(20rem,calc(100vw-2rem))] rounded-xl px-4 py-2.5 text-center text-sm font-bold shadow-lg ${
                    t.type === 'success'
                      ? 'bg-emerald-600 text-white'
                      : t.type === 'error'
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-800 text-white'
                  }`}
                >
                  {t.message}
                </div>
              ),
            )}
          </div>,
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
