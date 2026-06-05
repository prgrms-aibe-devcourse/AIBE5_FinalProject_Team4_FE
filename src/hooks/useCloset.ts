import React, { useState } from "react";
import { Garment } from "@/types/index";
import { INITIAL_GARMENTS } from "@/data/initialGarments";
import {
    isItemTypeInCategory,
    isUiCategory,
    getItemTypeLabel,
    resolveItemTypeForCategory,
    resolveUiCategory,
} from "@/data/categoryItemTypes";
import {
    getGarmentColorLabel,
    isGarmentColorCode,
    resolveGarmentColorCode,
} from "@/data/garmentColors";
import {
    getGarmentStyleLabel,
    isGarmentStyleCode,
    resolveGarmentStyleCode,
} from "@/data/garmentStyles";

type GarmentDraftRequiredFields = {
    name: string;
    category: "Top" | "Bottom" | "Outer" | "Shoes";
    itemType: string;
    mainColor: string;
    mainStyle: string;
    fabricMaterial: string;
};

function getGarmentDraftValidationError(
    draft: GarmentDraftRequiredFields,
): string | null {
    if (!draft.name.trim()) return "의상명을 입력해 주세요.";
    if (!isUiCategory(draft.category)) return "카테고리를 선택해 주세요.";
    if (!draft.itemType.trim()) return "세부 카테고리를 선택해 주세요.";
    if (!isItemTypeInCategory(draft.category, draft.itemType)) {
        return "세부 카테고리를 선택해 주세요.";
    }
    if (!isGarmentColorCode(draft.mainColor.trim())) {
        return "메인 컬러를 선택해 주세요.";
    }
    if (!isGarmentStyleCode(draft.mainStyle.trim())) {
        return "메인 스타일을 선택해 주세요.";
    }
    if (!draft.fabricMaterial.trim()) return "소재 물성 정보를 입력해 주세요.";
    return null;
}

export function useCloset() {
    // 상태
    // Clothes dynamic management
    const [clothes, setClothes] = useState<Garment[]>(INITIAL_GARMENTS);

    // Selection for active garment inspection
    const [selectedGarment, setSelectedGarment] = useState<Garment | null>(INITIAL_GARMENTS[0]);

    // 옷 등록: 방식 선택 모달 → 등록 파이프라인 모달
    const [isMethodSelectOpen, setIsMethodSelectOpen] = useState(false);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
    const [uploadType, setUploadType] = useState<"receipt" | "garment" | null>(null);

    // Clothing analysis loader state
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analyzedDraft, setAnalyzedDraft] = useState<{
        id: string;
        name: string;
        category: "Top" | "Bottom" | "Outer" | "Shoes";
        itemType: string;
        mainColor: string;
        secondaryColors: string[];
        mainStyle: string;
        secondaryStyles: string[];
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

            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }

            const data = await response.json();
            const category = resolveUiCategory(data.category);
            setAnalyzedDraft({
                id: "draft_" + Date.now(),
                name: mockType === "receipt" ? "영수증 추출 명세 아이템" : "카메라 캡처 베이직 반소매 티셔츠",
                category,
                itemType: resolveItemTypeForCategory(category, data.itemType),
                mainColor: resolveGarmentColorCode(
                    data.primaryColor ?? data.color,
                ),
                secondaryColors: [],
                mainStyle: resolveGarmentStyleCode(data.style),
                secondaryStyles: [],
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
                itemType: "SHORT_SLEEVE",
                mainColor: "WHITE",
                secondaryColors: [],
                mainStyle: "MINIMAL",
                secondaryStyles: [],
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

    const handleSaveToCloset = (): boolean => {
        if (!analyzedDraft) return false;

        const validationError = getGarmentDraftValidationError(analyzedDraft);
        if (validationError) {
            alert(validationError);
            return false;
        }

        const mainColorName = getGarmentColorLabel(analyzedDraft.mainColor);
        const secondaryColorNames = analyzedDraft.secondaryColors
            .map(getGarmentColorLabel)
            .join(" · ");
        const colorLabel = secondaryColorNames
            ? `${mainColorName} · ${secondaryColorNames}`
            : mainColorName;

        const mainStyleName = getGarmentStyleLabel(analyzedDraft.mainStyle);
        const secondaryStyleNames = analyzedDraft.secondaryStyles
            .map(getGarmentStyleLabel)
            .join(" · ");
        const styleLabel = secondaryStyleNames
            ? `${mainStyleName} · ${secondaryStyleNames}`
            : mainStyleName;

        const newGarment: Garment = {
            id: analyzedDraft.id,
            name: analyzedDraft.name,
            category: analyzedDraft.category,
            color: colorLabel,
            style: styleLabel,
            fitType: analyzedDraft.itemType
                ? getItemTypeLabel(analyzedDraft.category, analyzedDraft.itemType)
                : "—",
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
        return true;
    };

    const openGarmentRegister = () => {
        setUploadType(null);
        setAnalyzedDraft(null);
        setSelectedLocalImg(null);
        setIsMethodSelectOpen(true);
    };

    const closeGarmentRegisterMethod = () => {
        setIsMethodSelectOpen(false);
    };

    const selectRegisterMethod = (type: "receipt" | "garment") => {
        setIsMethodSelectOpen(false);
        setUploadType(type);
        setIsUploadModalOpen(true);
        void triggerImageUpload(type === "receipt" ? "receipt" : "garment_tee");
    };

    const backToRegisterMethodSelect = () => {
        setIsUploadModalOpen(false);
        setUploadType(null);
        setAnalyzedDraft(null);
        setSelectedLocalImg(null);
        setIsAnalyzing(false);
        setIsMethodSelectOpen(true);
    };

    /** @deprecated openGarmentRegister 사용 */
    const openUploadModal = openGarmentRegister;

    return {
        clothes, setClothes,
        selectedGarment, setSelectedGarment,
        isMethodSelectOpen,
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
        openGarmentRegister,
        closeGarmentRegisterMethod,
        selectRegisterMethod,
        backToRegisterMethodSelect,
        openUploadModal,
    };
}