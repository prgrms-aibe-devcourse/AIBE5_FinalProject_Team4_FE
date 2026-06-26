import { useState, useEffect, type RefObject } from 'react'
import { createPortal } from 'react-dom'

// 고정 레이아웃 상수 (App.tsx pt-24 / nav h-16 기준)
const HEADER_HEIGHT = 96  // fixed top header 아래 안전선 (pt-24 = 96px)
const NAV_HEIGHT    = 64  // fixed bottom nav 높이 (h-16 = 64px)

// 스포트라이트가 너무 큰 요소를 통째로 감싸지 않도록 높이 상한
// (예: recommendationListRef, gridRef 등 화면을 가득 채우는 섹션 대응)
const MAX_SPOTLIGHT_HEIGHT = 280

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

    useEffect(() => {
        const el = steps[currentStep].targetRef.current
        if (!el) return

        el.scrollIntoView({ behavior: 'instant', block: 'nearest' })

        const id = requestAnimationFrame(() => {
            const rect = el.getBoundingClientRect()
            const viewport = document.getElementById('app-viewport')

            // ① 요소 하단이 nav bar 뒤에 가려진 경우 → 위로 스크롤
            const safeBottom = window.innerHeight - NAV_HEIGHT
            if (rect.bottom > safeBottom && viewport) {
                viewport.scrollTop += rect.bottom - safeBottom + 12
            }

            // ② 요소 상단이 header 뒤에 가려진 경우 → 아래로 스크롤
            if (rect.top < HEADER_HEIGHT && viewport) {
                viewport.scrollTop -= HEADER_HEIGHT - rect.top + 12
            }

            setTargetRect(el.getBoundingClientRect())
        })
        return () => cancelAnimationFrame(id)
    }, [currentStep, steps])

    useEffect(() => {
        const id = requestAnimationFrame(() => setVisible(true))
        return () => cancelAnimationFrame(id)
    }, [])

    // ── 스포트라이트 영역 계산 ────────────────────────────────────────
    const safeTop    = HEADER_HEIGHT
    const safeBottom = window.innerHeight - NAV_HEIGHT

    // 상하 안전선 안으로 클리핑
    const rawTop    = targetRect ? targetRect.top    - 6 : 0
    const rawBottom = targetRect ? targetRect.bottom + 6 : 0
    const spotTop    = Math.max(rawTop, safeTop)
    const spotBottom = Math.min(rawBottom, safeBottom)

    // 높이 상한 적용 (아래쪽을 잘라냄 — 위가 더 중요한 영역)
    const rawHeight  = Math.max(0, spotBottom - spotTop)
    const spotHeight = Math.min(rawHeight, MAX_SPOTLIGHT_HEIGHT)

    const spotLeft  = targetRect ? targetRect.left - 6 : 0
    const spotWidth = targetRect ? targetRect.width + 12 : 0

    // ── 말풍선 위치 계산 ─────────────────────────────────────────────
    const CARD_HEIGHT = 160
    const spotEffectiveBottom = spotTop + spotHeight   // 실제 스포트라이트 하단
    const spaceBelow = safeBottom - spotEffectiveBottom
    const cardTop = targetRect
        ? (spaceBelow >= CARD_HEIGHT + 18
            ? spotEffectiveBottom + 18                          // 아래 공간 충분 → 아래 표시
            : Math.max(safeTop + 8, spotTop - CARD_HEIGHT - 18)) // 공간 부족 → 위 표시
        : 0

    return createPortal(
        <div
            className="fixed inset-0 z-[150]"
            style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.3s ease' }}
        >
            {/* 스포트라이트 */}
            {targetRect && (
                <div
                    style={{
                        position: 'fixed',
                        top: spotTop,
                        left: spotLeft,
                        width: spotWidth,
                        height: spotHeight,
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
                        left: Math.max(16, Math.min(spotLeft, window.innerWidth - 300)),
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
