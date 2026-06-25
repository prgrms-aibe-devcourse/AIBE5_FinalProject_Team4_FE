import { useState, useEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'

interface GuideTourStep {
    targetRef: RefObject<HTMLElement>
    message: string
}

interface GuideTourProps {
    steps: GuideTourStep[]
    onComplete: () => void
}

export default function GuideTour({ steps, onComplete }: GuideTourProps) {
    const [currentStep, setCurrentStep] = useState(0)
    const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
    const [visible, setVisible] = useState(false)

    // 스텝 변경 시 해당 요소로 스크롤 후 rect 캡처
    useEffect(() => {
        const el = steps[currentStep].targetRef.current
        if (!el) return

        // 'nearest': 이미 화면에 보이면 스크롤 안 함, 벗어났을 때만 최소한으로 스크롤
        el.scrollIntoView({ behavior: 'instant', block: 'nearest' })

        const id = requestAnimationFrame(() => {
            setTargetRect(el.getBoundingClientRect())
        })
        return () => cancelAnimationFrame(id)
    }, [currentStep, steps])

    // 마운트 후 fade-in
    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true))
        return () => cancelAnimationFrame(id)
    }, [])

    const cardTop = targetRect
        ? (window.innerHeight - targetRect.bottom >= 178
            ? targetRect.bottom + 18
            : Math.max(8, targetRect.top - 160 - 18))
        : 0


    return createPortal(
        <div
            className="fixed inset-0 z-[150]"
            style={{
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.3s ease',
            }}
        >
            {/* 스포트라이트 */}
            {targetRect && (
                <div
                    style={{
                        position: 'fixed',
                        top: targetRect.top - 6,
                        left: targetRect.left - 6,
                        width: targetRect.width + 12,
                        height: targetRect.height + 12,
                        borderRadius: '14px',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)',
                        outline: '2px solid rgba(255,255,255,0.2)',
                        outlineOffset: '2px',
                        zIndex: 151,
                        transition:
                            'top 0.38s cubic-bezier(0.4,0,0.2,1),' +
                            'left 0.38s cubic-bezier(0.4,0,0.2,1),' +
                            'width 0.38s cubic-bezier(0.4,0,0.2,1),' +
                            'height 0.38s cubic-bezier(0.4,0,0.2,1)',
                    }}
                />
            )}

            {/* 말풍선 카드 */}
            {targetRect && (
                <div
                    style={{
                        position: 'fixed',
                        top: cardTop,
                        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 300)),
                        maxWidth: '284px',
                        zIndex: 152,
                        transition:
                            'top 0.38s cubic-bezier(0.4,0,0.2,1),' +
                            'left 0.38s cubic-bezier(0.4,0,0.2,1)',
                    }}
                    className="rounded-2xl bg-white p-4 shadow-2xl"
                >
                    {/* 스텝 도트 인디케이터 */}
                    <div className="flex items-center gap-1.5 mb-3">
                        {steps.map((_, i) => (
                            <span
                                key={i}
                                className="block h-1.5 rounded-full"
                                style={{
                                    width: i === currentStep ? '20px' : '6px',
                                    backgroundColor: i === currentStep ? '#1E3A8A' : '#CBD5E1',
                                    transition: 'width 0.3s ease, background-color 0.3s ease',
                                }}
                            />
                        ))}
                    </div>

                    {/* 메시지 */}
                    <p className="text-sm font-bold text-slate-800 mb-4 leading-relaxed">
                        {steps[currentStep].message}
                    </p>

                    {/* 버튼 */}
                    <div className="flex justify-between items-center">
                        <button
                            onClick={onComplete}
                            className="text-xs text-slate-400 hover:text-slate-600 transition"
                        >
                            건너뛰기
                        </button>
                        <div className="flex gap-2">
                            {currentStep > 0 && (
                                <button
                                    onClick={() => setCurrentStep(s => s - 1)}
                                    className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
                                >
                                    이전
                                </button>
                            )}
                            <button
                                onClick={() => {
                                    if (currentStep < steps.length - 1) {
                                        setCurrentStep(s => s + 1)
                                    } else {
                                        onComplete()
                                    }
                                }}
                                className="text-xs px-3 py-1.5 rounded-lg bg-[#1E3A8A] text-white font-bold hover:bg-[#172f72] transition"
                            >
                                {currentStep < steps.length - 1 ? '다음' : '완료'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>,
        document.body
    )
}
