import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import RecommendProductDetailModal from "@/components/RecommendProductDetailModal";
import { Heart, Sparkle } from "@/components/icons";
import { useRecommendWishlistToggle } from "@/hooks/useRecommendWishlistToggle";
import type { Garment } from "@/types";
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
  userId: number | null;
  existingGarments?: Garment[];
  onWishlistAdded?: () => void;
}

function CategoryRecommendationRow({
  group,
  onItemClick,
  isItemWishlisted,
  isItemSubmitting,
  onWishlistClick,
}: {
  group: RecommendCategoryGroup;
  onItemClick: (item: RecommendCardItem) => void;
  isItemWishlisted: (item: RecommendCardItem) => boolean;
  isItemSubmitting: (item: RecommendCardItem) => boolean;
  onWishlistClick: (item: RecommendCardItem) => void;
}) {
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
                onClick={() => onItemClick(item)}
                wishlisted={isItemWishlisted(item)}
                isSubmitting={isItemSubmitting(item)}
                onWishlistClick={() => onWishlistClick(item)}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RecommendationCard({
  item,
  onClick,
  wishlisted,
  isSubmitting,
  onWishlistClick,
}: {
  item: RecommendCardItem;
  onClick: () => void;
  wishlisted: boolean;
  isSubmitting: boolean;
  onWishlistClick: () => void;
}) {
  const canWishlist = item.clothesId != null && !item.isAnchor;

  return (
    <div className="group relative shrink-0 snap-start w-[calc((100cqw-2.25rem)/4)] aspect-square rounded-2xl border border-slate-100 bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col text-left">
      <button
        type="button"
        onClick={onClick}
        aria-label={`${item.title} 상세 보기`}
        className="flex flex-col flex-1 min-h-0 w-full cursor-pointer text-left"
      >
        <div className="relative flex-1 min-h-0 bg-slate-50 overflow-hidden">
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
      </button>

      {canWishlist ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onWishlistClick();
          }}
          disabled={isSubmitting}
          aria-pressed={wishlisted}
          aria-label={wishlisted ? "위시리스트에서 빼기" : "위시리스트에 추가"}
          className={`absolute top-1.5 right-1.5 z-10 p-1.5 rounded-full border bg-white/95 shadow-sm transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
            wishlisted
              ? "border-rose-200 text-rose-500 hover:bg-rose-50 hover:border-rose-300"
              : "border-slate-200/90 text-slate-400 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50 disabled:hover:text-slate-400 disabled:hover:border-slate-200 disabled:hover:bg-white/95"
          }`}
        >
          <Heart
            className={`w-3.5 h-3.5 ${wishlisted ? "text-rose-500 fill-rose-500" : ""}`}
          />
        </button>
      ) : null}
    </div>
  );
}

export default function MatchRecommendationByCategory({
  groups,
  userId,
  existingGarments = [],
  onWishlistAdded,
}: MatchRecommendationByCategoryProps) {
  const [selectedItem, setSelectedItem] = useState<RecommendCardItem | null>(null);

  const { toastMessage, isWishlisted, isSubmitting, toggleWishlist } =
    useRecommendWishlistToggle({
      userId,
      existingGarments,
      onWishlistChanged: onWishlistAdded,
    });

  const isItemWishlisted = useCallback(
    (item: RecommendCardItem) => isWishlisted(item.clothesId),
    [isWishlisted],
  );

  const isItemSubmitting = useCallback(
    (item: RecommendCardItem) => isSubmitting(item.clothesId),
    [isSubmitting],
  );

  const handleWishlistClick = useCallback(
    (item: RecommendCardItem) => {
      if (item.clothesId == null || item.isAnchor) return
      void toggleWishlist(item)
    },
    [toggleWishlist],
  );

  return (
    <>
      {toastMessage ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-[110] -translate-x-1/2 bg-[#1E3A8A] text-[#BBF7D0] px-5 py-3 rounded-2xl shadow-xl text-xs font-black border border-emerald-400 flex items-center gap-2 animate-bounce pointer-events-none"
        >
          <Sparkle className="w-4 h-4 text-emerald-300 animate-spin shrink-0" />
          <span>{toastMessage}</span>
        </div>
      ) : null}

      <div className="space-y-6">
        {groups.map((group) => (
          <CategoryRecommendationRow
            key={group.categoryCode}
            group={group}
            onItemClick={setSelectedItem}
            isItemWishlisted={isItemWishlisted}
            isItemSubmitting={isItemSubmitting}
            onWishlistClick={handleWishlistClick}
          />
        ))}
      </div>

      <RecommendProductDetailModal
        open={selectedItem != null}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
        wishlisted={selectedItem ? isWishlisted(selectedItem.clothesId) : false}
        wishlistSubmitting={selectedItem ? isSubmitting(selectedItem.clothesId) : false}
        onWishlistToggle={
          selectedItem?.clothesId != null && !selectedItem.isAnchor
            ? () => void toggleWishlist(selectedItem)
            : undefined
        }
      />
    </>
  );
}
