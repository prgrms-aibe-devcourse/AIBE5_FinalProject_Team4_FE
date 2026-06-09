import { useEffect, useMemo, useRef, useState } from "react";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import { fetchClothesRecommendations } from "@/api/recommendations";
import { AlertCircle, Shirt } from "./icons";
import { Garment } from "@/types/index";
import { extractApiErrorMessage } from "@/utils/apiError";
import { resolveClothesDisplayImageUrl } from "@/utils/clothesImageUrl";
import {
  mapClothesRecommendationResponseGrouped,
  type RecommendCardItem,
  type RecommendCategoryGroup,
} from "@/utils/recommendationMapper";
import { matchesUserGender, type UserGender } from "@/utils/genderClothesFilter";
import MatchAnchorWardrobeScroller from "@/components/MatchAnchorWardrobeScroller";
import MatchRecommendationByCategory from "@/components/MatchRecommendationByCategory";

interface HomeTabProps {
  clothes: Garment[];
  userId: number | null;
  gender: UserGender;
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
}

type RecommendationLabel = "ootd" | "style" | "similar" | "match" | "aimd";

type RecommendItem = RecommendCardItem;

const labelConfig: Record<
  RecommendationLabel,
  {
    title: string;
    subtitle: string;
    icon: string;
  }
> = {
  ootd: {
    title: "OOTD 추천",
    subtitle: "오늘 입기 좋은 코디",
    icon: "✨",
  },
  style: {
    title: "스타일 기반 추천",
    subtitle: "사용자 취향 기반",
    icon: "🎯",
  },
  similar: {
    title: "유사 상품 추천",
    subtitle: "보유/저장 옷과 유사",
    icon: "🛍️",
  },
  match: {
    title: "어울리는 옷 추천",
    subtitle: "",
    icon: "👕",
  },
  aimd: {
    title: "AI 페르소나 MD 추천",
    subtitle: "MD 코디 설명 제공",
    icon: "🤖",
  },
};

const labelTiltClasses: Record<
  RecommendationLabel,
  {
    card: string;
    activeCard: string;
    chip: string;
    activeChip: string;
  }
> = {
  ootd: {
    card: "rotate-0 hover:rotate-0",
    activeCard: "-rotate-3 md:-rotate-1 hover:rotate-0",
    chip: "rotate-0 hover:rotate-0",
    activeChip: "-rotate-2 hover:rotate-0",
  },
  style: {
    card: "rotate-0 hover:rotate-0",
    activeCard: "rotate-3 md:rotate-1 hover:rotate-0",
    chip: "rotate-0 hover:rotate-0",
    activeChip: "rotate-2 hover:rotate-0",
  },
  similar: {
    card: "rotate-0 hover:rotate-0",
    activeCard: "-rotate-[2.5deg] md:-rotate-[0.75deg] hover:rotate-0",
    chip: "rotate-0 hover:rotate-0",
    activeChip: "-rotate-[1.5deg] hover:rotate-0",
  },
  match: {
    card: "rotate-0 hover:rotate-0",
    activeCard: "rotate-3 md:rotate-[1deg] hover:rotate-0",
    chip: "rotate-0 hover:rotate-0",
    activeChip: "rotate-[1.5deg] hover:rotate-0",
  },
  aimd: {
    card: "rotate-0 hover:rotate-0",
    activeCard: "-rotate-2 md:rotate-[0.5deg] hover:rotate-0",
    chip: "rotate-0 hover:rotate-0",
    activeChip: "-rotate-1 hover:rotate-0",
  },
};

const fallbackImages = {
  Top: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600",
  Bottom: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600",
  Outer: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600",
  Shoes: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=600",
};

const baseRecommendations: Record<RecommendationLabel, RecommendItem[]> = {
  ootd: [
    {
      id: "ootd-1",
      title: "라이트 쉘 재킷 + 와이드 데님",
      category: "Outer",
      style: "Gorpcore",
      color: "Urban Khaki",
      price: "128,000원",
      matchRate: 98,
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600",
      reason: "쌀쌀하거나 비가 오는 날에도 가볍게 걸칠 수 있고, 와이드 데님과 매치하면 실루엣이 안정적입니다.",
    },
    {
      id: "ootd-2",
      title: "크루넥 티셔츠 + 크롭 슬랙스",
      category: "Top",
      style: "Minimal",
      color: "Souffle White",
      price: "39,000원",
      matchRate: 94,
      imageUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600",
      reason: "기본 아이템 중심이라 출근, 등교, 약속 모두 대응하기 쉽습니다.",
    },
    {
      id: "ootd-3",
      title: "니트 집업 + 카고 팬츠",
      category: "Top",
      style: "Casual",
      color: "Heather Gray",
      price: "89,000원",
      matchRate: 91,
      imageUrl: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&q=80&w=600",
      reason: "가볍게 걸쳐도 빈티지한 무드가 살아나고 활동성이 좋습니다.",
    },
    {
      id: "ootd-4",
      title: "블랙 블루종 + 테이퍼드 팬츠",
      category: "Outer",
      style: "Street",
      color: "Black",
      price: "132,000원",
      matchRate: 90,
      imageUrl: "https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&q=80&w=600",
      reason: "상의 볼륨과 하의 라인이 정리되어 하루 코디로 활용하기 좋습니다.",
    },
  ],
  style: [
    {
      id: "style-1",
      title: "미니멀 싱글 블레이저",
      category: "Outer",
      style: "Minimal",
      color: "Deep Charcoal",
      price: "145,000원",
      matchRate: 96,
      imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=600",
      reason: "선호 스타일의 무채색, 정돈된 라인, 낮은 장식성을 기준으로 추천했습니다.",
    },
    {
      id: "style-2",
      title: "릴렉스 와이드 원턱 팬츠",
      category: "Bottom",
      style: "Minimal",
      color: "Charcoal",
      price: "64,000원",
      matchRate: 93,
      imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&q=80&w=600",
      reason: "상의 선택 폭이 넓고, 현재 옷장 컬러와 충돌이 적습니다.",
    },
    {
      id: "style-3",
      title: "클린 코튼 셔츠",
      category: "Top",
      style: "Minimal",
      color: "White",
      price: "58,000원",
      matchRate: 92,
      imageUrl: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=600",
      reason: "취향 기반으로 가장 활용도 높은 기본 셔츠를 우선 추천했습니다.",
    },
    {
      id: "style-4",
      title: "로우탑 레더 스니커즈",
      category: "Shoes",
      style: "Minimal",
      color: "Off White",
      price: "109,000원",
      matchRate: 89,
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=600",
      reason: "미니멀 취향과 대부분의 하의에 자연스럽게 연결됩니다.",
    },
  ],
  similar: [
    {
      id: "similar-1",
      title: "워싱 데님 트러커 자켓",
      category: "Outer",
      style: "Casual",
      color: "Indigo Wash",
      price: "119,000원",
      matchRate: 92,
      imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&q=80&w=600",
      reason: "보유 데님 계열과 소재감이 유사해 기존 코디 흐름을 유지하면서 확장할 수 있습니다.",
    },
    {
      id: "similar-2",
      title: "스퀘어토 더비 슈즈",
      category: "Shoes",
      style: "Dandy",
      color: "Matt Black",
      price: "185,000원",
      matchRate: 90,
      imageUrl: "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=600",
      reason: "저장한 미니멀/댄디 무드 상품과 형태, 색상, 활용도가 가깝습니다.",
    },
    {
      id: "similar-3",
      title: "빈티지 워시드 셔츠",
      category: "Top",
      style: "Casual",
      color: "Washed Blue",
      price: "76,000원",
      matchRate: 88,
      imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600",
      reason: "보유 캐주얼 아이템과 비슷한 워싱감으로 추천했습니다.",
    },
    {
      id: "similar-4",
      title: "나일론 크로스 백",
      category: "Outer",
      style: "Street",
      color: "Charcoal",
      price: "49,000원",
      matchRate: 87,
      imageUrl: "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&q=80&w=600",
      reason: "저장 상품의 스트리트 무드와 잘 맞는 보조 아이템입니다.",
    },
  ],
  match: [
    {
      id: "match-1",
      title: "보유 상의에 맞는 와이드 슬랙스",
      category: "Bottom",
      style: "Minimal",
      color: "Slate Black",
      price: "69,000원",
      matchRate: 95,
      imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&q=80&w=600",
      reason: "밝은 상의와 매치했을 때 하체를 차분하게 잡아주고 전체 비율이 길어 보입니다.",
    },
    {
      id: "match-2",
      title: "보유 하의에 맞는 옥스포드 셔츠",
      category: "Top",
      style: "Amekaji",
      color: "Chambray Blue",
      price: "56,000원",
      matchRate: 91,
      imageUrl: "https://images.unsplash.com/photo-1603252109303-2751441dd157?auto=format&fit=crop&q=80&w=600",
      reason: "데님과 치노 계열 하의에 모두 어울리는 안정적인 상의 후보입니다.",
    },
    {
      id: "match-3",
      title: "와이드 데님에 맞는 크롭 재킷",
      category: "Outer",
      style: "Casual",
      color: "Black",
      price: "118,000원",
      matchRate: 93,
      imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600",
      reason: "넓은 하의 실루엣과 균형을 맞추는 짧은 아우터입니다.",
    },
    {
      id: "match-4",
      title: "화이트 티에 맞는 카고 팬츠",
      category: "Bottom",
      style: "Gorpcore",
      color: "Khaki",
      price: "79,000원",
      matchRate: 90,
      imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=600",
      reason: "심플한 상의에 기능적인 하의를 더해 코디 밀도를 높입니다.",
    },
  ],
  aimd: [
    {
      id: "aimd-1",
      title: "AI MD 픽: 테크 레이어드 코디",
      category: "Outer",
      style: "Tech Casual",
      color: "Soft Black",
      price: "159,000원",
      matchRate: 97,
      imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600",
      reason: "감각이 MD 기준으로는 상체에 가벼운 볼륨을 만들고, 하의는 넓게 떨어뜨려 오늘 가장 균형 좋은 코디입니다.",
    },
    {
      id: "aimd-2",
      title: "AI MD 픽: 빈티지 데일리 코디",
      category: "Top",
      style: "Vintage Casual",
      color: "Cream",
      price: "72,000원",
      matchRate: 89,
      imageUrl: "https://images.unsplash.com/photo-1516826957135-700dedea698c?auto=format&fit=crop&q=80&w=600",
      reason: "부드러운 톤의 상의로 얼굴 주변을 밝히고, 보유 아우터와 자연스럽게 연결됩니다.",
    },
    {
      id: "aimd-3",
      title: "AI MD 픽: 무심한 블랙 코디",
      category: "Bottom",
      style: "Minimal Street",
      color: "Black",
      price: "98,000원",
      matchRate: 92,
      imageUrl: "https://images.unsplash.com/photo-1506629905607-d9f297d1f5f8?auto=format&fit=crop&q=80&w=600",
      reason: "차콜 기반 옷장에 맞춰 가장 실패 확률이 낮은 블랙 중심 코디입니다.",
    },
    {
      id: "aimd-4",
      title: "AI MD 픽: 주말 산책 코디",
      category: "Shoes",
      style: "Casual",
      color: "Gray",
      price: "129,000원",
      matchRate: 88,
      imageUrl: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=600",
      reason: "편한 신발 중심으로 상하의를 가볍게 연결하는 코디입니다.",
    },
  ],
};

export default function HomeTab({
  clothes,
  userId,
  gender,
  insightGlow = false,
  resetSignal = 0,
}: HomeTabProps) {
  const [activeLabel, setActiveLabel] = useState<RecommendationLabel>("ootd");
  const [showStickyLabels, setShowStickyLabels] = useState(false);
  const [anchorClothesId, setAnchorClothesId] = useState<string | null>(null);
  const [matchRecommendationGroups, setMatchRecommendationGroups] = useState<
    RecommendCategoryGroup[]
  >([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const labelSectionRef = useRef<HTMLElement | null>(null);
  const ownedClothes = useMemo(
    () => clothes.filter((item) => !item.isWishlist),
    [clothes],
  );
  const registeredCount = ownedClothes.length;
  const hasRecommendationData = registeredCount > 0;

  useEffect(() => {
    if (!anchorClothesId) return;
    if (!ownedClothes.some((item) => item.id === anchorClothesId)) {
      setAnchorClothesId(null);
    }
  }, [ownedClothes, anchorClothesId]);

  useEffect(() => {
    if (activeLabel !== "match" || !userId || !anchorClothesId) {
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
          Number(anchorClothesId),
        );
        if (cancelled) return;
        setMatchRecommendationGroups(
          mapClothesRecommendationResponseGrouped(response, gender),
        );
      } catch (error) {
        if (cancelled) return;
        setMatchRecommendationGroups([]);
        setMatchError(extractApiErrorMessage(error, "어울리는 옷 추천을 불러오지 못했습니다."));
      } finally {
        if (!cancelled) setMatchLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeLabel, anchorClothesId, gender, userId]);

  const buildRecommendations = (label: RecommendationLabel) => {
    const baseList = baseRecommendations[label];
    const enriched = baseList.map((item, index) => {
      const source = clothes[index % Math.max(clothes.length, 1)];
      if (!source) return item;

      if (label === "similar") {
        return {
          ...item,
          style: source.style,
          color: source.color,
          reason: `"${source.name}"와 색감/무드가 비슷해 저장 상품 또는 보유 옷과 자연스럽게 이어집니다.`,
        };
      }

      if (label === "match") {
        const pairedCategory = source.category === "Top" ? "Bottom" : source.category === "Bottom" ? "Top" : item.category;
        return {
          ...item,
          category: pairedCategory,
          imageUrl: fallbackImages[pairedCategory],
          reason: `"${source.name}" 기준으로 같이 입기 좋은 ${pairedCategory} 아이템을 우선 추천했습니다.`,
        };
      }

      return item;
    });

    const closetBasedItems = clothes.slice(0, 2).map((source, index): RecommendItem => {
      const category =
        label === "match"
          ? source.category === "Top"
            ? "Bottom"
            : source.category === "Bottom"
              ? "Top"
              : source.category
          : source.category;

      return {
        id: `${label}-closet-${source.id}`,
        title:
          label === "ootd"
            ? `${source.name} 활용 데일리 코디`
            : label === "style"
              ? `${source.style} 무드 확장 아이템`
              : label === "similar"
                ? `${source.name} 유사 상품`
                : label === "match"
                  ? `${source.name}에 어울리는 ${category}`
                  : `감각이 MD 픽 ${index + 1}`,
        category,
        style: source.style,
        color: source.color,
        price: `${69 + index * 20},000원`,
        matchRate: 88 + index * 4,
        imageUrl:
          resolveClothesDisplayImageUrl({
            userImageUrl: source.userImageUrl,
            imageUrl: source.be?.imageUrl ?? source.thumbnailUrl,
          }) || fallbackImages[category],
        reason:
          label === "aimd"
            ? `감각이 MD가 "${source.name}"의 무드와 현재 옷장 구성을 기준으로 추천 이유를 구성했습니다.`
            : `"${source.name}" 데이터를 기반으로 현재 추천 영역에 맞는 후보로 구성했습니다.`,
      };
    });

    return [...enriched, ...closetBasedItems].filter((item) =>
      matchesUserGender(item.title, gender),
    );
  };

  const selectedRecommendations = useMemo(() => {
    if (activeLabel === "match") return [];
    return buildRecommendations(activeLabel);
  }, [activeLabel, clothes, gender]);

  const matchRecommendationCount = useMemo(
    () => matchRecommendationGroups.reduce((sum, group) => sum + group.items.length, 0),
    [matchRecommendationGroups],
  );

  const selectedAnchorGarment = useMemo(
    () => ownedClothes.find((item) => item.id === anchorClothesId) ?? null,
    [ownedClothes, anchorClothesId],
  );
  const activeConfig = labelConfig[activeLabel];
  const labelKeys = Object.keys(labelConfig) as RecommendationLabel[];

  useEffect(() => {
    const target = labelSectionRef.current;
    if (!target) return;

    const root = document.getElementById("app-viewport");
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyLabels(!entry.isIntersecting);
      },
      {
        root,
        rootMargin: "-80px 0px 0px 0px",
        threshold: 0,
      },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setActiveLabel("ootd");
    setShowStickyLabels(false);
  }, [resetSignal]);

  const selectLabel = (label: RecommendationLabel, scrollToList = false) => {
    setActiveLabel(label);
    if (scrollToList) {
      window.setTimeout(() => {
        document.getElementById("recommendation-list")?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    }
  };

  if (!hasRecommendationData) {
    return (
      <div className="space-y-6 animate-fade-in font-sans">
        <section className="bg-white border border-slate-100 rounded-[32px] p-8 text-left shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-[#F3E8FF] text-[#111827] flex items-center justify-center mb-5 border border-[#DDD6FE]">
            <Shirt className="w-7 h-7" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">추천할 옷장 데이터가 없어요</h1>
          <p className="text-sm text-slate-500 font-bold leading-relaxed mt-3 max-w-xl">
            로그인하지 않았거나 등록된 옷이 없으면 추천 피드를 만들 수 없습니다. 옷을 등록하면 OOTD,
            유사 상품, 어울리는 옷, AI MD 추천을 바로 확인할 수 있어요.
          </p>
          <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#111827] shrink-0 mt-0.5" />
            <span className="text-xs text-slate-600 font-bold leading-relaxed">
              정확한 추천을 위해 옷 5개 이상 등록을 권장합니다.
            </span>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {showStickyLabels && (
        <div className="fixed top-[72px] left-0 right-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-2 shadow-sm">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
            {labelKeys.map((label) => {
              const config = labelConfig[label];
              const tilt = labelTiltClasses[label];
              const isActive = activeLabel === label;
              return (
                <button
                  key={label}
                  onClick={() => selectLabel(label, true)}
                  className={`h-7 px-3 rounded-full text-[10px] font-black whitespace-nowrap transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                    isActive ? "bg-[#111827] text-[#C4B5FD] shadow-md" : "bg-slate-50 text-slate-500 hover:bg-white hover:text-[#111827]"
                  } ${isActive ? tilt.activeChip : tilt.chip}`}
                  type="button"
                >
                  <span className="mr-1">{config.icon}</span>
                  {config.title}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <section ref={labelSectionRef} className="bg-white border border-slate-100 rounded-[28px] p-3 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {labelKeys.map((label) => {
            const config = labelConfig[label];
            const tilt = labelTiltClasses[label];
            const isActive = activeLabel === label;
            return (
              <button
                key={label}
                onClick={() => selectLabel(label)}
                className={`min-h-[86px] rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-1 active:scale-95 ${
                  isActive
                    ? "bg-[#111827] text-white border-transparent shadow-md ring-2 ring-[#C4B5FD]"
                    : "bg-white text-slate-700 border-slate-100 hover:bg-slate-50 hover:shadow-md"
                } ${isActive ? tilt.activeCard : tilt.card}`}
              >
                <span className="text-xl block mb-2">{config.icon}</span>
                <strong className="text-xs font-black block leading-tight">{config.title}</strong>
                {config.subtitle ? (
                  <span className={`text-[10px] font-bold block mt-1 ${isActive ? "text-white/75" : "text-slate-400"}`}>
                    {config.subtitle}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </section>

      <section id="recommendation-list" className="bg-white border border-slate-100 rounded-[28px] p-4 md:p-5 shadow-sm text-left scroll-mt-28">
        <div className="flex items-end justify-between gap-3 mb-4">
          <div>
            <span className="text-[11px] font-black text-[#111827] uppercase tracking-wider">
              {activeConfig.icon} Recommendation
            </span>
            <h2 className="text-xl md:text-2xl font-black text-slate-950 mt-1">{activeConfig.title}</h2>
            {activeConfig.subtitle ? (
              <p className="text-xs text-slate-400 font-bold mt-1">{activeConfig.subtitle}</p>
            ) : null}
          </div>
          {activeLabel !== "match" && (
          <span className="text-xs font-black text-slate-400 shrink-0">
            {`${selectedRecommendations.length}개`}
          </span>
          )}
        </div>

        {activeLabel === "match" && ownedClothes.length > 0 && (
          <div className="mb-5 space-y-3">
            <MatchAnchorWardrobeScroller
              items={ownedClothes}
              selectedId={anchorClothesId}
              onSelect={setAnchorClothesId}
              fallbackImages={fallbackImages}
            />

            {selectedAnchorGarment && (
              <p className="text-xs font-bold text-slate-600">
                <span className="text-[#1E3A8A]">{selectedAnchorGarment.name}</span>
                {" "}기준 어울리는 옷
              </p>
            )}

            {matchLoading && (
              <p className="text-xs text-slate-400 font-bold">어울리는 옷 추천을 불러오는 중…</p>
            )}
            {matchError && (
              <p className="text-xs text-red-600 font-bold">{matchError}</p>
            )}
          </div>
        )}

        {activeLabel === "match" && !anchorClothesId ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <p className="text-sm font-black text-slate-600">위에서 옷을 선택해 주세요</p>
            <p className="text-xs text-slate-400 font-bold mt-2">
              선택한 옷과 어울리는 코디가 아래에 표시됩니다.
            </p>
          </div>
        ) : activeLabel === "match" && matchLoading ? (
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-10 text-center">
            <p className="text-sm font-black text-slate-500">추천 코디를 불러오는 중…</p>
          </div>
        ) : activeLabel === "match" && matchRecommendationCount === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center">
            <p className="text-sm font-black text-slate-600">어울리는 옷을 찾지 못했어요</p>
            <p className="text-xs text-slate-400 font-bold mt-2">
              다른 옷을 선택하거나 옷장에 아이템을 더 등록해 보세요.
            </p>
          </div>
        ) : activeLabel === "match" ? (
          <MatchRecommendationByCategory groups={matchRecommendationGroups} />
        ) : (
        <div
          className={`grid gap-4 ${
            activeLabel === "ootd" || activeLabel === "aimd"
              ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
              : "grid-cols-2 lg:grid-cols-3"
          }`}
        >
          {selectedRecommendations.map((item) => (
            <article
              key={item.id}
              className={`group rounded-[24px] border overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:rotate-[0.5deg] hover:shadow-xl active:scale-[0.99] ${
                item.isAnchor
                  ? "border-[#1E3A8A]/30 bg-indigo-50/40 ring-1 ring-[#1E3A8A]/20"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <div className="h-44 sm:h-52 lg:h-72 bg-slate-100 relative overflow-hidden">
                <AuthenticatedImage
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">
                      이미지 없음
                    </div>
                  }
                />
                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/45 to-transparent text-white">
                  <h3 className="text-sm font-black truncate">{item.title}</h3>
                  <div className="mt-1">
                    <strong className="text-sm">{item.price}</strong>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
      </section>
    </div>
  );
}
