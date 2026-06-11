import React, { useEffect, useState } from 'react'
import api from '@/api'

type LogEntry = {
  id: string
  method: string
  url: string
  status?: number | null
  type: 'request' | 'response' | 'error'
  data?: any
  time: string
}

export default function DevApiLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const reqId = api.interceptors.request.use((config) => {
      const entry: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        method: (config.method ?? 'get').toUpperCase(),
        url: config.url ?? '',
        type: 'request',
        data: config.data ?? config.params ?? null,
        status: null,
        time: new Date().toLocaleTimeString(),
      }
      setLogs((s) => [entry, ...s].slice(0, 30))
      // attach entry id to config for response correlation
      // @ts-ignore
      config.__devLogId = entry.id
      return config
    })

    const resId = api.interceptors.response.use(
      (response) => {
        // @ts-ignore
        const id = response.config?.__devLogId
        const entry: LogEntry = {
          id: id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          method: (response.config.method ?? 'get').toUpperCase(),
          url: response.config.url ?? '',
          type: 'response',
          status: response.status,
          data: response.data,
          time: new Date().toLocaleTimeString(),
        }
        setLogs((s) => [entry, ...s.filter((l) => l.id !== entry.id)].slice(0, 30))
        return response
      },
      (error) => {
        const config = error.config ?? {}
        // @ts-ignore
        const id = config.__devLogId
        const entry: LogEntry = {
          id: id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          method: (config.method ?? 'get').toUpperCase(),
          url: config.url ?? error?.response?.config?.url ?? '',
          type: 'error',
          status: error?.response?.status ?? null,
          data: error?.response?.data ?? { message: error.message },
          time: new Date().toLocaleTimeString(),
        }
        setLogs((s) => [entry, ...s.filter((l) => l.id !== entry.id)].slice(0, 30))
        return Promise.reject(error)
      },
    )

    return () => {
      api.interceptors.request.eject(reqId)
      api.interceptors.response.eject(resId)
    }
  }, [])

  if (!import.meta.env.DEV) return null

  return (
    <div className={`fixed right-4 bottom-4 z-50 w-80 pointer-events-auto ${open ? '' : 'opacity-90'}`}>
      <div className="bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
        <div className="px-3 py-2 flex items-center justify-between">
          <strong className="text-xs font-black">API Log</strong>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setLogs([])} className="text-[10px] text-slate-500">Clear</button>
            <button type="button" onClick={() => setOpen((v) => !v)} className="text-[10px] text-slate-500">{open ? 'Close' : 'Open'}</button>
          </div>
        </div>
        {open && (
          <div className="max-h-72 overflow-auto text-xs">
            <ul>
              {logs.map((l) => (
                <li key={l.id} className="px-3 py-2 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate">
                      <span className="font-black mr-2">{l.method}</span>
                      <span className="text-slate-600">{l.url}</span>
                    </div>
                    <div className="ml-2 shrink-0 text-right">
                      <div className="text-[11px] font-black">{l.type === 'response' ? l.status : l.type}</div>
                      <div className="text-[10px] text-slate-400">{l.time}</div>
                    </div>
                  </div>
                  <details className="mt-2 text-[11px] text-slate-600">
                    <summary className="cursor-pointer">Payload / Response</summary>
                    <pre className="whitespace-pre-wrap break-words text-[11px] mt-2">{JSON.stringify(l.data, null, 2)}</pre>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
