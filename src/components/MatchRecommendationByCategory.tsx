import { useCallback, useEffect, useMemo, useState } from "react";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import RecommendProductDetailModal from "@/components/RecommendProductDetailModal";
import { ChevronRight, Heart, Sparkle, ThumbsDown } from "@/components/icons";
import { MAX_TOP_RANK_LABEL, postRecommendationFeedback } from "@/api/recommendations";
import { useRecommendWishlistToggle } from "@/hooks/useRecommendWishlistToggle";
import type { Garment } from "@/types";
import type {
  RecommendCardItem,
  RecommendCategoryGroup,
} from "@/utils/recommendationMapper";

const COLLAPSED_PREVIEW_COUNT = 4;

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

function RecommendationCard({
  item,
  rank,
  showRankLabel,
  onClick,
  wishlisted,
  isSubmitting,
  onWishlistClick,
}: {
  item: RecommendCardItem;
  rank: number;
  showRankLabel: boolean;
  onClick: () => void;
  wishlisted: boolean;
  isSubmitting: boolean;
  onWishlistClick: () => void;
}) {
  const canWishlist = item.clothesId != null && !item.isAnchor;
  const rankLabel = showRankLabel ? `TOP ${rank}` : null;

  return (
    <div className="group relative rounded-2xl border border-slate-100 bg-white overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col text-left">
      <button
        type="button"
        onClick={onClick}
        aria-label={
          rankLabel
            ? `${rankLabel} ${item.title} 상세 보기`
            : `${item.title} 상세 보기`
        }
        className="flex flex-col flex-1 min-h-0 w-full cursor-pointer text-left"
      >
        <div className="relative aspect-square bg-slate-50 overflow-hidden">
          {rankLabel ? (
            <span className="absolute top-1.5 left-1.5 z-[1] px-1.5 py-0.5 rounded-md bg-[#1E3A8A] text-[#BBF7D0] text-[10px] font-black tracking-tight">
              {rankLabel}
            </span>
          ) : null}
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

        <div className="shrink-0 p-2.5 space-y-0.5">
          <h4 className="text-[11px] font-black text-slate-900 line-clamp-1 leading-snug">
            {item.title}
          </h4>
          <p className="text-[10px] font-bold text-slate-500 truncate">
            {item.itemTypeLabel} · {item.color}
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

function CategoryRecommendationSection({
  group,
  expanded,
  onToggle,
  onItemClick,
  isItemWishlisted,
  isItemSubmitting,
  onWishlistClick,
}: {
  group: RecommendCategoryGroup;
  expanded: boolean;
  onToggle: () => void;
  onItemClick: (item: RecommendCardItem) => void;
  isItemWishlisted: (item: RecommendCardItem) => boolean;
  isItemSubmitting: (item: RecommendCardItem) => boolean;
  onWishlistClick: (item: RecommendCardItem) => void;
}) {
  const [itemTypeFilter, setItemTypeFilter] = useState<string>("all");

  const itemTypeOptions = useMemo(() => {
    const byCode = new Map<string, string>();
    for (const item of group.items) {
      if (!item.itemTypeCode) continue;
      byCode.set(item.itemTypeCode, item.itemTypeLabel);
    }
    return [
      { code: "all", label: "전체" },
      ...Array.from(byCode, ([code, label]) => ({ code, label })),
    ];
  }, [group.items]);

  const filteredItems = useMemo(() => {
    const sorted = [...group.items].sort((a, b) => b.matchRate - a.matchRate);
    if (itemTypeFilter === "all") return sorted;
    return sorted.filter((item) => item.itemTypeCode === itemTypeFilter);
  }, [group.items, itemTypeFilter]);

  const previewItems = filteredItems.slice(0, COLLAPSED_PREVIEW_COUNT);

  useEffect(() => {
    if (!expanded) setItemTypeFilter("all");
  }, [expanded]);

  useEffect(() => {
    setItemTypeFilter("all");
  }, [group.categoryCode, group.items]);

  useEffect(() => {
    if (itemTypeFilter === "all") return;
    if (!itemTypeOptions.some((option) => option.code === itemTypeFilter)) {
      setItemTypeFilter("all");
    }
  }, [itemTypeFilter, itemTypeOptions]);

  return (
    <section className="rounded-[24px] border border-slate-100 bg-white overflow-hidden shadow-sm">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span aria-hidden className="text-base shrink-0">
            {categoryEmoji[group.category]}
          </span>
          <h3 className="text-sm font-black text-slate-900 truncate">
            {group.label} {filteredItems.length}개
          </h3>
        </div>
      </div>

      {!expanded ? (
        <div className="px-4 pb-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {previewItems.map((item, index) => (
              <RecommendationCard
                key={item.id}
                item={item}
                rank={index + 1}
                showRankLabel={index + 1 <= MAX_TOP_RANK_LABEL}
                onClick={() => onItemClick(item)}
                wishlisted={isItemWishlisted(item)}
                isSubmitting={isItemSubmitting(item)}
                onWishlistClick={() => onWishlistClick(item)}
              />
            ))}
          </div>
          {filteredItems.length > COLLAPSED_PREVIEW_COUNT ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={false}
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-[#1E3A8A] hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
            >
              더보기
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
          ) : null}
        </div>
      ) : (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-3">
          {itemTypeOptions.length > 1 ? (
            <div
              role="tablist"
              aria-label={`${group.label} 아이템 타입 필터`}
              className="flex flex-wrap gap-1.5"
            >
              {itemTypeOptions.map((option) => {
                const active = itemTypeFilter === option.code;
                return (
                  <button
                    key={option.code}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setItemTypeFilter(option.code)}
                    className={`h-8 px-3 rounded-lg text-[11px] font-bold border transition cursor-pointer ${
                      active
                        ? "bg-[#BBF7D0] text-[#1E3A8A] border-[#BBF7D0]"
                        : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : null}

          {filteredItems.length === 0 ? (
            <p className="text-xs font-bold text-slate-400 py-4 text-center">
              선택한 타입의 추천이 없어요
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map((item, index) => (
                <RecommendationCard
                  key={item.id}
                  item={item}
                  rank={index + 1}
                  showRankLabel={index + 1 <= MAX_TOP_RANK_LABEL}
                  onClick={() => onItemClick(item)}
                  wishlisted={isItemWishlisted(item)}
                  isSubmitting={isItemSubmitting(item)}
                  onWishlistClick={() => onWishlistClick(item)}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            aria-expanded
            className="w-full h-10 rounded-xl border border-slate-200 bg-white text-xs font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
          >
            접기
            <ChevronRight className="w-4 h-4 -rotate-90" />
          </button>
        </div>
      )}
    </section>
  );
}

export default function MatchRecommendationByCategory({
  groups,
  userId,
  existingGarments = [],
  onWishlistAdded,
}: MatchRecommendationByCategoryProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [selectedItem, setSelectedItem] = useState<RecommendCardItem | null>(null);
  const [isDisliking, setIsDisliking] = useState(false);

  useEffect(() => {
    setExpandedCategories(new Set());
  }, [groups]);

  const {
    toastMessage,
    isWishlisted,
    isSubmitting,
    toggleWishlist,
    addPurchasedToCloset,
  } = useRecommendWishlistToggle({
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
      if (item.clothesId == null || item.isAnchor) return;
      void toggleWishlist(item);
    },
    [toggleWishlist],
  );

  const handlePurchaseConfirm = useCallback(async () => {
    if (!selectedItem) return false;
    // 구매 완료 후 옷장 등록 확인만 담당
    // 새 탭 이동은 RecommendProductDetailModal의 handlePurchaseClick이 담당
    const confirmed = window.confirm('구매하셨나요? 확인을 누르면 보유 옷장에 자동으로 등록됩니다.');
    if (!confirmed) return false;
    const added = await addPurchasedToCloset(selectedItem);
    if (added) setSelectedItem(null);
    return added;
  }, [addPurchasedToCloset, selectedItem]);

  const toggleCategoryExpanded = useCallback((categoryCode: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryCode)) {
        next.delete(categoryCode);
      } else {
        next.add(categoryCode);
      }
      return next;
    });
  }, []);

  const handleDislike = useCallback(async () => {
    if (!userId || !selectedItem || !selectedItem.clothesId) return;
    setIsDisliking(true);
    try {
      await postRecommendationFeedback(userId, {
        feedbackType: "DISLIKE",
        clothesId: selectedItem.clothesId,
      });
      setSelectedItem(null);
      if (onWishlistAdded) onWishlistAdded();
    } catch (error) {
      console.error("Feedback failed:", error);
    } finally {
      setIsDisliking(false);
    }
  }, [userId, selectedItem, onWishlistAdded]);

  if (groups.length === 0) return null;

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

      <div className="space-y-4">
        {groups.map((group) => (
          <CategoryRecommendationSection
            key={group.categoryCode}
            group={group}
            expanded={expandedCategories.has(group.categoryCode)}
            onToggle={() => toggleCategoryExpanded(group.categoryCode)}
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
        userId={userId}
        wishlisted={selectedItem ? isWishlisted(selectedItem.clothesId) : false}
        wishlistSubmitting={selectedItem ? isSubmitting(selectedItem.clothesId) : false}
        onWishlistToggle={
          selectedItem?.clothesId != null && !selectedItem.isAnchor
            ? async () => { await toggleWishlist(selectedItem) }
            : undefined
        }
        onPurchaseConfirm={
          selectedItem?.clothesId != null && !selectedItem.isAnchor
            ? handlePurchaseConfirm
            : undefined
        }
        purchaseConfirmSubmitting={
          selectedItem ? isSubmitting(selectedItem.clothesId) : false
        }
        onDislike={selectedItem?.clothesId ? handleDislike : undefined}
        dislikeSubmitting={isDisliking}
      />
    </>
  );
}
