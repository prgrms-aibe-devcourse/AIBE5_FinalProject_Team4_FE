/* Todo: data를 실제로 쓸 준비가 되면 다시 추가
import Spinner from "@/components/common/Spinner";
import useApi from "@/hooks/useApi";
 */
import React, { useState, useMemo } from "react";
import { 
  Heart, 
  Layers, 
  Sparkles, 
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
  toggleFavorite: (id: string, e: React.MouseEvent) => void;
  moveToOwnedCloset: (id: string) => void;
}

export default function ClosetTab({
  clothes,
  setClothes,
  selectedGarment,
  setSelectedGarment,
  toggleFavorite,
  moveToOwnedCloset
}: ClosetTabProps) {
  // const {data, error, loading} = useApi('/api/v1/wardrobes/users/1'); Todo: data를 실제로 쓸 준비가 되면 다시 추가
  const [closetTab, setClosetTab] = useState<"owned" | "wishlist">("owned");
  const [closetFilter, setClosetFilter] = useState<string>("All");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
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

  // Handle wishlist promotion with visual feedback
  const handlePromoteToOwned = (id: string, name: string) => {
    moveToOwnedCloset(id);
    triggerToast(`🛍️ 축하합니다! "${name}" 의상이 최상단 보유 옷장 목록으로 이동했습니다!`);
  };

  /* Todo: data를 실제로 쓸 준비가 되면 다시 추가
  if(loading) return <Spinner />;
  if(error) return <div>{error}</div>;
   */

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
      {/* 3. HORIZONTAL CATEGORIES BAR */}
      {/* ========================================================================= */}
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
                    onClick={(e) => {
                      toggleFavorite(item.id, e);
                      triggerToast(item.isFavorite ? "💔 최애 목록에서 해제되었습니다." : "❤️ 최애 아이템으로 등록되어 홈 피드에서 추천 가중치가 가산되었습니다!");
                    }}
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
                          handlePromoteToOwned(item.id, item.name);
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

        {/* Right Active Drawer Card Column (Span 1) */}
        <div className="space-y-4">
          
          <div className="flex items-center space-x-2 select-none justify-between lg:justify-start">
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>의상 상세 분석 정보</span>
            </h3>
            <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-mono">SPEC SHEET</span>
          </div>

          {selectedGarment ? (
            <div className="space-y-5">
              
              {/* Card Meta Banner */}
              <div className="bg-white rounded-[24px] border border-slate-100 p-4.5 flex items-start gap-3.5 shadow-2xs text-left">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                  {selectedGarment.category === "Top" && <span className="text-2xl select-none">👕</span>}
                  {selectedGarment.category === "Bottom" && <span className="text-2xl select-none">👖</span>}
                  {selectedGarment.category === "Outer" && <span className="text-2xl select-none">🧥</span>}
                  {selectedGarment.category === "Shoes" && <span className="text-2xl select-none">👟</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-[9px] font-black text-indigo-750 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md uppercase font-mono tracking-wider font-bold">INFO SPEC</span>
                    <span className="text-[9px] text-[#1E3A8A] font-bold font-mono">STYLE CHECK</span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 truncate mt-0.5 leading-tight">{selectedGarment.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold truncate">소재: {selectedGarment.fabricMaterial} | 스타일: {selectedGarment.style}</p>
                </div>
              </div>

              {/* Gamyagi AI Smart Consultation comment */}
              <div className="bg-slate-900 text-slate-300 p-5 rounded-[24px] space-y-4 font-mono text-xs relative overflow-hidden text-left shadow-md">
                <div className="absolute -top-12 -right-12 w-28 h-28 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>
                <div className="flex items-center space-x-1.5 text-[#BBF7D0] font-black text-[12px] border-b border-white/10 pb-2.5">
                  <Layers className="w-4 h-4 animate-spin [animation-duration:12s]" />
                  <span>GARMENT SPECIFICATION</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10.5px]">
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">CATEGORY:</span>
                    <p className="font-bold text-white uppercase">{selectedGarment.category}_LAYER</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">COLOUR HUE:</span>
                    <p className="font-bold text-white text-emerald-300">{selectedGarment.color}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">SILHOUETTE FIT:</span>
                    <p className="font-bold text-white">{selectedGarment.fitType || "Standard Silhouette"}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block uppercase tracking-wider text-[9px] font-black">FABRIC:</span>
                    <p className="font-bold text-emerald-300 truncate">{selectedGarment.fabricMaterial}</p>
                  </div>
                </div>

                {/* Match comment panel from AI adviser */}
                <div className="space-y-1 border-t border-white/10 pt-3 text-[11px] text-slate-400 font-sans">
                  <div className="flex items-center space-x-1.5 text-[#BBF7D0] text-[11.5px] font-black mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>감각이의 스타일 코칭 조합법</span>
                  </div>
                  <p className="leading-relaxed leading-normal text-slate-300 text-justify text-[10.5px]">
                    "이 {selectedGarment.category === "Top" ? "상의" : selectedGarment.category === "Bottom" ? "하의" : selectedGarment.category === "Outer" ? "아우터" : "신발"}는 
                    {selectedGarment.color} 컬러감이 지닌 {selectedGarment.style} 톤의 미묘한 정서를 기반으로 합니다. 
                    인체 골격 접합부와의 조화에 따라 실루엣 드레이프가 보정 및 최적 세정 매치되므로 일상에서 매끄러우면서도 아주 편안한 하루를 받쳐줍니다."
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 flex flex-col justify-center items-center h-72 select-none">
              <span className="text-3xl block mb-2">👚</span>
              <h4 className="text-xs font-bold text-slate-700">의상 분석 상세 정보</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal">
                좌측 컬렉션에서 임의의 의상을 터치해보세요. 등록된 의품의 물성과 색조, 감착 어드바이스 및 스타일 가이드를 한눈에 조회할 수 있는 전용 분석 명세서가 표시됩니다.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
