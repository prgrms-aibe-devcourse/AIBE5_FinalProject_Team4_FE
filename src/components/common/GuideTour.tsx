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

    useEffect(() => {
        const el = steps[currentStep].targetRef.current
        if (el) {
            setTargetRect(el.getBoundingClientRect())
        }
    }, [currentStep, steps])

    return createPortal(
        <div className="fixed inset-0 z-[150]">
            {/* Layer 2: spotlight */}
            {targetRect && (
                <div
                    style={{
                        position: 'fixed',
                        top: targetRect.top - 4,
                        left: targetRect.left - 4,
                        width: targetRect.width + 8,
                        height: targetRect.height + 8,
                        borderRadius: '8px',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                        zIndex: 151,
                    }}
                />
            )}

            {/* Layer 3: 말풍선 + 버튼 */}
            {targetRect && (
                <div
                    style={{
                        position: 'fixed',
                        top: Math.min(targetRect.bottom + 12, window.innerHeight - 140),
                        left: Math.max(16, Math.min(targetRect.left, window.innerWidth - 296)),
                        maxWidth: '280px',
                        zIndex: 152,
                    }}
                    className="rounded-2xl bg-white p-4 shadow-xl"
                >
                    {/* 스텝 표시 */}
                    <p className="text-[10px] font-bold text-slate-400 mb-2">
                        {currentStep + 1} / {steps.length}
                    </p>

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
