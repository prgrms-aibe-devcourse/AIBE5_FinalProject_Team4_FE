import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import type {
  RecommendCardItem,
  RecommendCategoryGroup,
} from "@/utils/recommendationMapper";

const VISIBLE_SLOTS = 4;
const LOOP_COPIES = 3;

const categoryEmoji: Record<RecommendCategoryGroup["category"], string> = {
  Top: "👕",
  Bottom: "👖",
  Outer: "🧥",
  Shoes: "👟",
};

interface MatchRecommendationByCategoryProps {
  groups: RecommendCategoryGroup[];
}

function CategoryRecommendationRow({ group }: { group: RecommendCategoryGroup }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const segmentWidthRef = useRef(0);
  const isAdjustingRef = useRef(false);

  const sortedItems = useMemo(
    () => [...group.items].sort((a, b) => b.matchRate - a.matchRate),
    [group.items],
  );

  const useInfiniteLoop = sortedItems.length > VISIBLE_SLOTS;
  const displayItems = useMemo(() => {
    if (!useInfiniteLoop) return sortedItems;
    return Array.from({ length: LOOP_COPIES }, () => sortedItems).flat();
  }, [sortedItems, useInfiniteLoop]);

  const repositionToMiddle = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !useInfiniteLoop) return;

    segmentWidthRef.current = el.scrollWidth / LOOP_COPIES;
    isAdjustingRef.current = true;
    el.scrollLeft = segmentWidthRef.current;
    requestAnimationFrame(() => {
      isAdjustingRef.current = false;
    });
  }, [useInfiniteLoop]);

  useLayoutEffect(() => {
    repositionToMiddle();
  }, [sortedItems, repositionToMiddle]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || !useInfiniteLoop || isAdjustingRef.current) return;

    const segment = segmentWidthRef.current || el.scrollWidth / LOOP_COPIES;
    if (segment <= 0) return;

    if (el.scrollLeft <= segment * 0.05) {
      isAdjustingRef.current = true;
      el.scrollLeft += segment;
      requestAnimationFrame(() => {
        isAdjustingRef.current = false;
      });
      return;
    }

    if (el.scrollLeft >= segment * 1.95) {
      isAdjustingRef.current = true;
      el.scrollLeft -= segment;
      requestAnimationFrame(() => {
        isAdjustingRef.current = false;
      });
    }
  };

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

    event.preventDefault();
    el.scrollLeft += event.deltaY;
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
          <span aria-hidden>{categoryEmoji[group.category]}</span>
          {group.label}
        </h3>
        <span className="text-[11px] font-bold text-slate-400 shrink-0">
          {sortedItems.length}개
        </span>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className="@container w-full overflow-x-auto overscroll-x-contain pb-1 scrollbar-none snap-x snap-mandatory touch-pan-x"
      >
        <div
          className={`flex gap-3 ${useInfiniteLoop ? "w-max min-w-full" : "min-w-full"}`}
        >
          {displayItems.map((item, index) => {
            const copyIndex = useInfiniteLoop
              ? Math.floor(index / sortedItems.length)
              : 0;

            return (
              <RecommendationCard
                key={`${item.id}-${copyIndex}-${index}`}
                item={item}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RecommendationCard({ item }: { item: RecommendCardItem }) {
  return (
    <article className="group shrink-0 snap-start w-[calc((100cqw-2.25rem)/4)] aspect-square rounded-2xl border border-slate-100 bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col">
      <div className="flex-1 min-h-0 bg-slate-50 overflow-hidden">
        <AuthenticatedImage
          src={item.imageUrl}
          alt={item.title}
          className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.02]"
          fallback={
            <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-bold">
              이미지 없음
            </div>
          }
        />
      </div>

      <div className="shrink-0 p-2 space-y-0.5">
        <h4 className="text-[11px] font-black text-slate-900 line-clamp-1 leading-snug">
          {item.title}
        </h4>
        <p className="text-[10px] font-bold text-slate-500 truncate">
          {item.color} · {item.style}
        </p>
      </div>
    </article>
  );
}

export default function MatchRecommendationByCategory({
  groups,
}: MatchRecommendationByCategoryProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <CategoryRecommendationRow key={group.categoryCode} group={group} />
      ))}
    </div>
  );
}
