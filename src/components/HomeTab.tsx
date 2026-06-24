import { Heart } from '@/components/icons'
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAuthenticatedImageObjectUrl } from '@/utils/authenticatedImageUrl';
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import GarmentPickerGridCard from "@/components/common/GarmentPickerGridCard";
import {
  fetchClothesRecommendations,
  fetchOotdRecommendations,
  fetchWardrobeRecommendations,
  DEFAULT_RECOMMENDATIONS_PER_CATEGORY,
} from "@/api/recommendations";
import { fetchWardrobeMeta } from '@/api/wardrobe'
import { fetchWeather } from '@/api/weather'
import { formatRecommendBrandLabel, getBrandLogoUrl } from '@/data/brandLogos'
import { getItemTypeLabel } from '@/data/categoryItemTypes';
import { Garment } from "@/types/index";
import { extractApiErrorMessage } from "@/utils/apiError";
import { useRecommendWishlistToggle } from "@/hooks/useRecommendWishlistToggle";
import {
  mapClothesRecommendationResponseGrouped,
  type RecommendCategoryGroup,
  type RecommendCardItem,
} from "@/utils/recommendationMapper";
import type { UserGender } from "@/utils/genderClothesFilter";
import { parseBeClothesId } from "@/utils/beClothesId";
import MatchRecommendationByCategory from "@/components/MatchRecommendationByCategory";
import { Modal, ModalBody, ModalHeader } from "@/components/common/Modal";
import { resolveClothesDisplayImageUrl } from "@/utils/clothesImageUrl";
import SimilarProductRecommendations from "@/components/SimilarProductRecommendations";
import AiMdRecommendations from "@/components/AiMdRecommendations";
import RecommendProductDetailModal from '@/components/RecommendProductDetailModal';
import OutfitDetailModal from '@/components/OutfitDetailModal';
import {fetchMyOutfitBook} from "@/api/outfits.ts";
import { getGarmentColorLabel, getGarmentColor } from '@/data/garmentColors';
import GuideTour from "@/components/common/GuideTour"

function OotdCanvas({ top, bottom, outer, shoes }: {
  top?: string; bottom?: string; outer?: string; shoes?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 400, H = 500;
    canvas.width = W;
    canvas.height = H;
    ctx.fillStyle = '#F8F8F8';
    ctx.fillRect(0, 0, W, H);

    const loadImage = async (src: string): Promise<HTMLImageElement> => {
      // 인증 필요한 URL이면 blob URL로 변환
      let url = src;
      try {
        const authUrl = await fetchAuthenticatedImageObjectUrl(src);
        if (authUrl) url = authUrl;
      } catch {
        url = src; // 실패하면 원본 URL 그대로 사용
      }
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
    };

    const cropTransparent = (img: HTMLImageElement) => {
      const offscreen = document.createElement('canvas');
      offscreen.width = img.width;
      offscreen.height = img.height;
      const offCtx = offscreen.getContext('2d')!;
      offCtx.drawImage(img, 0, 0);
      const data = offCtx.getImageData(0, 0, img.width, img.height).data;
      let minX = img.width, minY = img.height, maxX = 0, maxY = 0;
      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const alpha = data[(y * img.width + x) * 4 + 3];
          if (alpha > 10) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }
      if (maxX <= minX || maxY <= minY) return { x: 0, y: 0, w: img.width, h: img.height };
      return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    };

    const drawCropped = (
      img: HTMLImageElement,
      slotX: number, slotY: number,
      slotW: number, slotH: number,
      scaleFactor = 0.85
    ) => {
      const crop = cropTransparent(img);
      const scale = Math.min(slotW / crop.w, slotH / crop.h) * scaleFactor;
      const dw = crop.w * scale;
      const dh = crop.h * scale;
      const dx = slotX + (slotW - dw) / 2;
      const dy = slotY + (slotH - dh) / 2;
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, dx, dy, dw, dh);
    };

    (async () => {
      try {
        const hasShoes = !!shoes;
        const topH = hasShoes ? H * 0.35 : H * 0.42;
        const bottomH = hasShoes ? H * 0.5 : H * 0.7;
        const shoesH = hasShoes ? H * 0.14 : 0.14;

        if (outer) {
          const outerImg = await loadImage(outer);
          drawCropped(outerImg, 0, 0, W, topH, 0.9);

          if (top) {
            const topImg = await loadImage(top);
            const crop = cropTransparent(topImg);
            const overlayW = W * 0.32;
            const overlayH = topH * 0.5;
            const scale = Math.min(overlayW / crop.w, overlayH / crop.h) * 0.9;
            const dw = crop.w * scale;
            const dh = crop.h * scale;
            const dx = (W - dw) / 2;
            const dy = topH - dh * 0.4;
            ctx.drawImage(topImg, crop.x, crop.y, crop.w, crop.h, dx, dy, dw, dh);
          }
        } else if (top) {
          const topImg = await loadImage(top);
          drawCropped(topImg, 0, 0, W, topH, 0.88);
        }

        if (bottom) {
          const bottomImg = await loadImage(bottom);
          drawCropped(bottomImg, 0, topH, W, bottomH, 0.88);
        }

        if (shoes) {
          const shoesImg = await loadImage(shoes);
          drawCropped(shoesImg, 0, topH + bottomH, W, shoesH, 0.82);
        }

      } catch (e) {
        console.error('Canvas 합성 실패:', e);
      }
    })();

    // useEffect 반환값에 cleanup 추가
    return () => {
      if (canvas) {
        const cleanupCtx = canvas.getContext('2d')
        cleanupCtx?.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }, [top, bottom, outer, shoes]);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />;
}

interface HomeTabProps {
  clothes: Garment[];
  userId: number | null;
  gender: UserGender;
  wardrobeLoading?: boolean;
  authReady?: boolean;
  onAddWishlistItem: (item: {
    name: string;
    category: "Top" | "Bottom" | "Outer" | "Shoes";
    color: string;
    style: string;
    fabricMaterial: string;
  }) => void;
  nickname: string;
  insightGlow?: boolean;
  resetSignal?: number;
  onRefreshWardrobe?: () => void;
  onGoToCloset?: () => void;
  region?: string;
  onLoginRequired?: () => void;
  guideTourCompleted: boolean;
  onGuideTourComplete: () => void;
}

type RecommendationLabel = "style" | "similar" | "match" | "aimd";

type RecommendItem = {
  id: string;
  title: string;
  category: "Top" | "Bottom" | "Outer" | "Shoes";
  brand?: string;
  style: string;
  itemType?: string;
  color: string;
  colorHex?: string;
  price: string;
  matchRate: number;
  imageUrl: string;
  reason: string;
  isAnchor?: boolean;
  clothesId?: number | null;
  outfitId?: number | null;
  bookId?: number | null;
  top?: any;
  bottom?: any;
  outer?: any;
  shoes?: any;
  purchaseUrl?: string;
};

const labelConfig: Record<RecommendationLabel, { title: string; subtitle: string; icon: string }> = {
  style: { title: "스타일 기반 추천", subtitle: "사용자 취향 기반", icon: "\ud83c\udfaf" },
  similar: { title: "유사 상품 추천", subtitle: "보유/미보유 옷과 유사", icon: "\ud83d\udecd️" },
  match: { title: "어울리는 옷 추천", subtitle: "", icon: "\ud83d\udc55" },
  aimd: { title: "AI MD 추천", subtitle: "MD 코디 설명 제공", icon: "\ud83e\udd16" },
};

const fallbackImages = {
  Top: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600",
  Bottom: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600",
  Outer: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600",
  Shoes: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=600",
};

const STYLE_LABELS: Record<string, string> = {
  CASUAL: '캐주얼',
  STREET: '스트릿',
  FORMAL: '포멀',
  SPORTY: '스포티',
  VINTAGE: '빈티지',
  MINIMAL: '미니멀',
}


export default function HomeTab({
                                  clothes,
                                  userId,
                                  gender,
                                  wardrobeLoading = false,
                                  insightGlow: _insightGlow = false,
                                  resetSignal = 0,
                                  authReady = false,
                                  onRefreshWardrobe,
                                  onAddWishlistItem,
                                  onGoToCloset,
                                  region = '서울',
                                  onLoginRequired,
    guideTourCompleted,
    onGuideTourComplete,
                                }: HomeTabProps) {
  const [activeLabel, setActiveLabel] = useState<RecommendationLabel>("style");
  const [showStickyLabels, setShowStickyLabels] = useState(false);
  const [anchorClothesId, setAnchorClothesId] = useState<string | null>(null);
  const [matchPickerOpen, setMatchPickerOpen] = useState(false);
  const [matchOwnershipFilter, setMatchOwnershipFilter] = useState<'all' | 'owned' | 'wishlist'>('all');
  const [matchCategoryFilter, setMatchCategoryFilter] = useState<'all' | 'Top' | 'Bottom' | 'Outer' | 'Shoes'>('all');
  const [matchRecommendationGroups, setMatchRecommendationGroups] = useState<RecommendCategoryGroup[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [ootdItems, setOotdItems] = useState<RecommendItem[]>([]);
  const [currentOotdIndex, setCurrentOotdIndex] = useState(0);
  const [styleItems, setStyleItems] = useState<RecommendItem[]>([]);
  const [ootdError, setOotdError] = useState<string | null>(null);
  const [styleError, setStyleError] = useState<string | null>(null);
  const [ootdLoading, setOotdLoading] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [ootdCombinations, setOotdCombinations] = useState<Array<any>>([]);
  const [bookId, setBookId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<RecommendItem | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<any | null>(null);
  const [tourOpen, setTourOpen] = useState(!guideTourCompleted);

  const labelSectionRef = useRef<HTMLElement | null>(null);
  const recommendationListRef = useRef<HTMLElement>(null);

  const lastFetchedRegion = useRef<string | null>(null);

  const [refreshSignal, setRefreshSignal] = useState(0);

  const resetRecommendationState = useCallback(() => {
    setActiveLabel("style");
    setShowStickyLabels(false);
    setAnchorClothesId(null);
    setMatchPickerOpen(false);
    setMatchRecommendationGroups([]);
    setMatchLoading(false);
    setMatchError(null);
    setOotdItems([]);
    setStyleItems([]);
    setOotdError(null);
    setStyleError(null);
    setOotdLoading(false);
    setStyleLoading(false);
    setOotdCombinations([]);
    setBookId(null);
    setSelectedItem(null);
    setSelectedCombo(null);
  }, []);

  const handleRefreshAll = useCallback(() => {
    onRefreshWardrobe?.();
    setOotdItems([]);
    setOotdLoading(true);
    setStyleItems([]);
    setStyleLoading(true);
    setMatchRecommendationGroups([]);
    setMatchLoading(true);
    setRefreshSignal(prev => prev + 1);
  }, [onRefreshWardrobe]);

  const handleRefreshExceptStyle = useCallback(() => {
    onRefreshWardrobe?.()
    setOotdItems([])
    setOotdLoading(true)
    setMatchRecommendationGroups([])
    setMatchLoading(true)
    setRefreshSignal(prev => prev + 1)
  }, [onRefreshWardrobe])

  const handleRefreshWardrobeOnly = useCallback(() => {
    onRefreshWardrobe?.()
  }, [onRefreshWardrobe])

  const {
    isWishlisted,
    isSubmitting: isWishlistSubmitting,
    isFeedbackSubmitting,
    toggleWishlist,
    handleFeedback,
  } = useRecommendWishlistToggle({
    userId,
    existingGarments: clothes,
    onWishlistChanged: handleRefreshWardrobeOnly,
  });
  // we don't use toastMessage directly here

  // 추천 목록에서 중복된 clothesId를 제거하는 헬퍼
  const uniqueItems = useCallback(<T extends { clothesId?: number | null; id: string; top?: any; bottom?: any; outer?: any; shoes?: any }>(items: T[]): T[] => {
    const seen = new Set();
    return items.filter(item => {
      // OOTD 조합인 경우 구성 요소들의 ID 조합으로 중복 체크 가능
      if (item.top || item.bottom || item.outer || item.shoes) {
        const comboKey = [item.top?.clothesId, item.bottom?.clothesId, item.outer?.clothesId, item.shoes?.clothesId].filter(Boolean).sort().join(',');
        if (seen.has(comboKey)) return false;
        seen.add(comboKey);
        return true;
      }
      // 일반 아이템인 경우 clothesId 또는 id로 체크
      const key = item.clothesId != null ? String(item.clothesId) : item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const selectedRecommendations = useMemo(() => {
    if (activeLabel === "match" || activeLabel === "similar" || activeLabel === "aimd") return [];
    const items = styleItems;
    const uniques = uniqueItems(items);

    const ownedSet = new Set(clothes.map(c => parseBeClothesId(c.id)).filter((id): id is number => id != null));
    const owned = [] as typeof uniques;
    const notOwned = [] as typeof uniques;
    uniques.forEach((it) => {
      // outfit을 구성하는 아이템 중 하나라도 보유 중이면 owned로 분류
      const itemClothesIds = [
        it.top?.clothesId,
        it.bottom?.clothesId,
        it.outer?.clothesId,
        it.shoes?.clothesId,
        it.clothesId,
      ].filter((id): id is number => id != null);

      const isOwned = itemClothesIds.some(id => ownedSet.has(id));
      if (isOwned) owned.push(it);
      else notOwned.push(it);
    });

    const limit = 20;
    return [...owned, ...notOwned].slice(0, limit);
  }, [activeLabel, styleItems, uniqueItems, clothes]);

  const ownedClothes = useMemo(() => clothes.filter((item) => !item.isWishlist), [clothes]);
  const matchEligibleClothes = useMemo(
      () => clothes.filter((item) => parseBeClothesId(item.id) != null),
      [clothes],
  );
  const anchorClothesIdNumeric = useMemo(
      () => (anchorClothesId ? parseBeClothesId(anchorClothesId) : null),
      [anchorClothesId],
  );
  const selectedAnchorClothes = useMemo(
      () => matchEligibleClothes.find((item) => item.id === anchorClothesId) ?? null,
      [matchEligibleClothes, anchorClothesId],
  );
  const filteredMatchPickerClothes = useMemo(() => {
    let list = matchEligibleClothes;
    if (matchOwnershipFilter === 'owned') list = list.filter((item) => !item.isWishlist);
    else if (matchOwnershipFilter === 'wishlist') list = list.filter((item) => item.isWishlist);
    if (matchCategoryFilter !== 'all') list = list.filter((item) => item.category === matchCategoryFilter);
    return list;
  }, [matchEligibleClothes, matchOwnershipFilter, matchCategoryFilter]);
  const registeredCount = ownedClothes.length;
  const hasRecommendationData = registeredCount > 0;

  const handleDislike = async () => {
    if (!selectedItem?.clothesId) return;
    await handleFeedback(toCardItem(selectedItem), 'DISLIKE');
    handleRefreshAll();
  };

  useEffect(() => {
    if (!anchorClothesId) return;
    if (!matchEligibleClothes.some((item) => item.id === anchorClothesId)) {
      setAnchorClothesId(null);
    }
  }, [matchEligibleClothes, anchorClothesId]);

  useEffect(() => {
    if (!authReady) return;
    let cancelled = false;
    void (async () => {
      try {
        let wardrobeId = 0;
        if (userId) {
          const meta = await fetchWardrobeMeta(userId);
          if (!meta || cancelled) return;
          wardrobeId = meta.wardrobeId;
        }

        // Fetch bookId once
        let currentBookId = bookId;
        if (userId && !currentBookId) {
          try {
            const book = await fetchMyOutfitBook();
            if (book?.outfitBookId) {
              currentBookId = book.outfitBookId;
              setBookId(currentBookId);
            }
          } catch (e) {
            console.error('Failed to fetch outfit books:', e);
          }
        }

        const isRegionChanged = lastFetchedRegion.current !== region;

        if (ootdItems.length === 0 || isRegionChanged) {
          lastFetchedRegion.current = region;
          if (isRegionChanged) {
            setOotdItems([]);
            setOotdCombinations([]);
          }
          setOotdLoading(true);
          try {
            let currentTemp: number | undefined = undefined;
              try {
              const weather = await fetchWeather(region || '서울');
              if (Array.isArray(weather) && weather.length > 0) {
                const raw = weather[0].temp as string;
                const parsed = parseFloat(raw.replace(/°\s*C/i, '').trim());
                if (!isNaN(parsed)) currentTemp = parsed;
              } else if (weather && typeof weather === 'object') {
                currentTemp = (weather.currentTemp ?? weather.temp ?? weather.temperature) as number | undefined;
              }
            } catch (e) {
              console.error('[DEBUG] weather fetch failed:', e);
            }

            const res = userId ? await fetchOotdRecommendations(wardrobeId, currentTemp ?? 20) : {
              combinations: [
                {
                  outfitId: 999991,
                  title: "세련된 시티룩",
                  reason: "맑은 날씨에 어울리는 세련된 조합입니다.",
                  top: { clothesId: 1001, name: "화이트 셔츠", category: "TOP", imageUrl: "https://images.unsplash.com/photo-1598033129183-c4f50c7176c8?q=80&w=400" },
                  bottom: { clothesId: 1002, name: "슬랙스", category: "BOTTOM", imageUrl: "https://images.unsplash.com/photo-1624373666563-54428a1c360a?q=80&w=400" },
                  outer: { clothesId: 1003, name: "네이비 블레이저", category: "OUTER", imageUrl: "https://images.unsplash.com/photo-1594932224828-b4b05a833534?q=80&w=400" },
                  shoes: { clothesId: 1004, name: "더비 슈즈", category: "SHOES", imageUrl: "https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=400" },
                  totalScore: 9.5,
                },
                {
                  outfitId: 999992,
                  title: "캐주얼 데일리",
                  reason: "편안하면서도 스타일리시한 데일리 룩입니다.",
                  top: { clothesId: 1005, name: "그래픽 티셔츠", category: "TOP", imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=400" },
                  bottom: { clothesId: 1006, name: "데님 팬츠", category: "BOTTOM", imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=400" },
                  shoes: { clothesId: 1007, name: "화이트 스니커즈", category: "SHOES", imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=400" },
                  totalScore: 8.8,
                },
                {
                  outfitId: 999993,
                  title: "스포티 스트릿",
                  reason: "활동적인 활동에 적합한 힙한 스트릿 룩입니다.",
                  top: { clothesId: 1008, name: "후드 티셔츠", category: "TOP", imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=400" },
                  bottom: { clothesId: 1009, name: "조거 팬츠", category: "BOTTOM", imageUrl: "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?q=80&w=400" },
                  outer: { clothesId: 1010, name: "바시티 자켓", category: "OUTER", imageUrl: "https://images.unsplash.com/photo-1617114919297-3c8ddb01f599?q=80&w=400" },
                  shoes: { clothesId: 1011, name: "하이탑 스니커즈", category: "SHOES", imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=400" },
                  totalScore: 9.2,
                }
              ],
              weatherLabel: "맑음"
            };
            const outfits = res?.combinations || res?.outfits || (Array.isArray(res) ? res : []);
            const weatherLabel = res?.weatherLabel || "";

            if (cancelled) return;
            setOotdError(null);

            const generateOotdId = (item: any, idx: number) => {
              if (item.outfitId) return `ootd-outfit-${item.outfitId}`;
              // outfitId가 없는 경우 구성 요소들의 ID 조합으로 고유 ID 생성 (안정성)
              const components = [item.top?.clothesId, item.bottom?.clothesId, item.outer?.clothesId, item.shoes?.clothesId].filter(Boolean).sort().join('-');
              return components ? `ootd-comp-${components}` : `ootd-${idx}`;
            };

            const combos = outfits.map((item: any, idx: number) => {
              const id = generateOotdId(item, idx);
              return {
                id,
                top: item.top ?? null,
                bottom: item.bottom ?? null,
                outer: item.outer ?? null,
                shoes: item.shoes ?? null,
                totalScore: item.totalScore ?? null,
                weatherLabel: weatherLabel || item.weatherLabel,
                outfitId: item.outfitId ?? null,
                bookId: currentBookId || null,
              };
            });

            const mapped = outfits.map((item: any, idx: number) => {
              const id = generateOotdId(item, idx);
              const mainItem = item.top || item.outer || item.bottom || item;
              const title = [item.top?.name, item.bottom?.name].filter(Boolean).join(' + ') || (item.name ?? item.title ?? `추천 코디 ${idx + 1}`);
              return {
                id,
                title,
                category: mainItem.category ? (mainItem.category === 'TOP' ? 'Top' : mainItem.category === 'BOTTOM' ? 'Bottom' : mainItem.category === 'OUTER' ? 'Outer' : 'Shoes') : 'Outer',
                style: STYLE_LABELS[(item.styleCodes && item.styleCodes[0]) || item.style] ?? (item.style || '—'),
                itemType: mainItem.itemType || '',
                color: getGarmentColorLabel(item.primaryColor ?? ''),
                colorHex: getGarmentColor(item.primaryColor ?? '')?.hex ?? '',
                price: '',
                matchRate: Math.round((item.totalScore || 0) * 10),
                imageUrl: (mainItem.imageUrl ?? mainItem.userImageUrl ?? item.imageUrl) || fallbackImages.Top,
                reason: weatherLabel || item.reason || '',
                brand: mainItem.brandName ?? '',
                isAnchor: false,
                clothesId: mainItem.clothesId ?? null,
                outfitId: item.outfitId ?? null,
                bookId: currentBookId || null,
                top: item.top,
                bottom: item.bottom,
                outer: item.outer,
                shoes: item.shoes,
              } as RecommendItem;
            });
            setOotdCombinations(combos);
            setOotdItems(mapped);
          } catch (err) {
            if (!cancelled) {
              setOotdError(extractApiErrorMessage(err, "OOTD 추천을 불러오지 못했습니다."));
            }
          } finally {
            if (!cancelled) setOotdLoading(false);
          }
        }

        if (activeLabel === 'style' && userId && styleItems.length === 0) {
          setStyleLoading(true);
          try {
            const res = userId ? await fetchWardrobeRecommendations(wardrobeId) : [];
            if (cancelled) return;
            setStyleError(null);
            const items = Array.isArray(res) ? res : [];
            const mapped = items.slice(0, DEFAULT_RECOMMENDATIONS_PER_CATEGORY).map((item: any, idx: number) => ({
              id: `style-${item.clothesId ?? idx}`,
              title: item.title,
              category: item.category ? (item.category === 'TOP' ? 'Top' : item.category === 'BOTTOM' ? 'Bottom' : item.category === 'OUTER' ? 'Outer' : 'Shoes') : 'Top',
              style: STYLE_LABELS[item.primaryStyle] ?? (item.primaryStyle ?? '—'),
              itemType: item.itemType || '',
              color: item.primaryColorDisplay?.name ?? getGarmentColorLabel(item.primaryColor ?? ''),
              colorHex: item.primaryColorDisplay?.hex ?? getGarmentColor(item.primaryColor ?? '')?.hex ?? '',
              brand: item.brandName ?? '',
              price: item.price && item.price !== '0' ? `${parseInt(item.price).toLocaleString()}원` : '',
              matchRate: Math.round(parseFloat(item.score) * 100),
              imageUrl: item.imageUrl || fallbackImages.Top,
              reason: item.reason ?? '',
              isAnchor: false,
              clothesId: item.clothesId ?? null,
              purchaseUrl: item.link ?? '#',
            } as RecommendItem));
            setStyleItems(mapped);
          } catch (err) {
            if (!cancelled) {
              setStyleError(extractApiErrorMessage(err, "스타일 기반 추천을 불러오지 못했습니다."));
            }
          } finally {
            if (!cancelled) setStyleLoading(false);
          }
        }
      } catch {
        // ignore wardrobe meta error
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLabel, userId, authReady, refreshSignal, region]);

  useEffect(() => {
    if (activeLabel !== "match" || !userId || !authReady || anchorClothesIdNumeric == null) {
      setMatchRecommendationGroups([]);
      setMatchError(null);
      setMatchLoading(false);
      return;
    }
    let cancelled = false;
    setMatchLoading(true);
    setMatchError(null);
    void (async () => {
      try {
        const response = await fetchClothesRecommendations(
            userId,
            anchorClothesIdNumeric,
            { limitPerCategory: DEFAULT_RECOMMENDATIONS_PER_CATEGORY },
        );
        if (cancelled) return;
        setMatchRecommendationGroups(mapClothesRecommendationResponseGrouped(response, gender));
      } catch (error) {
        if (cancelled) return;
        setMatchRecommendationGroups([]);
        setMatchError(extractApiErrorMessage(error, "어울리는 옷 추천을 불러오지 못했습니다."));
      } finally {
        if (!cancelled) setMatchLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeLabel, anchorClothesIdNumeric, gender, userId, authReady, refreshSignal]);

  const matchRecommendationCount = useMemo(
      () => matchRecommendationGroups.reduce((sum, group) => sum + group.items.length, 0),
      [matchRecommendationGroups],
  );

  const activeConfig = labelConfig[activeLabel];
  const labelKeys = Object.keys(labelConfig) as RecommendationLabel[];

  useEffect(() => {
    const target = labelSectionRef.current;
    if (!target) return;
    const root = document.getElementById("app-viewport");

    const updateStickyLabels = () => {
      const targetRect = target.getBoundingClientRect();
      const rootTop = root?.getBoundingClientRect().top ?? 0;
      const stickyLine = rootTop + 72;
      setShowStickyLabels(targetRect.top < stickyLine);
    };

    updateStickyLabels();
    root?.addEventListener("scroll", updateStickyLabels, { passive: true });
    window.addEventListener("resize", updateStickyLabels);

    return () => {
      root?.removeEventListener("scroll", updateStickyLabels);
      window.removeEventListener("resize", updateStickyLabels);
    };
  }, []);

  useEffect(() => {
    resetRecommendationState();
  }, [resetRecommendationState, resetSignal]);

  useEffect(() => {
    if (userId == null || !authReady) {
      resetRecommendationState();
      lastFetchedRegion.current = null;
    }
  }, [authReady, resetRecommendationState, userId]);

  const selectLabel = (label: RecommendationLabel, scrollToList = false) => {
    if (!userId && label !== "style") {
      onLoginRequired?.();
      return;
    }
    setActiveLabel(label);
    if (scrollToList) {
      window.setTimeout(() => {
        document.getElementById("recommendation-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
    }
  };

  const toCardItem = (item: RecommendItem): RecommendCardItem => {
    const categoryLabelMap: Record<string, string> = {
      Top: '상의', Bottom: '하의', Outer: '아우터', Shoes: '신발',
    };
    return {
      id: item.id,
      clothesId: item.clothesId ?? null,
      title: item.title,
      brandLabel: formatRecommendBrandLabel(item.brand ?? ''),
      brandLogoUrl: getBrandLogoUrl(item.brand ?? ''),
      category: item.category,
      categoryLabel: categoryLabelMap[item.category] ?? item.category,
      itemTypeCode: item.itemType || '',
      itemTypeLabel: item.itemType ? getItemTypeLabel(item.category, item.itemType) : '',
      style: item.style,
      styles: [item.style].filter(Boolean),
      color: item.color,
      colorHex: item.colorHex,
      secondaryColors: [],
      matchRate: item.matchRate,
      imageUrl: item.imageUrl,
      reason: item.reason,
      isAnchor: item.isAnchor,
      purchaseUrl: item.purchaseUrl ?? '#',
      hasDirectPurchaseUrl: !!(item.purchaseUrl && item.purchaseUrl !== '#'),
    };
  };

  const ootdRef = useRef<HTMLElement>(null);

  // guideTourCompleted가 바뀌면 tourOpen도 동기화
  useEffect(() => {
    setTourOpen(!guideTourCompleted)
  }, [guideTourCompleted])

  return (
      <div className="space-y-6 animate-fade-in font-sans">
        <section ref={ootdRef} className="bg-white border border-slate-100 rounded-[28px] shadow-sm text-left">
          <div className="p-4 md:p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">✨</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-950">오늘의 OOTD 추천</h2>
            </div>
            {userId && ootdItems[0]?.reason && (
              <p className="text-xs text-slate-400 font-bold mb-3 -mt-2">{ootdItems[0].reason}</p>
            )}
            {!userId && (
              <p className="text-xs text-slate-400 font-bold mb-3 -mt-2">로그인하면 오늘 날씨에 맞는 코디를 추천해드려요</p>
            )}
          </div>

          {ootdLoading && ootdItems.length === 0 ? (
            <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 px-4 gap-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="flex-none w-[85vw] sm:w-[400px] snap-center">
                  <div className="h-96 sm:h-[28rem] lg:h-[32rem] rounded-[24px] bg-slate-100 animate-pulse" />
                </div>
              ))}
            </div>
          ) : ootdError ? (
            <div className="mx-4 mb-4 rounded-2xl border border-red-100 bg-red-50 px-5 py-8 text-center">
              <p className="text-sm font-black text-red-700">{ootdError}</p>
              <button
                type="button"
                onClick={() => setRefreshSignal(p => p + 1)}
                className="mt-3 h-8 px-4 rounded-full bg-[#111827] text-white text-[10px] font-black"
              >
                다시 시도
              </button>
            </div>
          ) : ootdItems.length === 0 ? (
            <div className="mx-4 mb-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
              <p className="text-sm font-black text-slate-600">추천된 OOTD가 없습니다.</p>
            </div>
          ) : (
            <>
            <div
              className="flex overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2 px-4 gap-3"
              onScroll={(e) => {
                const el = e.currentTarget
                const idx = Math.round(el.scrollLeft / el.offsetWidth)
                setCurrentOotdIndex(idx)
              }}
            >
              {ootdItems.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="flex-none w-[85vw] sm:w-[400px] snap-center"
                >
                  <article
                    onClick={() => {
                      if (!userId) {
                        onLoginRequired?.();
                        return;
                      }
                      const combo = ootdCombinations.find(c => c.id === item.id) ?? null;
                      setSelectedCombo(combo);
                      setSelectedItem(null);
                    }}
                    className="rounded-[24px] border border-slate-100 bg-slate-50 overflow-hidden transition-all duration-200 hover:shadow-xl active:scale-[0.99] cursor-pointer"
                  >
                    <div className="h-96 sm:h-[28rem] lg:h-[32rem] bg-slate-100 relative overflow-hidden">
                      {!userId && (
                        <div className="absolute top-3 left-3 z-10 bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                          <span className="text-[10px] font-black text-white tracking-wider">코디 미리보기</span>
                        </div>
                      )}
                      {(() => {
                        const combo = ootdCombinations.find(c => c.id === item.id);
                        if (combo) {
                          return (
                            <OotdCanvas
                              top={combo.top?.imageUrl || combo.top?.userImageUrl}
                              bottom={combo.bottom?.imageUrl || combo.bottom?.userImageUrl}
                              outer={combo.outer?.imageUrl || combo.outer?.userImageUrl}
                              shoes={combo.shoes?.imageUrl || combo.shoes?.userImageUrl}
                            />
                          );
                        }
                        return (
                          <AuthenticatedImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" fallback={<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">이미지 없음</div>} />
                        );
                      })()}
                      <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/45 to-transparent text-white">
                        <h3 className="text-base font-black truncate">{item.title}</h3>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 mt-2">
              {ootdItems.slice(0, 3).map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentOotdIndex
                      ? 'w-4 bg-slate-800'
                      : 'w-1.5 bg-slate-300'
                  }`}
                />
              ))}
            </div>
            </>
          )}
        </section>

        {showStickyLabels && (
            <div className="fixed top-[72px] left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-1 py-2 shadow-sm">
              <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
                {labelKeys.map((label) => {
                  const config = labelConfig[label];
                  const isActive = activeLabel === label;
                  return (
                      <button key={label} onClick={() => selectLabel(label, true)}
                              className={`h-7 px-3 rounded-full text-[10px] font-black whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${isActive ? "bg-[#111827] text-[#C4B5FD] shadow-md" : "bg-slate-50 text-slate-500 hover:bg-white hover:text-[#111827]"}`}
                              type="button"
                      >
                        <span className="mr-1">{config.icon}</span>{config.title}
                      </button>
                  );
                })}
              </div>
            </div>
        )}

        <section ref={labelSectionRef} className="bg-white border border-slate-100 rounded-[28px] p-3 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {labelKeys.map((label) => {
              const config = labelConfig[label];
              const isActive = activeLabel === label;
              return (
                  <button key={label} onClick={() => selectLabel(label)}
                          className={`min-h-[86px] rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-1 active:scale-95 ${isActive ? "bg-[#111827] text-white border-transparent shadow-md ring-2 ring-[#C4B5FD]" : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50 hover:shadow-md"}`}
                  >
                    <span className="text-xl block mb-2">{config.icon}</span>
                    <strong className="text-xs font-black block leading-tight">{config.title}</strong>

                  </button>
              );
            })}
          </div>
        </section>


      <section ref={recommendationListRef} id="recommendation-list" className="bg-white border border-slate-100 rounded-[28px] p-4 md:p-5 shadow-sm text-left scroll-mt-28">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-950 mt-1">
              <span className="mr-2">{activeConfig.icon}</span>
              {activeConfig.title}
            </h2>
          </div>
          {activeLabel === 'style' && styleError && <p className="text-[10px] text-rose-500 font-bold max-w-[150px] text-right leading-tight">{styleError}</p>}
        </div>



        {hasRecommendationData && activeLabel === 'style' && styleLoading && (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-6">
              {Array.from({ length: 20 }).map((_, idx) => (
                  <div key={idx} className="h-44 sm:h-52 lg:h-72 rounded-[24px] bg-slate-100 animate-pulse" />
              ))}
            </div>
        )}

        {activeLabel === "match" && wardrobeLoading && matchEligibleClothes.length === 0 && (
            <div className="mb-5 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-black text-slate-500">옷장 데이터를 불러오는 중…</p>
            </div>
        )}
        {activeLabel === "match" && !wardrobeLoading && matchEligibleClothes.length === 0 && (
            <div className="mb-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-black text-slate-600">보유 옷을 등록하면 어울리는 옷 추천을 받을 수 있어요</p>
              <p className="text-xs text-slate-400 font-bold mt-2">옷장 탭에서 사진·구매내역 등록 후 다시 시도해 주세요.</p>
              {onGoToCloset && (
                <button
                  type="button"
                  onClick={onGoToCloset}
                  className="mt-4 h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-black"
                >
                  옷 등록하러 가기
                </button>
              )}
            </div>
        )}
        {activeLabel === "match" && matchEligibleClothes.length > 0 && (
            <div className="mb-5 space-y-3">
              <button
                type="button"
                disabled={matchLoading}
                onClick={() => setMatchPickerOpen(true)}
                className="w-full min-h-20 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-slate-400 hover:-translate-y-0.5 hover:shadow-md disabled:opacity-60"
              >
                {selectedAnchorClothes ? (
                  <>
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <AuthenticatedImage
                        src={resolveClothesDisplayImageUrl({ userImageUrl: selectedAnchorClothes.userImageUrl, imageUrl: selectedAnchorClothes.be?.imageUrl ?? selectedAnchorClothes.thumbnailUrl }) || fallbackImages[selectedAnchorClothes.category]}
                        alt={selectedAnchorClothes.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-black text-slate-400">현재 기준 옷</p>
                      <p className="mt-0.5 text-sm font-black text-slate-900 truncate">{selectedAnchorClothes.name}</p>
                      <p className="mt-1 text-[11px] font-bold text-slate-400 truncate">
                        {selectedAnchorClothes.be?.brandName || selectedAnchorClothes.category}
                      </p>
                    </div>
                    <span className="shrink-0 h-8 px-3 rounded-full bg-[#111827] text-white text-[11px] font-black grid place-items-center">옷 변경</span>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-xl bg-slate-100 grid place-items-center text-xl shrink-0">+</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-black text-slate-900">어울리는 코디를 찾을 옷을 선택해 주세요</p>
                    </div>
                    <span className="shrink-0 h-8 px-3 rounded-full bg-[#111827] text-white text-[11px] font-black grid place-items-center">옷 선택</span>
                  </>
                )}
              </button>
              {matchLoading && <p className="text-xs text-slate-400 font-bold">어울리는 옷 추천을 불러오는 중…</p>}
              {matchError && (
                <div className="flex items-center gap-2">
                  <p className="text-xs text-red-600 font-bold">{matchError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setMatchError(null);
                      setRefreshSignal(prev => prev + 1);
                    }}
                    className="text-[10px] font-black underline text-slate-900"
                  >
                    다시 시도
                  </button>
                </div>
              )}
            </div>
        )}

        {activeLabel === "match" && matchEligibleClothes.length > 0 && !anchorClothesId ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-black text-slate-600">위 버튼으로 옷을 선택해 주세요</p>
              <p className="text-xs text-slate-400 font-bold mt-2">선택한 옷과 어울리는 코디가 아래에 표시됩니다.</p>
            </div>
        ) : activeLabel === "match" && matchEligibleClothes.length > 0 && matchLoading ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-black text-slate-500">추천 코디를 불러오는 중…</p>
            </div>
        ) : activeLabel === "match" && matchEligibleClothes.length > 0 && matchRecommendationCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
              <p className="text-sm font-black text-slate-600">어울리는 옷을 찾지 못했어요</p>
              <p className="text-xs text-slate-400 font-bold mt-2">다른 옷을 선택하거나 옷장에 아이템을 더 등록해 보세요.</p>
            </div>
        ) : activeLabel === "match" && matchEligibleClothes.length > 0 ? (
            <MatchRecommendationByCategory groups={matchRecommendationGroups} userId={userId} existingGarments={clothes} onWishlistAdded={handleRefreshAll} />
        ) : activeLabel === "similar" ? (
            <SimilarProductRecommendations
                userId={userId}
                existingGarments={clothes}
                onWishlistAdded={handleRefreshAll}
                onGoToCloset={onGoToCloset}
            />
        ) : activeLabel === "aimd" ? (
            <AiMdRecommendations
                userId={userId}
                gender={gender}
                existingGarments={clothes}
                onWishlistAdded={handleRefreshAll}
                onOutfitOpen={(combination) => {
                  setSelectedCombo({
                    ...combination,
                    bookId,
                  });
                  setSelectedItem(null);
                }}
            />
        ) : activeLabel === "style" ? (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              {!userId ? (
                <div className="col-span-full rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
                  <p className="text-sm font-black text-red-700">로그인 후 스타일 기반 추천을 이용할 수 있어요.</p>
                </div>
              ) : styleLoading ? (
                  Array.from({ length: 20 }).map((_, idx) => (
                      <div key={idx} className="h-44 sm:h-52 lg:h-72 rounded-[24px] bg-slate-100 animate-pulse" />
                  ))
              ) : styleError ? (
                  <div className="col-span-full rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
                    <p className="text-sm font-black text-red-700">{styleError}</p>
                    <button
                        type="button"
                        onClick={() => {
                          setStyleError(null);
                          setRefreshSignal(prev => prev + 1);
                          onRefreshWardrobe?.();
                        }}
                        className="mt-4 h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-black"
                    >
                      다시 시도
                    </button>
                  </div>
              ) : selectedRecommendations.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                  <p className="text-sm font-black text-slate-700">추천 결과가 없습니다.</p>
                  <p className="text-xs text-slate-400 font-bold mt-2">옷장에 아이템을 더 등록하거나 나중에 다시 시도해 주세요.</p>
                </div>
              ) : (
                  selectedRecommendations.map((item) => (
                      <article
                          key={item.id}
                          onClick={() => {
                            setSelectedItem(item);
                            setSelectedCombo(null);
                          }}
                          className={`group relative rounded-[24px] border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-xl active:scale-[0.99] cursor-pointer ${item.isAnchor ? "border-[#1E3A8A]/30 bg-indigo-50/40 ring-1 ring-[#1E3A8A]/20" : "border-slate-100 bg-slate-50"}`}
                      >
                        <div className="h-44 sm:h-52 lg:h-72 bg-slate-100 relative overflow-hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleWishlist(toCardItem(item))
                            }}
                            disabled={isWishlistSubmitting(item.clothesId)}
                            aria-label={isWishlisted(item.clothesId) ? '위시리스트에서 빼기' : '위시리스트에 추가'}
                            className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-full border bg-white/95 shadow-sm transition-colors cursor-pointer disabled:opacity-60 ${
                              isWishlisted(item.clothesId)
                                ? 'border-rose-200 text-rose-500 hover:bg-rose-50'
                                : 'border-slate-200/90 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50'
                            }`}
                          >
                            <Heart className={`w-3.5 h-3.5 ${isWishlisted(item.clothesId) ? 'text-rose-500 fill-rose-500' : ''}`} />
                          </button>
                          <AuthenticatedImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" fallback={<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">이미지 없음</div>} />
                          <div className="absolute left-0 bottom-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white flex flex-col items-start">
                              {item.itemType ? (
                                <span className="text-[10px] font-bold text-slate-400 truncate">
                                  {getItemTypeLabel(item.category, item.itemType)}
                                </span>
                              ) : null}
                              {item.brand ? <div className="text-[11px] font-bold text-white/90 uppercase tracking-wide truncate">{item.brand}</div> : null}
                              <h3 className="text-sm md:text-base font-black truncate mt-1 leading-tight">{item.title}</h3>
                              {item.price ? <div className="mt-1"><strong className="text-sm font-extrabold">{item.price}</strong></div> : null}
                            </div>
                        </div>
                      </article>
                  ))
              )}
            </div>
        ) : null}
      </section>

      <Modal
          open={matchPickerOpen}
          onClose={() => setMatchPickerOpen(false)}
          size="lg"
          placement="sheet"
          closeOnBackdrop
      >
        <ModalHeader
            title="기준 옷 선택"
            onClose={() => setMatchPickerOpen(false)}
        />
        <ModalBody className="p-4 sm:p-6">
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
            {([
              ['all', '전체'],
              ['owned', '보유'],
              ['wishlist', '미보유'],
            ] as const).map(([value, label]) => {
              const active = matchOwnershipFilter === value;
              return (
                  <button
                      key={value}
                      type="button"
                      onClick={() => setMatchOwnershipFilter(value)}
                      aria-pressed={active}
                      className={`h-10 rounded-xl text-[12px] font-black transition ${
                          active
                              ? 'bg-white text-slate-950 shadow-sm'
                              : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    {label}
                  </button>
              );
            })}
          </div>
          <div className="mt-3 mb-4 flex flex-wrap gap-1.5">
            {(['all', 'Top', 'Bottom', 'Outer', 'Shoes'] as const).map((cat) => {
              const labels: Record<string, string> = { all: '전체', Top: '상의', Bottom: '하의', Outer: '아우터', Shoes: '신발' };
              const active = matchCategoryFilter === cat;
              return (
                  <button
                      key={cat}
                      type="button"
                      onClick={() => setMatchCategoryFilter(cat)}
                      aria-pressed={active}
                      className={`h-8 px-3 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                          active
                              ? "bg-[#BBF7D0] text-[#1E3A8A] border-[#BBF7D0]"
                              : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                      }`}
                  >
                    {labels[cat]}
                  </button>
              );
            })}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-x-2.5 gap-y-4">
            {filteredMatchPickerClothes.map((item) => {
              const selected = anchorClothesId === item.id;
              const imgSrc = resolveClothesDisplayImageUrl({ userImageUrl: item.userImageUrl, imageUrl: item.be?.imageUrl ?? item.thumbnailUrl }) || fallbackImages[item.category];
              return (
                <GarmentPickerGridCard
                  key={item.id}
                  name={item.name}
                  imageUrl={imgSrc}
                  subtitle={item.be?.brandName || item.category}
                  selected={selected}
                  owned={!item.isWishlist}
                  onClick={() => { setAnchorClothesId(item.id); setMatchPickerOpen(false); }}
                />
              );
            })}
          </div>
          {filteredMatchPickerClothes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm font-black text-slate-600">조건에 맞는 옷이 없습니다.</p>
              </div>
          )}
        </ModalBody>
      </Modal>

      <RecommendProductDetailModal
          open={selectedItem !== null}
          item={selectedItem ? toCardItem(selectedItem) : null}
          userId={userId}
          onClose={() => setSelectedItem(null)}
          wishlisted={selectedItem ? isWishlisted(selectedItem.clothesId) : false}
          wishlistSubmitting={selectedItem ? isWishlistSubmitting(selectedItem.clothesId) : false}
          onWishlistToggle={async () => {
            if (selectedItem) {
              if (selectedItem.clothesId) {
                await toggleWishlist(toCardItem(selectedItem));
              } else {
                onAddWishlistItem({
                  name: selectedItem.title,
                  category: selectedItem.category,
                  color: selectedItem.color,
                  style: selectedItem.style,
                  fabricMaterial: "기타",
                });
              }
            }
          }}
          onExclude={selectedItem?.clothesId ? async () => {
            await handleFeedback(toCardItem(selectedItem), 'EXCLUDE');
          } : undefined}
          onDislike={selectedItem?.clothesId ? handleDislike : undefined}
          dislikeSubmitting={selectedItem ? isFeedbackSubmitting(selectedItem.clothesId) : false}
      />

      <OutfitDetailModal
          open={selectedCombo != null}
          combination={selectedCombo}
          onClose={() => setSelectedCombo(null)}
          onSaved={handleRefreshWardrobeOnly}
          onFavoriteCreated={(outfitId) => {
            const updatedCombo = selectedCombo ? { ...selectedCombo, outfitId, favorite: true } : null
            setOotdCombinations(prev => prev.map(c =>
              c.id === selectedCombo?.id ? (updatedCombo as any) : c
            ))
            setOotdItems(prev => prev.map(item =>
              item.id === selectedCombo?.id ? { ...item, outfitId } : item
            ))
            if (updatedCombo) setSelectedCombo(updatedCombo)
            handleRefreshWardrobeOnly()
          }}
          userId={userId}
          clothes={clothes}
      />

        {tourOpen && (
            <GuideTour
                steps={[
                  { targetRef: ootdRef, message: "오늘 날씨와 내 옷장을 분석해 코디를 추천해드려요" },
                  { targetRef: labelSectionRef, message: "스타일 기반·유사 상품·어울리는 옷·AI MD까지 다양한 방식으로 추천을 받아볼 수 있어요" },
                  { targetRef: recommendationListRef, message: "추천 카드를 클릭해 상세 정보와 유사 상품을 확인할 수 있어요" },
                ]}
                onComplete={() => {
                  setTourOpen(false)
                  onGuideTourComplete()
                }}
            />
        )}

        {!tourOpen && (
            <button
              className="fixed right-5 z-40 bottom-20 w-11 h-11 rounded-full bg-white border border-slate-200
           text-[#1E3A8A] shadow-lg flex items-center justify-center
           transition active:scale-90"
              onClick={() => setTourOpen(true)}
              type="button"
            >?</button>
        )}
      </div>
  );
}
