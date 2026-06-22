interface IntroPageProps {
    onStart: () => void
}

const FEATURES = [
    {
        emoji: "✨",
        title: "AI 코디 추천",
        description: "오늘의 날씨와 내 옷장을 분석해 딱 맞는 코디를 추천해드려요",
    },
    {
        emoji: "👕",
        title: "스마트 옷장",
        description: "사진 한 장으로 옷을 등록하고 AI가 카테고리와 색상을 자동으로 분석해요",
    },
    {
        emoji: "📸",
        title: "룩피드",
        description: "다른 사람들의 실제 코디에서 스타일 힌트를 얻고 내 코디도 공유해보세요",
    },
    {
        emoji: "🤖",
        title: "AI MD",
        description: "TPO·드레스코드·날씨별 코디를 AI 패션 디렉터에게 직접 물어볼 수 있어요",
    },
]

export default function IntroPage({ onStart }: IntroPageProps) {
    return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
            {/* 상단 헤더 */}
            <div className="flex flex-col items-center pt-16 pb-8 px-6">
                <div className="w-16 h-16 rounded-[20px] bg-[#1E3A8A] flex items-center justify-center shadow-lg mb-5">
                    <span className="text-3xl">👔</span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">옷장난감</h1>
                <p className="mt-2 text-sm font-medium text-slate-400 text-center leading-relaxed">
                    AI가 내 옷장을 분석해 매일 딱 맞는 코디를 추천해드려요
                </p>
            </div>

            {/* 기능 카드 목록 */}
            <div className="flex-1 px-5 space-y-3">
                {FEATURES.map((feature) => (
                    <div
                        key={feature.title}
                        className="bg-white rounded-[20px] px-5 py-4 shadow-sm border border-slate-100 flex items-start gap-4"
                    >
                        <div className="w-11 h-11 rounded-2xl bg-[#EEF2FF] flex items-center justify-center shrink-0">
                            <span className="text-xl">{feature.emoji}</span>
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-slate-900">{feature.title}</p>
                            <p className="mt-0.5 text-xs font-medium text-slate-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* 하단 CTA */}
            <div className="px-5 py-8">
                <button
                    type="button"
                    onClick={onStart}
                    className="w-full h-14 rounded-[16px] bg-[#1E3A8A] text-white text-base font-black shadow-sm hover:bg-[#172f72] active:scale-[0.98] transition-all"
                >
                    내 스타일 설정하러 가기
                </button>
                <p className="mt-3 text-center text-xs text-slate-400 font-medium">
                    기본 정보를 입력하면 더 정확한 추천을 받을 수 있어요
                </p>
            </div>
        </div>
    )
}
