import { useState, useEffect } from 'react';
import { UserProfile, Recommendation } from "@/types/index";

export function useAiRecommendation(isLoggedIn: boolean, profile: UserProfile) {
    // 상태
    const [aiCuration, setAiCuration] = useState<{
        comment: string;
        items: Recommendation[];
        loading: boolean;
    }>({
        comment: "감각이가 맞춤 도우미 정보를 구성 중입니다...",
        items: [],
        loading: false
    });

    // 함수
    const fetchAiRecommendations = async () => {
        setAiCuration((prev) => ({ ...prev, loading: true }));
        try {
            const response = await fetch("/api/recommend", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nickname: profile.nickname,
                    gender: profile.gender,
                    styles: profile.styles,
                    weatherCondition: "Seoul: 🌧️ Chilly & Rain today. Keep stylish wraps!"
                })
            });
            const data = await response.json();
            if (data) {
                setAiCuration({
                    comment: data.gamyagiComment || "비오는 우울한 날일수록 테크니컬한 레이어드가 필수죠!",
                    items: data.recommendations || [],
                    loading: false
                });
            }
        } catch (err) {
            console.error("Failed to load Dynamic recommend curation:", err);
            // fallback
            setAiCuration({
                comment: "삐리빅! 네트워크가 고요하지만 제가 준비한 기상대 픽 감각 레이블을 제안합니다! 따뜻한 울 자켓과 와이드 실루엣으로 유니크한 감성을 극대화하세요.",
                items: [
                    {
                        id: "rec1",
                        name: "테크니컬 레이어드 방수 쉘 재킷",
                        category: "Outer",
                        color: "Matt Black",
                        matchRate: 98,
                        imageName: "outer_jacket",
                        styleTag: "Gorpcore",
                        price: "128,000"
                    },
                    {
                        id: "rec2",
                        name: "아나토믹 드레이프 루즈 와이드 데님",
                        category: "Bottom",
                        color: "인디고 블루",
                        matchRate: 95,
                        imageName: "bottom_jeans",
                        styleTag: "Casual",
                        price: "69,000"
                    },
                    {
                        id: "rec3",
                        name: "고정밀 크루넥 입체 코튼 티셔츠",
                        category: "Top",
                        color: "화이트",
                        matchRate: 88,
                        imageName: "top_tee",
                        styleTag: "Minimal",
                        price: "39,000"
                    }
                ],
                loading: false
            });
        }
    };


    // useEffect
    useEffect(() => {
        if (isLoggedIn && profile.onboarded) {
            fetchAiRecommendations();
        }
    }, [isLoggedIn, profile.onboarded]);

    return { aiCuration };
}
