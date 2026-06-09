import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import type { Garment } from "@/types/index";
import { resolveClothesDisplayImageUrl } from "@/utils/clothesImageUrl";

const VISIBLE_SLOTS = 10;
const LOOP_COPIES = 3;

type Category = Garment["category"];

interface MatchAnchorWardrobeScrollerProps {
  items: Garment[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  fallbackImages: Record<Category, string>;
}

function resolveGarmentImage(
  item: Garment,
  fallbackImages: Record<Category, string>,
): string {
  return (
    resolveClothesDisplayImageUrl({
      userImageUrl: item.userImageUrl,
      imageUrl: item.be?.imageUrl ?? item.thumbnailUrl,
    }) || fallbackImages[item.category]
  );
}

export default function MatchAnchorWardrobeScroller({
  items,
  selectedId,
  onSelect,
  fallbackImages,
}: MatchAnchorWardrobeScrollerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const segmentWidthRef = useRef(0);
  const isAdjustingRef = useRef(false);

  const useInfiniteLoop = items.length > VISIBLE_SLOTS;
  const displayItems = useMemo(() => {
    if (!useInfiniteLoop) return items;
    return Array.from({ length: LOOP_COPIES }, () => items).flat();
  }, [items, useInfiniteLoop]);

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
  }, [items, repositionToMiddle]);

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
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      onWheel={handleWheel}
      className="@container w-full overflow-x-auto overscroll-x-contain pb-2 scrollbar-none snap-x snap-mandatory touch-pan-x"
    >
      <div
        className={`flex gap-2 ${useInfiniteLoop ? "w-max min-w-full" : "min-w-full"}`}
      >
        {displayItems.map((item, index) => {
          const isSelected = selectedId === item.id;
          const imageUrl = resolveGarmentImage(item, fallbackImages);
          const copyIndex = useInfiniteLoop ? Math.floor(index / items.length) : 0;

          return (
            <button
              key={`${item.id}-${copyIndex}-${index}`}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-pressed={isSelected}
              aria-label={`${item.name} 기준으로 어울리는 옷 보기`}
              className="shrink-0 snap-start flex flex-col items-center gap-1.5 cursor-pointer group w-[calc((100cqw-4.5rem)/10)] min-w-[80px]"
            >
              <div
                className={`aspect-square w-full rounded-full overflow-hidden border-[3px] transition-all duration-200 bg-slate-100 ${
                  isSelected
                    ? "border-[#1E3A8A] ring-4 ring-[#C4B5FD]/60 shadow-lg scale-[1.04]"
                    : "border-slate-200 group-hover:border-slate-300 group-hover:scale-[1.02]"
                }`}
              >
                <AuthenticatedImage
                  src={imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  fallback={
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 text-xs font-bold">
                      ?
                    </div>
                  }
                />
              </div>
              <span
                className={`text-[11px] sm:text-xs font-bold text-center leading-tight line-clamp-2 w-full px-0.5 ${
                  isSelected ? "text-[#1E3A8A]" : "text-slate-500"
                }`}
              >
                {item.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
