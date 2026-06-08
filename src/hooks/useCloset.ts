import { useState } from "react";
import { Garment } from "@/types/index";
import { INITIAL_GARMENTS } from "@/data/initialGarments";

export function useCloset() {
    const [clothes, setClothes] = useState<Garment[]>(INITIAL_GARMENTS);
    const [selectedGarment, setSelectedGarment] = useState<Garment | null>(INITIAL_GARMENTS[0]);
    const [isMethodSelectOpen, setIsMethodSelectOpen] = useState(false);

    const handleAddWishlistItem = (item: {
        name: string;
        category: "Top" | "Bottom" | "Outer" | "Shoes";
        color: string;
        style: string;
        fabricMaterial: string;
    }) => {
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

    const openGarmentRegister = () => {
        setIsMethodSelectOpen(true);
    };

    const closeGarmentRegisterMethod = () => {
        setIsMethodSelectOpen(false);
    };

    /** @deprecated openGarmentRegister 사용 */
    const openUploadModal = openGarmentRegister;

    return {
        clothes,
        setClothes,
        selectedGarment,
        setSelectedGarment,
        isMethodSelectOpen,
        handleAddWishlistItem,
        toggleFavorite,
        moveToOwnedCloset,
        openGarmentRegister,
        closeGarmentRegisterMethod,
        openUploadModal,
    };
}
