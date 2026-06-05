import React, { useState, useMemo, useEffect, useCallback, useRef } from "react";
import Spinner from "@/components/common/Spinner";
import {
  fetchWardrobeGarments,
  fetchWardrobeMeta,
  updateClothesFavorite,
  convertWishlistToOwned,
} from "@/api/wardrobe";
import { clearDevToken } from "@/utils/ensureDevToken";
import axios from "axios";
import ClosetGarmentDetail from "@/components/ClosetGarmentDetail";
import { 
  Heart, 
  ShoppingBag, 
  Flame, 
  Award, 
  HeartHandshake,
  ChevronRight,
  Sparkle
} from "./icons";
import { Garment } from "@/types/index";

interface ClosetTabProps {
  clothes: Garment[];
  setClothes: React.Dispatch<React.SetStateAction<Garment[]>>;
  selectedGarment: Garment | null;
  setSelectedGarment: (g: Garment | null) => void;
  /** JWT sub와 일치하는 인증 사용자 ID (App에서 전달) */
  userId: number;
}

export default function ClosetTab({
  clothes,
  setClothes,
  selectedGarment,
  setSelectedGarment,
  userId,
}: ClosetTabProps) {
  const [closetTab, setClosetTab] = useState<"owned" | "wishlist">("owned");
  const [closetFilter, setClosetFilter] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [wardrobeId, setWardrobeId] = useState<number | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const selectedRef = useRef<Garment | null>(null);

  useEffect(() => {
    selectedRef.current = selectedGarment;
  }, [selectedGarment]);

  const triggerToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const loadWardrobe = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const meta = await fetchWardrobeMeta(userId);
      setWardrobeId(meta?.wardrobeId ?? null);

      const { garments, partialErrors } = await fetchWardrobeGarments(userId, {
        favoritesOnly: showFavoritesOnly,
      });
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
        clearDevToken();
      }

      setError(
        isNetwork
          ? "백엔드에 연결할 수 없습니다. E:\\AIBE5_FinalProject_Team4_BE 에서 docker-compose up -d 후 .\\gradlew bootRun 으로 8080 포트를 띄운 뒤 다시 시도해 주세요."
          : "옷장 데이터를 불러오지 못했습니다. BE(local:8080) 실행·local 프로필·mock-token을 확인해 주세요.",
      );
    } finally {
      setLoading(false);
    }
  }, [userId, setClothes, setSelectedGarment, showFavoritesOnly, triggerToast]);

  useEffect(() => {
    loadWardrobe();
  }, [loadWardrobe]);

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
  const favoritesCount = useMemo(() => clothes.filter(c => c.isFavorite).length, [clothes]);

  // Filtered list
  const filteredClothes = useMemo(() => {
    const list = closetTab === "owned" ? ownedList : wishlistList;
    if (closetFilter === "All") return list;
    return list.filter(item => item.category === closetFilter);
  }, [closetTab, closetFilter, ownedList, wishlistList]);

  // Categories count for dynamic charts or labels
  const categoriesCount = useMemo(() => {
    const counts = { Top: 0, Bottom: 0, Outer: 0, Shoes: 0 };
    clothes.forEach(c => {
      if (!c.isWishlist) {
        counts[c.category] = (counts[c.category] || 0) + 1;
      }
    });
    return counts;
  }, [clothes]);

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
          ? "❤️ 최애 아이템으로 등록되었습니다."
          : "💔 최애 목록에서 해제되었습니다.",
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

    try {
      const updated = await convertWishlistToOwned(Number(item.id), {
        productCode: item.productCode ?? "UNKNOWN",
        size: item.size ?? "FREE",
        userImageUrl: imageUrl,
        isVerified: false,
      });
      upsertGarment(updated);
      setClosetTab("owned");
      triggerToast(`🛍️ "${item.name}" 이(가) 보유 옷장으로 이동했습니다!`);
    } catch {
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
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 bg-[#1E3A8A] text-[#BBF7D0] px-5 py-3 rounded-2xl shadow-xl text-xs font-black border border-emerald-400 flex items-center gap-2 animate-bounce">
          <Sparkle className="w-4 h-4 text-emerald-300 animate-spin" />
          <span>{toastMessage}</span>
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
            <h1 className="text-2xl md:text-3xl font-black text-slate-910 text-slate-900 tracking-tight leading-none">
              내 스마트 옷장 컬렉션
            </h1>
            <p className="text-xs text-slate-550 text-slate-600 font-bold leading-relaxed max-w-md">
              보유 중인 품목을 조회하고, 위시리스트 아이템을 내 옷장으로 편입시켜 가상 해부학 핏(Fit) 시뮬레이션으로 코디의 완벽율을 높여보세요.
            </p>
            {wardrobeId != null && (
              <p className="text-[10px] text-slate-500 font-mono">
                옷장 ID: {wardrobeId} · 회원 {userId}
              </p>
            )}
          </div>

          {/* Core Mini Smart Stats counter grid */}
          <div className="grid grid-cols-3 gap-2 max-w-sm pt-2">
            <div className="bg-white/80 p-2.5 rounded-2xl border border-white/40 text-left space-y-0.5">
              <span className="text-[9px] text-slate-400 font-extrabold block uppercase leading-none">보유중</span>
              <span className="text-sm font-black text-[#1E3A8A] block">{ownedList.length}벌</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-2xl border border-white/40 text-left space-y-0.5">
              <span className="text-[9px] text-slate-400 font-extrabold block uppercase leading-none">위시리스트</span>
              <span className="text-sm font-black text-orange-650 block">{wishlistList.length}벌</span>
            </div>
            <div className="bg-white/80 p-2.5 rounded-2xl border border-white/40 text-left space-y-0.5">
              <span className="text-[9px] text-slate-400 font-extrabold block uppercase leading-none">고정밀 최애</span>
              <span className="text-sm font-black text-rose-600 block">{favoritesCount}벌</span>
            </div>
          </div>
        </div>

        {/* Right Mascot column: Cute animated sliding wardrobe or cabinet illustration */}
        <div className="relative shrink-0 w-32 h-36 flex items-center justify-center select-none">
          {/* Animated hanging star sticker above wardrobe */}
          <div className="absolute -top-3 right-0 w-10 h-10 animate-bounce">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-amber-300">
              <path d="M12 2 L15 9 L22 10 L17 15 L18 22 L12 18 L6 22 L7 15 L2 10 L9 9 Z" fill="#FFF3A5" stroke="#334155" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>

          {/* Cute Wardrobe Mascot */}
          <svg className="w-24 h-28 drop-shadow-md" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Wardrobe frame/body */}
            <rect x="15" y="10" width="70" height="100" rx="10" fill="#FFF" stroke="#334155" strokeWidth="2.5" />
            <line x1="50" y1="10" x2="50" y2="100" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
            {/* Wooden drawers at base */}
            <rect x="20" y="85" width="28" height="18" rx="4" fill="#FFEAA7" stroke="#334155" strokeWidth="2" />
            <rect x="52" y="85" width="28" height="18" rx="4" fill="#FFEAA7" stroke="#334155" strokeWidth="2" />
            <circle cx="34" cy="94" r="2.5" fill="#334155" />
            <circle cx="66" cy="94" r="2.5" fill="#334155" />
            {/* Door handles */}
            <rect x="44" y="40" width="3" height="16" rx="1.5" fill="#334155" />
            <rect x="53" y="40" width="3" height="16" rx="1.5" fill="#334155" />
            {/* Cute eyes & blush on the left door representing smart cabinet bot */}
            <circle cx="30" cy="35" r="2.2" fill="#334155" />
            <circle cx="40" cy="35" r="2.2" fill="#334155" />
            <circle cx="26" cy="39" r="3" fill="#FAA" />
            <circle cx="44" cy="39" r="3" fill="#FAA" />
            <path d="M 33,39 Q 35,42 37,39" stroke="#334155" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 2. TAB TOGGLER (OWNED vs WISHLIST) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl select-none max-w-md mx-auto md:mx-0">
        <button
          onClick={() => {
            setClosetTab("owned");
            setSelectedGarment(null);
          }}
          className={`py-3 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
            closetTab === "owned"
              ? "bg-white text-[#1E3A8A] shadow-sm scale-101 border border-slate-200/50"
              : "text-slate-500 hover:text-slate-850"
          }`}
        >
          <Award className={`w-4 h-4 ${closetTab === "owned" ? "text-emerald-500" : "text-slate-400"}`} />
          <span>보유 의상 ({ownedList.length})</span>
        </button>
        
        <button
          onClick={() => {
            setClosetTab("wishlist");
            setSelectedGarment(null);
          }}
          className={`py-3 rounded-xl text-xs font-black tracking-tight transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer ${
            closetTab === "wishlist"
              ? "bg-white text-[#1E3A8A] shadow-sm scale-101 border border-slate-200/50"
              : "text-slate-500 hover:text-slate-850"
          }`}
        >
          <ShoppingBag className={`w-4 h-4 ${closetTab === "wishlist" ? "text-orange-500 font-black animate-pulse" : "text-slate-400"}`} />
          <span>위시리스트 ({wishlistList.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTER: FAVORITES + CATEGORIES */}
      {/* ========================================================================= */}
      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          onClick={() => setShowFavoritesOnly((v) => !v)}
          className={`px-4 py-2 rounded-full text-xs font-black border cursor-pointer ${
            showFavoritesOnly
              ? "bg-rose-500 text-white border-rose-500"
              : "bg-white text-slate-500 border-slate-200"
          }`}
        >
          ❤️ 즐겨찾기만
        </button>
      </div>

      <div className="flex space-x-2 overflow-x-auto pb-1.5 scrollbar-none select-none text-left">
        {["All", "Top", "Bottom", "Outer", "Shoes"].map((cat) => {
          const isSelected = closetFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setClosetFilter(cat)}
              className={`px-4.5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border cursor-pointer flex items-center space-x-1.5 ${
                isSelected
                  ? "bg-[#1E3A8A] text-white border-transparent shadow-xs scale-102"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-350"
              }`}
            >
              <span className="text-[14px]">
                {cat === "All" && "📂"}
                {cat === "Top" && "👕"}
                {cat === "Bottom" && "👖"}
                {cat === "Outer" && "🧥"}
                {cat === "Shoes" && "👟"}
              </span>
              <span>
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

      {/* ========================================================================= */}
      {/* 4. MAIN LAYOUT DECK DESIGN */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6.5 items-start">
        
        {/* Left Grid Area (Span 2): Collections Catalog Cards */}
        <div className="lg:col-span-2 space-y-4 text-left">
          <div className="flex justify-between items-center select-none pb-1.5">
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <span>{closetTab === "owned" ? "보유 컬렉션 목록" : "스마트 위시 보드"}</span>
              <span className="text-slate-400 font-normal text-xs">({filteredClothes.length}개 발견됨)</span>
            </h2>
            <div className="flex items-center space-x-1 text-xs text-[#1E3A8A] font-bold">
              <span>스펙 조율 기동</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
                  className={`bg-gradient-to-tr ${cardBg} rounded-[24px] border-2 transition-all duration-300 relative p-4 text-left cursor-pointer group hover:scale-101 ${
                    isSelected 
                      ? "border-[#1E3A8A] ring-4 ring-[#1E3A8A]/10 shadow-md" 
                      : "border-slate-100 hover:border-slate-300 shadow-3xs"
                  }`}
                >
                  
                  {/* Absolute category badge hanger icon floating left */}
                  <div className="absolute top-3 left-3 bg-white/95 px-2 py-1 rounded-lg border border-slate-150/40 text-[9px] font-extrabold text-slate-500 font-mono tracking-tight shadow-3xs z-5 flex items-center gap-1">
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
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-white/95 hover:bg-white text-rose-500 border border-slate-100 shadow-3xs transition-transform duration-200 active:scale-90 cursor-pointer z-5 hover:rotate-3"
                    title="최애 위시 저장"
                  >
                    <Heart className={`w-3.5 h-3.5 transition-colors ${item.isFavorite ? "fill-rose-500 text-rose-500" : "text-slate-350"}`} />
                  </button>

                  {/* Apparel Display visual slot */}
                  <div className="w-full h-32 bg-[#F8FAFC]/55 rounded-2xl mb-3 mt-4 flex items-center justify-center overflow-hidden border border-slate-50 relative select-none">
                    {item.thumbnailUrl ? (
                      <img 
                        src={item.thumbnailUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-103"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-4xl filter drop-shadow-sm select-none">👚</span>
                    )}

                    {/* Quick indicator check on favorited */}
                    {item.isFavorite && (
                      <span className="absolute bottom-2 left-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full shadow-2xs">
                        FAVORITE ⭐️
                      </span>
                    )}
                  </div>

                  {/* Descriptions texts */}
                  <div className="space-y-1">
                    <h4 className="text-[12px] font-black text-slate-800 tracking-tight leading-snug line-clamp-1 group-hover:text-[#1E3A8A] transition">{item.name}</h4>
                    
                    <div className="flex items-center gap-1 flex-wrap text-[10px] text-slate-400 font-bold select-none pt-0.5">
                      <span className="bg-slate-100 hover:bg-slate-200/60 px-1.5 py-0.5 rounded-md text-slate-500 transition">{item.color}</span>
                      <span className="bg-slate-100 hover:bg-slate-200/60 px-1.5 py-0.5 rounded-md text-slate-500 transition line-clamp-1 truncate max-w-[80px]">{item.fitType}</span>
                    </div>

                    {/* Specialized wishlist Promotion button */}
                    {item.isWishlist && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePromoteToOwned(item);
                        }}
                        className="w-full mt-3 h-8.5 text-[10.5px] font-black rounded-xl bg-orange-100 text-orange-900 border border-orange-250 hover:bg-orange-200 transition-all duration-200 flex items-center justify-center space-x-1 shadow-3xs cursor-pointer focus:ring-2 focus:ring-orange-300 active:scale-95"
                      >
                        <HeartHandshake className="w-3.5 h-3.5 text-orange-700 animate-pulse" />
                        <span>장만완료 ➔ 옷장입고!</span>
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
                  하단의 '+' 플로팅 추가 도구 파이프라인을 기동하어 AI 소매물성 보존 태깅 시스템으로 고정교정 옷을 투입해보세요!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right: BE 상세 / 수정 / 삭제 */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 select-none justify-between lg:justify-start">
            <h3 className="text-lg font-black text-slate-900 tracking-tight">
              의상 상세
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">
              BE 연동
            </span>
          </div>

          <ClosetGarmentDetail
            garment={selectedGarment}
            onGarmentChange={setSelectedGarment}
            onGarmentUpdated={upsertGarment}
            onGarmentDeleted={handleGarmentDeleted}
            onToast={triggerToast}
          />
        </div>

      </div>

    </div>
  );
}
