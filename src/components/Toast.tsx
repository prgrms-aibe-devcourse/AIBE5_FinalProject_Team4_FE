/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type ToastType = 'success' | 'error' | 'info'
type ToastEntry = { id: string; type: ToastType; message: string }

const ToastContext = createContext<{ showToast: (type: ToastType, message: string) => void } | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const showToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    setToasts((t) => [{ id, type, message }, ...t])
    // auto dismiss
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])

  const toastLayer =
    mounted && toasts.length > 0
      ? createPortal(
          <div className="pointer-events-none fixed bottom-24 left-1/2 z-[130] flex -translate-x-1/2 flex-col items-center gap-2">
            {toasts.map((t) => (
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
            ))}
          </div>,
          document.body,
        )
      : null

  return (
    <ToastContext.Provider value={{ showToast }}>
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
