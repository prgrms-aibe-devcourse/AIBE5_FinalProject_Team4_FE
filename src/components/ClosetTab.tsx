import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Spinner from "@/components/common/Spinner";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import {
  fetchWardrobeGarments,
  fetchWardrobeStatistics,
  updateClothesFavorite,
  convertWishlistToOwned,
} from "@/api/wardrobe";
import { getGarmentStyleLabel } from "@/data/garmentStyles";
import type { WardrobeStatisticsResponse } from "@/types/be";
import { clearAuthToken } from "@/utils/authToken";
import axios from "axios";
import ClosetGarmentDetail from "@/components/ClosetGarmentDetail";
import ClosetWardrobeMascot from "@/components/ClosetWardrobeMascot";
import {
  Heart,
  ShoppingBag,
  Flame,
  Award,
  HeartHandshake,
  Sparkle,
  Plus,
} from "./icons";
import { Garment } from "@/types/index";
import GuideTour from "@/components/common/GuideTour"

type ClosetTabView = "owned" | "wishlist" | "favorites";

interface ClosetTabProps {
  clothes: Garment[];
  setClothes: React.Dispatch<React.SetStateAction<Garment[]>>;
  selectedGarment: Garment | null;
  setSelectedGarment: (g: Garment | null) => void;
  /** JWT sub와 일치하는 인증 사용자 ID (App에서 전달) */
  userId: number;
  onOpenRegister: () => void;
  guideTourCompleted: boolean;
  onGuideTourComplete: () => void;
  isRegisterOpen: boolean;
}

export default function ClosetTab({
                                    clothes,
                                    setClothes,
                                    selectedGarment,
                                    setSelectedGarment,
                                    userId,
                                    onOpenRegister,
                                    guideTourCompleted,
                                    onGuideTourComplete,
                                    isRegisterOpen,
                                  }: ClosetTabProps) {
  const [closetTab, setClosetTab] = useState<ClosetTabView>("owned");
  const [closetFilter, setClosetFilter] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wardrobeStats, setWardrobeStats] = useState<WardrobeStatisticsResponse | null>(null);
  const selectedRef = useRef<Garment | null>(null);
  const tabRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [tourOpen, setTourOpen] = useState(!guideTourCompleted && !isRegisterOpen);

  useEffect(() => {
    if(!isRegisterOpen && !guideTourCompleted) {
      setTourOpen(true);
    }
  }, [isRegisterOpen, guideTourCompleted]);

  // selectedRef 동기화 — loadWardrobe/upsertGarment에서 현재 선택 의상 보존에 사용
  useEffect(() => {
    selectedRef.current = selectedGarment;
  }, [selectedGarment]);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const refreshWardrobeStats = useCallback(async () => {
    try {
      const stats = await fetchWardrobeStatistics(userId);
      setWardrobeStats(stats);
    } catch {
      // 통계만 실패해도 목록은 유지
    }
  }, [userId]);

  const skipStatsRefreshRef = useRef(true);

  useEffect(() => {
    skipStatsRefreshRef.current = true;
  }, [userId]);

  const loadWardrobe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stats, garmentsResult] = await Promise.all([
        fetchWardrobeStatistics(userId),
        fetchWardrobeGarments(userId),
      ]);
      setWardrobeStats(stats);

      const { garments, partialErrors } = garmentsResult;
      setClothes(garments);
      const preserved = garments.find((g) => g.id === selectedRef.current?.id);
      setSelectedGarment(preserved ?? garments[0] ?? null);

      if (partialErrors?.wishlist) {
        triggerToast("위시리스트를 불러오지 못했습니다. 보유 옷만 표시합니다.");
      }
      if (partialErrors?.owned) {
        triggerToast("보유 옷을 불러오지 못했습니다. 위시리스트만 표시합니다.");
      }
    } catch (err) {
      const isNetwork =
          axios.isAxiosError(err) &&
          (err.code === "ERR_NETWORK" || err.message === "Network Error");

      if (axios.isAxiosError(err) && err.response?.status === 401) {
        clearAuthToken();
      }

      setError(
          isNetwork
              ? "백엔드에 연결할 수 없습니다. E:\\AIBE5_FinalProject_Team4_BE 에서 docker-compose up -d 후 .\\gradlew bootRun 으로 8080 포트를 띄운 뒤 다시 시도해 주세요."
              : "옷장 데이터를 불러오지 못했습니다. 백엔드 서버와 로그인 상태를 확인해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId, setClothes, setSelectedGarment, triggerToast]);

  useEffect(() => {
    loadWardrobe();
  }, [loadWardrobe]);

  const ownedStatsRefreshKey = useMemo(
      () =>
          clothes
              .filter((c) => !c.isWishlist)
              .map((c) => `${c.id}:${(c.be?.styleCodes ?? []).join("+")}`)
              .sort()
              .join("|"),
      [clothes],
  );

  useEffect(() => {
    if (loading || error) return;
    if (skipStatsRefreshRef.current) {
      skipStatsRefreshRef.current = false;
      return;
    }
    void refreshWardrobeStats();
  }, [ownedStatsRefreshKey, loading, error, refreshWardrobeStats]);

  const upsertGarment = (updated: Garment) => {
    setClothes((prev) =>
        prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
    if (selectedRef.current?.id === updated.id) {
      setSelectedGarment(updated);
    }
  };

  const handleGarmentDeleted = (clothesId: string) => {
    setClothes((prev) => prev.filter((c) => c.id !== clothesId));
    setSelectedGarment(null);
  };

  // Helper values
  const ownedList = useMemo(() => clothes.filter(c => !c.isWishlist), [clothes]);
  const wishlistList = useMemo(() => clothes.filter(c => c.isWishlist), [clothes]);
  const favoritesList = useMemo(() => clothes.filter(c => c.isFavorite), [clothes]);
  const favoritesCount = favoritesList.length;

  // Filtered list
  const filteredClothes = useMemo(() => {
    const list =
        closetTab === "owned"
            ? ownedList
            : closetTab === "wishlist"
                ? wishlistList
                : favoritesList;
    if (closetFilter === "All") return list;
    return list.filter(item => item.category === closetFilter);
  }, [closetTab, closetFilter, ownedList, wishlistList, favoritesList]);

  // Categories count for dynamic charts or labels
  const categoriesCount = useMemo(() => {
    const counts = { Top: 0, Bottom: 0, Outer: 0, Shoes: 0 };
    const list =
      closetTab === "owned"
        ? ownedList
        : closetTab === "wishlist"
          ? wishlistList
          : favoritesList;

    list.forEach(c => {
      counts[c.category as keyof typeof counts] = (counts[c.category as keyof typeof counts] || 0) + 1;
    });
    return counts;
  }, [closetTab, ownedList, wishlistList, favoritesList]);

  const STYLE_STATS_TOP_N = 5;

  const topStyleStats = useMemo(() => {
    const payloads = wardrobeStats?.userStylePayloads ?? [];
    return payloads
        .filter((s) => s.wardrobeWeight > 0)
        .slice(0, STYLE_STATS_TOP_N)
        .map((s) => ({
          code: s.styleCode,
          label: s.styleName || getGarmentStyleLabel(s.styleCode),
          weight: s.wardrobeWeight,
        }));
  }, [wardrobeStats]);

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const item = clothes.find((c) => c.id === id);
    if (!item) return;

    const nextFavorite = !item.isFavorite;
    setClothes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isFavorite: nextFavorite } : c)),
    );

    try {
      const updated = await updateClothesFavorite(Number(id), nextFavorite);
      upsertGarment(updated);
      triggerToast(
          nextFavorite
              ? "❤️ 즐겨찾기에 등록되었습니다."
              : "💔 즐겨찾기에서 해제되었습니다.",
      );
    } catch {
      setClothes((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isFavorite: item.isFavorite } : c)),
      );
      triggerToast("즐겨찾기 변경에 실패했습니다.");
    }
  };

  const handlePromoteToOwned = async (item: Garment) => {
    const imageUrl = item.userImageUrl ?? item.thumbnailUrl;
    if (!imageUrl?.startsWith("http")) {
      triggerToast("보유 전환에 필요한 이미지 URL이 없습니다.");
      return;
    }

    // 낙관적 업데이트: API 응답 전에 즉시 UI 반영
    setClothes((prev) =>
      prev.map((c) => c.id === item.id ? { ...c, isWishlist: false } : c)
    );
    setClosetTab("owned");

    try {
      const updated = await convertWishlistToOwned(Number(item.id), {
        productCode: item.productCode ?? "UNKNOWN",
        size: item.size ?? "FREE",
        userImageUrl: imageUrl,
        isVerified: false,
      });
      // 서버 응답으로 최종 상태 확정
      upsertGarment(updated);
      void refreshWardrobeStats();
      triggerToast(`🛍️ "${item.name}" 이(가) 보유 옷장으로 이동했습니다!`);
    } catch {
      // 실패 시 롤백
      setClothes((prev) =>
        prev.map((c) => c.id === item.id ? { ...c, isWishlist: true } : c)
      );
      setClosetTab("wishlist");
      triggerToast("보유 옷장 전환에 실패했습니다.");
    }
  };

  if (loading) return <Spinner />;
  if (error) {
    return (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center space-y-3">
          <p className="text-sm font-bold text-rose-800">{error}</p>
          <button
              type="button"
              onClick={loadWardrobe}
              className="text-xs font-black text-[#1E3A8A] underline cursor-pointer"
          >
            다시 시도
          </button>
        </div>
    );
  }

  return (
      <div className="space-y-6 animate-fade-in font-sans">

        {/* Dynamic Floating Notification Toast */}
        {toastMessage && (
            <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-4">
              <div className="pointer-events-auto flex max-w-full items-center gap-2 rounded-2xl border border-emerald-400 bg-[#1E3A8A] px-5 py-3 text-center text-xs font-black text-[#BBF7D0] shadow-xl animate-bounce">
                <Sparkle className="w-4 h-4 shrink-0 text-emerald-300 animate-spin" />
                <span className="truncate">{toastMessage}</span>
              </div>
            </div>
        )}

        {/* ========================================================================= */}
        {/* 1. HERO BANNER: WARM COSMOS SUNSET COZY CONTAINER */}
        {/* ========================================================================= */}
        <div className="rounded-[32px] bg-gradient-to-br from-[#FFF3DA] via-[#FCE3BF] to-[#FBD0C4] border border-orange-100/60 p-6 md:p-8 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 shadow-xs text-left">

          {/* Soft custom curved wave decor elements */}
          <div className="absolute inset-x-0 bottom-0 h-24 opacity-30 mix-blend-multiply pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 1440 320" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
              <path d="M0,160L48,176C96,192,192,224,288,218.7C384,213,480,171,576,160C672,149,768,171,864,186.7C960,203,1056,213,1152,197.3C1248,181,1344,139,1392,117.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" fill="#F8B1A5"></path>
            </svg>
          </div>

          {/* Left text column */}
          <div className="space-y-4 flex-1 relative z-5 select-none text-left">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-1.5 text-orange-700 font-extrabold text-xs">
                <Flame className="w-3.5 h-3.5" />
                <span>SMART fashion collections</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                내 스마트 옷장 컬렉션
              </h1>
            </div>

            {/* Core Mini Smart Stats counter grid */}
            <div className="grid grid-cols-3 gap-2.5 max-w-md pt-1">
              <div className="bg-white/85 p-3 rounded-2xl border border-white/40 text-left space-y-0.5">
                <span className="text-[10px] md:text-[11px] text-slate-500 font-extrabold block leading-none">보유 옷</span>
                <span className="text-lg md:text-xl font-black text-[#1E3A8A] block tabular-nums">{ownedList.length}벌</span>
              </div>
              <div className="bg-white/85 p-3 rounded-2xl border border-white/40 text-left space-y-0.5">
                <span className="text-[10px] md:text-[11px] text-slate-500 font-extrabold block leading-none">미보유 옷</span>
                <span className="text-lg md:text-xl font-black text-orange-600 block tabular-nums">{wishlistList.length}벌</span>
              </div>
              <div className="bg-white/85 p-3 rounded-2xl border border-white/40 text-left space-y-0.5">
                <span className="text-[10px] md:text-[11px] text-slate-500 font-extrabold block leading-none">즐겨찾기</span>
                <span className="text-lg md:text-xl font-black text-rose-600 block tabular-nums">{favoritesCount}벌</span>
              </div>
            </div>
          </div>

          {/* Right Mascot column: Cute animated sliding wardrobe or cabinet illustration */}
          <ClosetWardrobeMascot className="relative shrink-0 w-36 h-40 md:w-40 md:h-44" />

        </div>

        {/* ========================================================================= */}
        {/* 2–4. 컬렉션 + 오른쪽(스타일 통계 · 상세) */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-x-6 gap-y-4 items-start">
          {/* Left: 탭 · 필터 · 컬렉션 */}
          <div className="lg:col-span-3 space-y-4 text-left order-2 lg:order-1">
            {/* TAB + 즐겨찾기 (한 줄) */}
            <div ref={tabRef} className="grid grid-cols-3 gap-2 bg-slate-100 p-1.5 rounded-2xl select-none w-full">
              <button
                  onClick={() => {
                    setClosetTab("owned");
                    setSelectedGarment(null);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
                      closetTab === "owned"
                          ? "bg-white text-[#1E3A8A] shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-850"
                  }`}
              >
                <Award className={`w-4 h-4 shrink-0 ${closetTab === "owned" ? "text-emerald-500" : "text-slate-400"}`} />
                <span className="truncate">보유 의상 ({ownedList.length})</span>
              </button>

              <button
                  onClick={() => {
                    setClosetTab("wishlist");
                    setSelectedGarment(null);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
                      closetTab === "wishlist"
                          ? "bg-white text-[#1E3A8A] shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-850"
                  }`}
              >
                <ShoppingBag className={`w-4 h-4 shrink-0 ${closetTab === "wishlist" ? "text-orange-500" : "text-slate-400"}`} />
                <span className="truncate">위시리스트 ({wishlistList.length})</span>
              </button>

              <button
                  type="button"
                  onClick={() => {
                    setClosetTab("favorites");
                    setSelectedGarment(null);
                  }}
                  className={`py-2.5 px-2 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer min-w-0 ${
                      closetTab === "favorites"
                          ? "bg-white text-[#1E3A8A] shadow-sm border border-slate-200/50"
                          : "text-slate-500 hover:text-slate-850"
                  }`}
              >
                <Heart className={`w-4 h-4 shrink-0 ${closetTab === "favorites" ? "fill-rose-500 text-rose-500" : "text-slate-400"}`} />
                <span className="truncate">즐겨찾기 ({favoritesCount})</span>
              </button>
            </div>

            <div ref={filterRef} className="grid grid-cols-5 gap-2 w-full select-none text-left">
              {["All", "Top", "Bottom", "Outer", "Shoes"].map((cat) => {
                const isSelected = closetFilter === cat;
                return (
                    <button
                        key={cat}
                        onClick={() => setClosetFilter(cat)}
                        className={`w-full min-w-0 px-2 py-2.5 rounded-full text-[11px] sm:text-xs font-bold transition-all duration-200 border cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 ${
                            isSelected
                                ? "bg-[#1E3A8A] text-white border-transparent shadow-xs"
                                : "bg-white text-slate-500 border-slate-200 hover:border-slate-350"
                        }`}
                    >
              <span className="text-sm leading-none">
                {cat === "All" && "📂"}
                {cat === "Top" && "👕"}
                {cat === "Bottom" && "👖"}
                {cat === "Outer" && "🧥"}
                {cat === "Shoes" && "👟"}
              </span>
                      <span className="truncate max-w-full text-center">
                {cat === "All" && "전체"}
                        {cat === "Top" && `상의 (${categoriesCount.Top})`}
                        {cat === "Bottom" && `하의 (${categoriesCount.Bottom})`}
                        {cat === "Outer" && `아우터 (${categoriesCount.Outer})`}
                        {cat === "Shoes" && `신발 (${categoriesCount.Shoes})`}
              </span>
                    </button>
                );
              })}
            </div>

            <div className="flex justify-between items-center select-none pb-1.5">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>
                {closetTab === "owned"
                    ? "보유 컬렉션 목록"
                    : closetTab === "wishlist"
                        ? "스마트 위시 보드"
                        : "즐겨찾기 컬렉션"}
              </span>
              </h2>
            </div>

            <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredClothes.map((item) => {
                const isSelected = selectedGarment?.id === item.id;

                // Custom pastel colors to map nicely
                let cardBg = "from-sky-50 to-white";
                if (item.category === "Top") cardBg = "from-[#ECF5FD] to-white";
                else if (item.category === "Bottom") cardBg = "from-[#EAF9F5] to-white";
                else if (item.category === "Outer") cardBg = "from-[#FFF5F3] to-white";
                else if (item.category === "Shoes") cardBg = "from-[#FFFDF0] to-white";

                return (
                    <div
                        key={item.id}
                        onClick={() => setSelectedGarment(item)}
                        className={`aspect-square bg-gradient-to-tr ${cardBg} rounded-[24px] border-2 transition-all duration-300 relative p-3 text-left cursor-pointer group hover:scale-101 flex flex-col overflow-hidden ${
                            isSelected
                                ? "border-[#1E3A8A] ring-4 ring-[#1E3A8A]/10 shadow-md"
                                : "border-slate-100 hover:border-slate-300 shadow-3xs"
                        }`}
                    >

                      {/* Absolute category badge hanger icon floating left */}
                      <div className="absolute top-2 left-2 bg-white/95 px-2 py-1 rounded-lg border border-slate-150/40 text-[9px] font-extrabold text-slate-500 font-mono tracking-tight shadow-3xs z-5 flex items-center gap-1">
                    <span>
                      {item.category === "Top" && "👕"}
                      {item.category === "Bottom" && "👖"}
                      {item.category === "Outer" && "🧥"}
                      {item.category === "Shoes" && "👟"}
                    </span>
                        <span>{item.category}</span>
                      </div>

                      {/* Top Heart favorite picker button */}
                      <button
                          onClick={(e) => toggleFavorite(item.id, e)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/95 hover:bg-white text-rose-500 border border-slate-100 shadow-3xs transition-transform duration-200 active:scale-90 cursor-pointer z-5 hover:rotate-3"
                          title="즐겨찾기"
                      >
                        <Heart className={`w-3.5 h-3.5 transition-colors ${item.isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-350"}`} />
                      </button>

                      {/* Apparel Display visual slot */}
                      <div className="flex-1 min-h-0 mt-5 bg-[#F8FAFC]/55 rounded-2xl flex items-center justify-center overflow-hidden border border-slate-50 relative select-none">
                        {item.thumbnailUrl ? (
                            <AuthenticatedImage
                                src={item.thumbnailUrl}
                                alt={item.name}
                                className="w-full h-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                                fallback={
                                  <span className="text-4xl filter drop-shadow-sm select-none">👚</span>
                                }
                            />
                        ) : (
                            <span className="text-4xl filter drop-shadow-sm select-none">👚</span>
                        )}
                      </div>

                      {/* Descriptions texts */}
                      <div className="shrink-0 pt-2 space-y-1">
                        <h4 className="text-[12px] sm:text-[13px] font-black text-slate-800 tracking-tight leading-snug line-clamp-1 group-hover:text-[#1E3A8A] transition">{item.name}</h4>

                        <div className="flex items-center gap-1 flex-wrap text-[9px] text-slate-400 font-bold select-none">
                          <span className="bg-slate-100 hover:bg-slate-200/60 px-1.5 py-0.5 rounded-md text-slate-500 transition">{item.color}</span>
                          <span className="bg-slate-100 hover:bg-slate-200/60 px-1.5 py-0.5 rounded-md text-slate-500 transition line-clamp-1 truncate max-w-[72px]">{item.fitType}</span>
                        </div>

                        {/* Specialized wishlist Promotion button */}
                        {item.isWishlist && (
                            <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePromoteToOwned(item);
                                }}
                                className="w-full mt-1 h-7 text-[9px] font-black rounded-lg bg-orange-100 text-orange-900 border border-orange-250 hover:bg-orange-200 transition-all duration-200 flex items-center justify-center space-x-1 shadow-3xs cursor-pointer focus:ring-2 focus:ring-orange-300 active:scale-95"
                            >
                              <HeartHandshake className="w-3 h-3 text-orange-700 animate-pulse" />
                              <span>옷장입고</span>
                            </button>
                        )}
                      </div>

                    </div>
                );
              })}

              {/* Empty view status fallbacks */}
              {filteredClothes.length === 0 && (
                  <div className="col-span-full text-center py-12 px-6 bg-white rounded-3xl border-2 border-dashed border-slate-200 select-none">
                    <span className="text-4xl block mb-2">📦</span>
                    <p className="text-xs text-slate-500 font-bold">선택하신 카테고리의 의상이 비어있습니다.</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                      하단의 <strong>옷 등록</strong> 버튼으로 구매내역 또는 사진 기반 등록을 시작해 보세요.
                    </p>
                  </div>
              )}
            </div>
          </div>

          {/* Right: 스타일 통계(상단) + 의상 상세 */}
          <aside className="lg:col-span-2 space-y-4 order-1 lg:order-2 lg:sticky lg:top-4 self-start">
            <div className="bg-white rounded-[24px] border border-slate-100 p-5 shadow-2xs text-left space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">
                    옷 스타일 통계
                  </h3>
                  <span className="shrink-0 text-xs font-black px-2.5 py-0.5 rounded-full bg-[#1E3A8A] text-[#BBF7D0]">
                  TOP {STYLE_STATS_TOP_N}
                </span>
                </div>
                <span className="text-sm text-slate-500 font-bold shrink-0">
                보유 {ownedList.length}벌 기준
              </span>
              </div>

              {topStyleStats.length > 0 ? (
                  <div className="space-y-3">
                    {topStyleStats.map((style) => (
                        <div key={style.code} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm font-bold gap-2">
                            <span className="text-slate-600 truncate">{style.label}</span>
                            <span className="text-emerald-600 tabular-nums shrink-0">{style.weight}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-slate-200 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#BBF7D0] transition-all duration-500"
                                style={{ width: `${Math.min(style.weight, 100)}%` }}
                            />
                          </div>
                        </div>
                    ))}
                  </div>
              ) : (
                  <p className="text-sm text-slate-500 leading-relaxed py-2">
                    보유 옷을 등록하면 내 옷장 스타일 비율이 여기에 표시됩니다.
                  </p>
              )}
            </div>

            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              의상 상세
            </h3>

            <ClosetGarmentDetail
                garment={selectedGarment}
                userId={userId}
                onGarmentChange={setSelectedGarment}
                onGarmentUpdated={upsertGarment}
                onGarmentDeleted={handleGarmentDeleted}
                onToast={triggerToast}
            />
          </aside>

        </div>

        {/* 옷 등록 — 방식 선택 모달 진입 */}
        <div className="fixed bottom-20 left-0 right-0 z-20 flex justify-center px-5 pointer-events-none">
          <button
              id="btn-closet-register"
              type="button"
              onClick={onOpenRegister}
              className="pointer-events-auto flex items-center gap-2 h-11 px-6 rounded-2xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-[#BBF7D0] shadow-lg font-bold text-sm transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>옷 등록</span>
          </button>
        </div>

        {tourOpen && (
            <GuideTour
                steps={[
                  { targetRef: tabRef, message: "보유·미보유·즐겨찾기로 내 옷을 분류해서 볼 수 있어요" },
                  { targetRef: filterRef, message: "카테고리 필터로 원하는 종류의 옷만 빠르게 찾을 수 있어요" },
                  { targetRef: gridRef, message: "옷을 즐겨찾기하면 AI 코디 매칭에 우선 반영돼요" },
                ]}
                onComplete={() => {
                  setTourOpen(false)
                  onGuideTourComplete()
                }}
            />
        )}

        {!tourOpen && (
            <button
                type="button"
                className="fixed right-5 bottom-20 z-40 w-11 h-11 rounded-full bg-white border border-slate-200 text-[#1E3A8A] shadow-lg flex items-center justify-center transition active:scale-90"
                onClick={() => setTourOpen(true)}
            >?</button>
        )}
      </div>
  );
}
