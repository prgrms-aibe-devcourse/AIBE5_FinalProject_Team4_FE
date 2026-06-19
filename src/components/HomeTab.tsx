import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import {
  fetchClothesRecommendations,
  fetchOotdRecommendations,
  fetchWardrobeRecommendations,
  DEFAULT_RECOMMENDATIONS_PER_CATEGORY,
} from "@/api/recommendations";
import { fetchWardrobeMeta } from '@/api/wardrobe'
import { fetchWeather } from '@/api/weather'
import { formatRecommendBrandLabel, getBrandLogoUrl } from '@/data/brandLogos'
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
}

type RecommendationLabel = "style" | "similar" | "match" | "aimd";

type RecommendItem = {
  id: string;
  title: string;
  category: "Top" | "Bottom" | "Outer" | "Shoes";
  brand?: string;
  style: string;
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
  purchaseUrl?: string;
};

const labelConfig: Record<RecommendationLabel, { title: string; subtitle: string; icon: string }> = {
  style: { title: "스타일 기반 추천", subtitle: "", icon: "\ud83c\udfaf" },
  similar: { title: "유사 상품 추천", subtitle: "", icon: "\ud83d\udecd️" },
  match: { title: "어울리는 옷 추천", subtitle: "", icon: "\ud83d\udc55" },
  aimd: { title: "AI MD 추천", subtitle: "", icon: "\ud83e\udd16" },
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
                                }: HomeTabProps) {
  const [activeLabel, setActiveLabel] = useState<RecommendationLabel>("style");
  const [showStickyLabels, setShowStickyLabels] = useState(false);
  const [anchorClothesId, setAnchorClothesId] = useState<string | null>(null);
  const [matchPickerOpen, setMatchPickerOpen] = useState(false);
  const [matchCategoryFilter, setMatchCategoryFilter] = useState<'all' | 'Top' | 'Bottom' | 'Outer' | 'Shoes'>('all');
  const [matchRecommendationGroups, setMatchRecommendationGroups] = useState<RecommendCategoryGroup[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [ootdItems, setOotdItems] = useState<RecommendItem[]>([]);
  const [styleItems, setStyleItems] = useState<RecommendItem[]>([]);
  const [ootdError, setOotdError] = useState<string | null>(null);
  const [styleError, setStyleError] = useState<string | null>(null);
  const [ootdLoading, setOotdLoading] = useState(false);
  const [styleLoading, setStyleLoading] = useState(false);
  const [ootdCombinations, setOotdCombinations] = useState<Array<any>>([]);
  const [bookId, setBookId] = useState<number | null>(null);
  const [selectedItem, setSelectedItem] = useState<RecommendItem | null>(null);
  const [selectedCombo, setSelectedCombo] = useState<any | null>(null);

  const labelSectionRef = useRef<HTMLElement | null>(null);

  const [refreshSignal, setRefreshSignal] = useState(0);

  const {
    isWishlisted,
    isSubmitting: isWishlistSubmitting,
    isFeedbackSubmitting,
    toggleWishlist,
    handleFeedback,
  } = useRecommendWishlistToggle({
    userId,
    existingGarments: clothes,
    onWishlistChanged: () => {
      onRefreshWardrobe?.();
      setOotdItems([]);
      setOotdLoading(true);
      if (activeLabel === 'style') {
        setStyleItems([]);
        setStyleLoading(true);
      } else if (activeLabel === 'match') {
        setMatchRecommendationGroups([]);
        setMatchLoading(true);
      }
      setRefreshSignal(prev => prev + 1);
    },
  });
  // we don't use toastMessage directly here

  // 추천 목록에서 중복된 clothesId를 제거하는 헬퍼
  const uniqueItems = useCallback(<T extends { clothesId?: number | null; id: string }>(items: T[]): T[] => {
    const seen = new Set();
    return items.filter(item => {
      // clothesId가 있으면 그것을 키로 쓰고, 없으면 id를 키로 씀
      const key = item.clothesId != null ? String(item.clothesId) : item.id;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, []);

  const ootdRecommendations = useMemo(() => uniqueItems(ootdItems), [ootdItems, uniqueItems]);

  const selectedRecommendations = useMemo(() => {
    if (activeLabel !== "style") return [];
    return uniqueItems(styleItems);
  }, [activeLabel, styleItems, uniqueItems]);

  const ownedClothes = useMemo(() => clothes.filter((item) => !item.isWishlist), [clothes]);
  const matchEligibleOwnedClothes = useMemo(
      () => ownedClothes.filter((item) => parseBeClothesId(item.id) != null),
      [ownedClothes],
  );
  const anchorClothesIdNumeric = useMemo(
      () => (anchorClothesId ? parseBeClothesId(anchorClothesId) : null),
      [anchorClothesId],
  );
  const selectedAnchorClothes = useMemo(
      () => matchEligibleOwnedClothes.find((item) => item.id === anchorClothesId) ?? null,
      [matchEligibleOwnedClothes, anchorClothesId],
  );
  const matchPickerCounts = useMemo(() => ({
    all: matchEligibleOwnedClothes.length,
  }), [matchEligibleOwnedClothes]);
  const filteredMatchPickerClothes = useMemo(() => {
    let list = matchEligibleOwnedClothes;
    if (matchCategoryFilter !== 'all') list = list.filter((item) => item.category === matchCategoryFilter);
    return list;
  }, [matchEligibleOwnedClothes, matchCategoryFilter]);
  const registeredCount = ownedClothes.length;
  const hasRecommendationData = registeredCount > 0;

  const handleDislike = async () => {
    if (!selectedItem?.clothesId) return;
    await handleFeedback(toCardItem(selectedItem), 'DISLIKE');
  };

  useEffect(() => {
    if (!anchorClothesId) return;
    if (!matchEligibleOwnedClothes.some((item) => item.id === anchorClothesId)) {
      setAnchorClothesId(null);
    }
  }, [matchEligibleOwnedClothes, anchorClothesId]);

  // OOTD: always fetch regardless of active tab
  useEffect(() => {
    if (!userId || !authReady) return;
    let cancelled = false;
    void (async () => {
      try {
        const meta = await fetchWardrobeMeta(userId);
        if (!meta || cancelled) return;
        const wardrobeId = meta.wardrobeId;

        if (ootdItems.length > 0) return;

        let currentBookId = bookId;
        if (!currentBookId) {
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

          const res = await fetchOotdRecommendations(wardrobeId, currentTemp ?? 20);
          const outfits = res?.combinations || res?.outfits || (Array.isArray(res) ? res : []);
          const weatherLabel = res?.weatherLabel || "";

          if (cancelled) return;
          setOotdError(null);

          const generateOotdId = (item: any, idx: number) => {
            if (item.outfitId) return `ootd-outfit-${item.outfitId}`;
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
          if (!cancelled) setOotdError(extractApiErrorMessage(err, "OOTD 추천을 불러오지 못했습니다."));
        } finally {
          if (!cancelled) setOotdLoading(false);
        }
      } catch {
        // ignore wardrobe meta error
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, authReady, refreshSignal]);

  // Style: only when style tab is active
  useEffect(() => {
    if (!userId || !authReady || activeLabel !== 'style') return;
    let cancelled = false;
    void (async () => {
      try {
        const meta = await fetchWardrobeMeta(userId);
        if (!meta || cancelled) return;
        const wardrobeId = meta.wardrobeId;

        if (styleItems.length > 0) return;

        setStyleLoading(true);
        try {
          const res = await fetchWardrobeRecommendations(wardrobeId);
          if (cancelled) return;
          setStyleError(null);
          const items = Array.isArray(res) ? res : [];
          const mapped = items.slice(0, DEFAULT_RECOMMENDATIONS_PER_CATEGORY).map((item: any, idx: number) => ({
            id: `style-${item.clothesId ?? idx}`,
            title: item.title,
            category: item.category ? (item.category === 'TOP' ? 'Top' : item.category === 'BOTTOM' ? 'Bottom' : item.category === 'OUTER' ? 'Outer' : 'Shoes') : 'Top',
            style: STYLE_LABELS[item.primaryStyle] ?? (item.primaryStyle ?? '—'),
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
          if (!cancelled) setStyleError(extractApiErrorMessage(err, "스타일 기반 추천을 불러오지 못했습니다."));
        } finally {
          if (!cancelled) setStyleLoading(false);
        }
      } catch {
        // ignore wardrobe meta error
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLabel, userId, authReady, refreshSignal]);

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
    const observer = new IntersectionObserver(
        ([entry]) => { setShowStickyLabels(!entry.isIntersecting); },
        { root, rootMargin: "-80px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveLabel("style");
    setShowStickyLabels(false);
    setOotdItems([]);
    setStyleItems([]);
    setAnchorClothesId(null);
  }, [resetSignal]);

  useEffect(() => {
    if (activeLabel !== "match") setAnchorClothesId(null);
  }, [activeLabel]);

  const selectLabel = (label: "style" | "similar" | "match" | "aimd", scrollToList = false) => {
    if (label !== "style" && userId == null) {
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
      itemTypeCode: '',
      itemTypeLabel: '',
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

  return (
      <div className="space-y-6 animate-fade-in font-sans">
        {showStickyLabels && (
            <div className="fixed top-[72px] left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2 shadow-sm">
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

        {/* OOTD 추천 - 상단 고정 섹션 */}
        <section className="bg-white border border-slate-100 rounded-[28px] p-4 md:p-5 shadow-sm text-left">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <span className="text-[11px] font-black text-[#111827] uppercase tracking-wider">✨ Recommendation</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-950 mt-1">OOTD 추천</h2>
              <p className="text-xs text-slate-400 font-bold mt-1">오늘 입기 좋은 코디</p>
            </div>
            {ootdError && <p className="text-[10px] text-rose-500 font-bold max-w-[150px] text-right leading-tight">{ootdError}</p>}
          </div>

          {!hasRecommendationData && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <span className="text-4xl block mb-3">👗</span>
              <p className="text-sm font-bold text-slate-700">아직 등록된 옷이 없어요</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">옷을 등록하면 OOTD, 코디 추천이 시작돼요.</p>
            </div>
          )}

          {hasRecommendationData && ootdLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="h-44 sm:h-52 lg:h-72 rounded-[24px] bg-slate-100 animate-pulse" />
              ))}
            </div>
          )}

          {hasRecommendationData && !ootdLoading && ootdError && (
            <div className="col-span-full rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
              <p className="text-sm font-black text-red-700">{ootdError}</p>
              <button type="button" onClick={() => { setOotdError(null); setOotdItems([]); setRefreshSignal(s => s + 1); }} className="mt-4 h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-black">다시 시도</button>
            </div>
          )}

          {hasRecommendationData && !ootdLoading && !ootdError && ootdRecommendations.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm font-black text-slate-700">추천 결과가 없습니다.</p>
              <p className="text-xs text-slate-400 font-bold mt-2">옷장에 아이템을 더 등록하거나 나중에 다시 시도해 주세요.</p>
            </div>
          )}

          {hasRecommendationData && !ootdLoading && !ootdError && ootdRecommendations.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {ootdRecommendations.map((item, itemIdx) => (
                <article
                  key={item.id}
                  onClick={() => {
                    const combo = ootdCombinations[itemIdx] ?? null;
                    setSelectedCombo(combo);
                    setSelectedItem(null);
                  }}
                  className="group rounded-[24px] border border-slate-100 bg-slate-50 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-xl active:scale-[0.99] cursor-pointer"
                >
                  <div className="h-44 sm:h-52 lg:h-72 bg-slate-100 relative overflow-hidden">
                    {(() => {
                      const combo = ootdCombinations[itemIdx];
                      if (combo && !combo.outer && combo.top && combo.bottom) {
                        return (
                          <div className="w-full h-full flex flex-col">
                            <div className="flex-1 overflow-hidden border-b border-white/20">
                              <AuthenticatedImage src={combo.top.imageUrl ?? combo.top.userImageUrl ?? ''} alt="Top" className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" fallback={<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-[10px] font-bold">상의 없음</div>} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <AuthenticatedImage src={combo.bottom.imageUrl ?? combo.bottom.userImageUrl ?? ''} alt="Bottom" className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" fallback={<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-[10px] font-bold">하의 없음</div>} />
                            </div>
                          </div>
                        );
                      }
                      return (
                        <>
                          <AuthenticatedImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" fallback={<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">이미지 없음</div>} />
                          {combo && (() => {
                            const thumbs = [combo.bottom, combo.outer].filter(Boolean);
                            if (thumbs.length === 0) return null;
                            return (
                              <div className="absolute bottom-10 right-2 flex gap-1">
                                {thumbs.map((t: any, i: number) => (
                                  <div key={i} className="w-12 h-12 rounded-lg overflow-hidden border-2 border-white bg-slate-100 shadow-sm">
                                    <AuthenticatedImage src={t.imageUrl ?? t.userImageUrl ?? ''} alt={t.name ?? ''} className="w-full h-full object-cover" fallback={<div className="w-full h-full bg-slate-200" />} />
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </>
                      );
                    })()}
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/45 to-transparent text-white">
                      <h3 className="text-sm font-black truncate">{item.title}</h3>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

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
                    {config.subtitle ? <span className={`text-[10px] font-bold block mt-1 ${isActive ? "text-white/75" : "text-slate-400"}`}>{config.subtitle}</span> : null}
                  </button>
              );
            })}
          </div>
        </section>


      <section id="recommendation-list" className="bg-white border border-slate-100 rounded-[28px] p-4 md:p-5 shadow-sm text-left scroll-mt-28">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-black text-[#111827] uppercase tracking-wider">{activeConfig.icon} Recommendation</span>
            <h2 className="text-xl md:text-2xl font-black text-slate-950 mt-1">{activeConfig.title}</h2>
            {activeConfig.subtitle ? <p className="text-xs text-slate-400 font-bold mt-1">{activeConfig.subtitle}</p> : null}
          </div>
          {activeLabel === 'style' && styleError && <p className="text-[10px] text-rose-500 font-bold max-w-[150px] text-right leading-tight">{styleError}</p>}
          {activeLabel === 'style' && !styleError && (
              <span className="text-xs font-black text-slate-400 shrink-0">{`${selectedRecommendations.length}개`}</span>
          )}
        </div>

        {!hasRecommendationData && activeLabel === "style" && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center mb-6">
              <span className="text-4xl block mb-3">👗</span>
              <p className="text-sm font-bold text-slate-700">아직 등록된 옷이 없어요</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                옷을 등록하면 코디 추천이 시작돼요.
              </p>
            </div>
        )}

        {hasRecommendationData && activeLabel === 'style' && styleLoading && (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 mb-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-44 sm:h-52 lg:h-72 rounded-[24px] bg-slate-100 animate-pulse" />
              ))}
            </div>
        )}

        {activeLabel === "match" && wardrobeLoading && matchEligibleOwnedClothes.length === 0 && (
            <div className="mb-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm font-black text-slate-500">옷장 데이터를 불러오는 중…</p>
            </div>
        )}
        {activeLabel === "match" && !wardrobeLoading && matchEligibleOwnedClothes.length === 0 && (
            <div className="mb-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm font-black text-slate-700">어울리는 옷을 추천받으려면 먼저 보유 옷을 추가해 주세요.</p>
              <p className="text-xs text-slate-400 font-bold mt-2">옷장 탭에서 사진·구매내역 등록 후 다시 시도해 주세요.</p>
            </div>
        )}
        {activeLabel === "match" && matchEligibleOwnedClothes.length > 0 && (
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
              {matchError && <p className="text-xs text-red-600 font-bold">{matchError}</p>}
            </div>
        )}

        {activeLabel === "match" && matchEligibleOwnedClothes.length > 0 && !anchorClothesId ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm font-black text-slate-700">위에서 기준 옷을 선택해 주세요.</p>
              <p className="text-xs text-slate-400 font-bold mt-2">선택한 옷과 어울리는 코디가 아래에 표시됩니다.</p>
            </div>
        ) : activeLabel === "match" && matchEligibleOwnedClothes.length > 0 && matchLoading ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm font-black text-slate-500">추천 코디를 불러오는 중…</p>
            </div>
        ) : activeLabel === "match" && matchEligibleOwnedClothes.length > 0 && matchRecommendationCount === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
              <p className="text-sm font-black text-slate-700">어울리는 옷을 찾지 못했어요.</p>
              <p className="text-xs text-slate-400 font-bold mt-2">다른 옷을 선택하거나 옷장에 아이템을 더 등록해 보세요.</p>
            </div>
        ) : activeLabel === "match" && matchEligibleOwnedClothes.length > 0 ? (
            <MatchRecommendationByCategory groups={matchRecommendationGroups} userId={userId} existingGarments={clothes} onWishlistAdded={onRefreshWardrobe} />
        ) : activeLabel === "similar" ? (
            <SimilarProductRecommendations
                userId={userId}
                existingGarments={clothes}
                onWishlistAdded={onRefreshWardrobe}
                onGoToCloset={onGoToCloset}
            />
        ) : activeLabel === "aimd" ? (
            <AiMdRecommendations
                userId={userId}
                gender={gender}
                existingGarments={clothes}
                onWishlistAdded={onRefreshWardrobe}
            />
        ) : (
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
              {styleLoading ? (
                  Array.from({ length: 6 }).map((_, idx) => (
                      <div key={idx} className="h-44 sm:h-52 lg:h-72 rounded-[24px] bg-slate-100 animate-pulse" />
                  ))
              ) : styleError ? (
                  <div className="col-span-full rounded-2xl border border-red-100 bg-red-50 px-5 py-10 text-center">
                    <p className="text-sm font-black text-red-700">{styleError}</p>
                    <button
                        type="button"
                        onClick={() => {
                          setStyleError(null);
                          setStyleItems([]);
                          setRefreshSignal(prev => prev + 1);
                          onRefreshWardrobe?.();
                        }}
                        className="mt-4 h-9 px-4 rounded-full bg-[#111827] text-white text-xs font-black"
                    >
                      다시 시도
                    </button>
                  </div>
              ) : selectedRecommendations.length === 0 ? (
                  !styleLoading && (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                        <p className="text-sm font-black text-slate-700">추천 결과가 없습니다.</p>
                        <p className="text-xs text-slate-400 font-bold mt-2">옷장에 아이템을 더 등록하거나 나중에 다시 시도해 주세요.</p>
                      </div>
                  )
              ) : (
                  selectedRecommendations.map((item) => (
                      <article
                          key={item.id}
                          onClick={() => { setSelectedItem(item); setSelectedCombo(null); }}
                          className={`group rounded-[24px] border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-xl active:scale-[0.99] cursor-pointer ${item.isAnchor ? "border-[#1E3A8A]/30 bg-indigo-50/40 ring-1 ring-[#1E3A8A]/20" : "border-slate-100 bg-slate-50"}`}
                      >
                        <div className="h-44 sm:h-52 lg:h-72 bg-slate-100 relative overflow-hidden">
                          <AuthenticatedImage src={item.imageUrl} alt={item.title} className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105" fallback={<div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">이미지 없음</div>} />
                          <div className="absolute left-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent text-white flex flex-col items-start max-w-[66%]">
                            {item.brand ? <div className="text-[11px] font-bold text-white/90 uppercase tracking-wide truncate">{item.brand}</div> : null}
                            <h3 className="text-sm md:text-base font-black truncate mt-1 leading-tight">{item.title}</h3>
                            {item.price ? <div className="mt-1"><strong className="text-sm font-extrabold">{item.price}</strong></div> : null}
                          </div>
                        </div>
                      </article>
                  ))
              )}
            </div>
        )}
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
            subtitle={`보유 ${matchPickerCounts.all}개`}
            onClose={() => setMatchPickerOpen(false)}
        />
        <ModalBody className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-1.5">
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
                  <button
                      key={item.id}
                      type="button"
                      onClick={() => { setAnchorClothesId(item.id); setMatchPickerOpen(false); }}
                      className="min-w-0 text-left group"
                      aria-pressed={selected}
                  >
                    <div className={`relative aspect-square rounded-xl overflow-hidden bg-slate-100 border-2 transition group-hover:-translate-y-0.5 group-hover:shadow-md ${selected ? "border-[#111827] ring-2 ring-[#C4B5FD]" : "border-transparent"}`}>
                      <AuthenticatedImage
                          src={imgSrc}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          fallback={<div className="w-full h-full grid place-items-center text-slate-400 text-xs font-bold">이미지 없음</div>}
                      />
                      {selected && (
                          <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#111827] text-white grid place-items-center shadow">
                            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                          </span>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] font-black text-slate-800 truncate">{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{item.be?.brandName || item.category}</p>
                  </button>
              );
            })}
          </div>
          {filteredMatchPickerClothes.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                <p className="text-sm font-black text-slate-600">해당 카테고리의 보유 옷이 없습니다.</p>
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
          onSaved={onRefreshWardrobe}
          userId={userId}
      />
      </div>
  );
}
