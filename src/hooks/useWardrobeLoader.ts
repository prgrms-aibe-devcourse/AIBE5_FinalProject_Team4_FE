import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWardrobeGarments } from "@/api/wardrobe";
import type { Garment } from "@/types/index";

interface UseWardrobeLoaderOptions {
  userId: number | null;
  enabled: boolean;
  selectedGarment: Garment | null;
  setClothes: React.Dispatch<React.SetStateAction<Garment[]>>;
  setSelectedGarment: (garment: Garment | null) => void;
}

export function useWardrobeLoader({
  userId,
  enabled,
  selectedGarment,
  setClothes,
  setSelectedGarment,
}: UseWardrobeLoaderOptions) {
  const [wardrobeLoading, setWardrobeLoading] = useState(false);
  const loadedUserIdRef = useRef<number | null>(null);

  const loadWardrobe = useCallback(async () => {
    if (userId == null) return;

    setWardrobeLoading(true);
    try {
      const { garments } = await fetchWardrobeGarments(userId);
      setClothes(garments);

      const preserved = garments.find((item) => item.id === selectedGarment?.id);
      if (loadedUserIdRef.current !== userId) {
        setSelectedGarment(preserved ?? garments[0] ?? null);
        loadedUserIdRef.current = userId;
      } else if (preserved) {
        setSelectedGarment(preserved);
      } else {
        setSelectedGarment(garments[0] ?? null);
      }
    } catch {
      if (loadedUserIdRef.current !== userId) {
        setClothes([]);
        setSelectedGarment(null);
        loadedUserIdRef.current = userId;
      }
    } finally {
      setWardrobeLoading(false);
    }
  }, [selectedGarment?.id, setClothes, setSelectedGarment, userId]);

  useEffect(() => {
    if (!enabled || userId == null) {
      loadedUserIdRef.current = null;
      return;
    }

    void loadWardrobe();
  }, [enabled, loadWardrobe, userId]);

  return {
    wardrobeLoading,
    refreshWardrobe: loadWardrobe,
  };
}
