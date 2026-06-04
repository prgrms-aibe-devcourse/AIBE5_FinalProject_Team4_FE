import React, { useState } from "react";
import { Garment } from "@/types/index";
import { INITIAL_GARMENTS } from "@/data/initialGarments";

export function useCloset() {
    // 상태
    // Clothes dynamic management
    const [clothes, setClothes] = useState<Garment[]>(INITIAL_GARMENTS);

    // Selection for active garment inspection
    const [selectedGarment, setSelectedGarment] = useState<Garment | null>(INITIAL_GARMENTS[0]);

    // New Clothing Registration Modal flow items
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [uploadType, setUploadType] = useState<"receipt" | "garment" | null>(null);

    // Clothing analysis loader state
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analyzedDraft, setAnalyzedDraft] = useState<{
        id: string;
        name: string;
        category: "Top" | "Bottom" | "Outer" | "Shoes";
        color: string;
        style: string;
        fitType: string;
        fabricMaterial: string;
        anatomicalFitGuide?: any;
        imageBase64?: string;
    } | null>(null);

    // Upload placeholder trigger state
    const [selectedLocalImg, setSelectedLocalImg] = useState<string | null>(null);

    // 함수
    // Simulate file drops & camera simulation
    const triggerImageUpload = async (mockType: "receipt" | "garment_tee") => {
        setIsAnalyzing(true);
        const sampleImg =
            mockType === "receipt"
                ? "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?auto=format&fit=crop&q=80&w=600"
                : "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600";

        setSelectedLocalImg(sampleImg);

        try {
            const response = await fetch("/api/analyze-garment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: "dummy_base64_for_gemini_vision",
                    isReceipt: mockType === "receipt"
                })
            });
            const data = await response.json();
            setAnalyzedDraft({
                id: "draft_" + Date.now(),
                name: mockType === "receipt" ? "영수증 추출 명세 아이템" : "카메라 캡처 베이직 반소매 티셔츠",
                category: data.category || "Top",
                color: data.color || "Pure White",
                style: data.style || "Minimal",
                fitType: data.fitType || "Semi-Oversized",
                fabricMaterial: data.fabricMaterial || "코튼 100%",
                anatomicalFitGuide: data.anatomicalFitGuide || {},
                imageBase64: sampleImg
            });
        } catch (e) {
            console.error(e);
            // Fallback
            setAnalyzedDraft({
                id: "draft_" + Date.now(),
                name: mockType === "receipt" ? "영수증 추출 명세 아이템" : "카메라 캡처 베이직 반소매 티셔츠",
                category: "Top",
                color: "Pure White",
                style: "Minimal",
                fitType: "Semi-Oversized",
                fabricMaterial: "헤비 웨이트 프렌치 테리 코튼 100%",
                imageBase64: sampleImg,
                anatomicalFitGuide: {
                    shoulderPrecision: 94,
                    chestTightness: 45,
                    muscularStressLevel: "어깨 세모근 곡선에 여유로운 오버핏 실루엣 제공",
                    skeletonDrapeFactor: "칼라뼈(Clavicle) 돌출도에 적합하도록 고안된 라운드넥 구조",
                    recommendedBodyType: "어깨너비가 넓거나 가스근육이 발달한 장사 체형"
                }
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAddWishlistItem = (item: { name: string; category: "Top" | "Bottom" | "Outer" | "Shoes"; color: string; style: string; fabricMaterial: string }) => {
        const newGarment: Garment = {
            id: "wish_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
            name: item.name,
            category: item.category,
            color: item.color,
            style: item.style,
            fitType: "Standard Silhouette",
            fabricMaterial: item.fabricMaterial,
            thumbnailUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600",
            isFavorite: false,
            isWishlist: true
        };
        setClothes((prev) => [newGarment, ...prev]);
    };


    const toggleFavorite = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setClothes((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isFavorite: !c.isFavorite } : c))
        );
    };

    const moveToOwnedCloset = (id: string) => {
        setClothes((prev) =>
            prev.map((c) => (c.id === id ? { ...c, isWishlist: false } : c))
        );
    };

    const handleSaveToCloset = () => {
        if (!analyzedDraft) return;

        const newGarment: Garment = {
            id: analyzedDraft.id || "g_" + Date.now(),
            name: analyzedDraft.name,
            category: analyzedDraft.category,
            color: analyzedDraft.color,
            style: analyzedDraft.style,
            fitType: analyzedDraft.fitType,
            fabricMaterial: analyzedDraft.fabricMaterial,
            thumbnailUrl: analyzedDraft.imageBase64 || "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600",
            isFavorite: false,
            isWishlist: false,
            anatomicalFit: analyzedDraft.anatomicalFitGuide
        };

        setClothes((prev) => [newGarment, ...prev]);
        setSelectedGarment(newGarment);
        setAnalyzedDraft(null);
        setUploadType(null);
        setIsUploadModalOpen(false);
        setSelectedLocalImg(null);
        alert(`🎉 "${newGarment.name}" 의상을 옷장에 신규 등록 완료 하였습니다!`);
    };

    const openUploadModal = () => {
        setUploadType(null);
        setIsUploadModalOpen(true);
    };

    return {
        clothes, setClothes,
        selectedGarment, setSelectedGarment,
        isUploadModalOpen, setIsUploadModalOpen,
        uploadType, setUploadType,
        isAnalyzing,
        analyzedDraft, setAnalyzedDraft,
        selectedLocalImg, setSelectedLocalImg,
        triggerImageUpload,
        handleAddWishlistItem,
        toggleFavorite,
        moveToOwnedCloset,
        handleSaveToCloset,
        openUploadModal,
    };
}