import React, { useState, useMemo, useEffect, useCallback } from "react";
import Spinner from "@/components/common/Spinner";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import {
  Search,
  ChevronRight,
  LayoutGrid,
  Heart,
} from "./icons";
import { Garment } from "@/types";
import { fetchMyOutfitBook, updateOutfit, type OutfitResponse } from "@/api/outfits";
import type { ClothesResponse } from "@/types/be";
import OutfitDetailModal, { type OutfitModalItem } from "./OutfitDetailModal";
import { useToast } from './Toast'

function toOutfitModalItem(clothes: ClothesResponse | undefined): OutfitModalItem | undefined {
  if (!clothes) return undefined
  return {
    clothesId: clothes.clothesId,
    name: clothes.name,
    brand: clothes.brandName,
    imageUrl: clothes.imageUrl ?? undefined,
    userImageUrl: clothes.userImageUrl ?? undefined,
    category: clothes.category,
  }
}

interface OutfitBookTabProps {
  userId: number;
  clothes: Garment[];
}

export default function OutfitBookTab({
                                        userId,
                                        clothes,
                                      }: OutfitBookTabProps) {
  const [outfits, setOutfits] = useState<OutfitResponse[]>([]);
  const [outfitBookId, setOutfitBookId] = useState<number | null>(null);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitResponse | null>(null);
  const [outfitSearchTerm, setOutfitSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'all' | 'favorite'>('all');
  const { showToast } = useToast()

  const loadOutfits = useCallback(async () => {
    setOutfitLoading(true);
    try {
      const book = await fetchMyOutfitBook();
      setOutfitBookId(book.outfitBookId);
      setOutfits(book.outfits ?? []);
    } catch (err) {
      console.error("Failed to load outfits:", err);
    } finally {
      setOutfitLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOutfits();
  }, [loadOutfits]);

  const filteredOutfits = useMemo(() => {
    let list = outfits;
    if (activeTab === 'favorite') list = list.filter((o) => o.favorite === true);
    if (!outfitSearchTerm.trim()) return list;
    return list.filter((o) =>
        o.title.toLowerCase().includes(outfitSearchTerm.toLowerCase())
    );
  }, [outfits, outfitSearchTerm, activeTab]);

  const toggleFavorite = async (e: React.MouseEvent, outfit: OutfitResponse) => {
    e.stopPropagation();
    if (!outfitBookId) return;
    const next = !outfit.favorite;
    setOutfits((prev) => prev.map((o) => (o.outfitId === outfit.outfitId ? { ...o, favorite: next } : o)));
    try {
      await updateOutfit(outfitBookId, outfit.outfitId, {
        title: outfit.title,
        description: outfit.description,
        situation: outfit.situation || '일상',
        season: outfit.season || 'ALL_SEASON',
        favorite: next,
      });
      showToast('success', next ? '좋아요가 되었습니다!' : '좋아요가 취소되었습니다!')
    } catch (err) {
      console.error('Failed to toggle favorite', err);
      setOutfits((prev) => prev.map((o) => (o.outfitId === outfit.outfitId ? { ...o, favorite: outfit.favorite } : o)));
      showToast('error', '좋아요 처리에 실패했습니다.')
    }
  };

  return (
      <div className="space-y-6 animate-fade-in text-left">
        {/* 탭 */}
        <div className="flex items-center gap-2">
          <button
              onClick={() => { setActiveTab('all'); setOutfitSearchTerm('') }}
              className={`px-3 py-2 rounded-full text-sm font-black ${activeTab === 'all' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-50 text-slate-600'}`}>
            전체
          </button>
          <button
              onClick={() => { setActiveTab('favorite'); setOutfitSearchTerm('') }}
              className={`px-3 py-2 rounded-full text-sm font-black ${activeTab === 'favorite' ? 'bg-[#1E3A8A] text-white' : 'bg-slate-50 text-slate-600'}`}>
            즐겨찾기
          </button>
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-bold text-[#1E3A8A]">내 코디북</h3>
          <p className="text-xs text-slate-400">저장된 코디를 확인하고 관리하세요.</p>
        </div>

        {/* 검색 바 */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
              type="text"
              placeholder="코디 제목으로 검색..."
              value={outfitSearchTerm}
              onChange={(e) => setOutfitSearchTerm(e.target.value)}
              className="w-full h-11 pl-11 pr-4 bg-white border border-slate-100 rounded-2xl text-[13px] outline-hidden focus:border-[#1E3A8A] transition shadow-3xs"
          />
        </div>

        {/* 코디 목록 그리드 */}
        <div className="grid grid-cols-2 gap-4">
          {filteredOutfits.length > 0 ? (
              filteredOutfits.map((outfit) => {
                const top = outfit.items.find((it) => it.itemRole === "TOP")?.clothes;
                const bottom = outfit.items.find((it) => it.itemRole === "BOTTOM")?.clothes;

                const ownedCount = outfit.items.filter(i => {
                  const beStatus = i.clothes?.ownershipStatus
                  if (beStatus) return beStatus === 'OWNED'
                  const clothesId = i.clothes?.clothesId ?? null
                  if (!clothesId) return false
                  const matched = clothes.find((g) => Number(g.id) === Number(clothesId))
                  return matched ? !matched.isWishlist : false
                }).length

                const wishlistCount = outfit.items.filter(i =>
                    i.clothes?.ownershipStatus === 'WISHLIST' ||
                    (i.clothes?.ownershipStatus == null && i.clothes?.wardrobeClothesId == null)
                ).length

                const hasTop = Boolean(top)
                const hasBottom = Boolean(bottom)

                return (
                    <div
                        key={outfit.outfitId}
                        onClick={() => setSelectedOutfit(outfit)}
                        className="relative bg-white rounded-[24px] border border-slate-100 p-3 space-y-3 cursor-pointer hover:shadow-md transition shadow-3xs group"
                    >
                      <button
                          onClick={(e) => toggleFavorite(e, outfit)}
                          aria-label="toggle-favorite"
                          className="absolute right-3 top-3 z-10 p-1 rounded-full bg-white/80 hover:bg-white"
                      >
                        <Heart className={`${outfit.favorite ? 'text-red-500' : 'text-slate-300'} w-5 h-5`} />
                      </button>

                      <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-50 flex items-center justify-center">
                        {hasTop && hasBottom ? (
                            <div className="w-full h-full flex">
                              <div className="w-1/2 h-full border-r border-slate-100 flex items-center justify-center p-1 bg-white">
                                {top?.imageUrl || top?.userImageUrl ? (
                                    <AuthenticatedImage
                                        src={(top.userImageUrl || top.imageUrl) as string}
                                        alt="top"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xl">👕</span>
                                )}
                              </div>
                              <div className="w-1/2 h-full flex items-center justify-center p-1 bg-white">
                                {bottom?.imageUrl || bottom?.userImageUrl ? (
                                    <AuthenticatedImage
                                        src={(bottom.userImageUrl || bottom.imageUrl) as string}
                                        alt="bottom"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xl">👖</span>
                                )}
                              </div>
                            </div>
                        ) : (
                            (() => {
                              const img = top?.imageUrl || top?.userImageUrl || bottom?.imageUrl || bottom?.userImageUrl
                              return img ? (
                                  <AuthenticatedImage src={img as string} alt={outfit.title} className="w-full h-full object-cover" />
                              ) : (
                                  <div className="text-2xl">👗</div>
                              )
                            })()
                        )}
                      </div>
                      <div>
                        <h4 className="text-[12px] font-black text-slate-800 line-clamp-1 group-hover:text-[#1E3A8A] transition">
                          {outfit.title}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold">
                          {wishlistCount === 0
                              ? `아이템 ${outfit.items.length}개`
                              : `보유 ${ownedCount} · 미보유 ${wishlistCount}`}
                        </p>
                      </div>
                    </div>
                );
              })
          ) : (
              !outfitLoading && (
                  <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <LayoutGrid className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-xs text-slate-500 font-bold">
                      {outfitSearchTerm ? "검색 결과가 없습니다." : "저장된 코디가 없습니다."}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 mb-4">
                      {outfitSearchTerm ? "다른 검색어를 입력해 보세요." : "감각이가 추천해주는 코디를 저장해 보세요!"}
                    </p>
                    {!outfitSearchTerm && (
                        <button
                            onClick={() => {
                              const navHome = document.getElementById("nav-home");
                              if (navHome) navHome.click();
                            }}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-[11px] font-black transition active:scale-95"
                        >
                          <span>추천 탭으로 이동</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    )}
                  </div>
              )
          )}

          {outfitLoading && (
              <div className="col-span-full py-20 flex justify-center">
                <Spinner />
              </div>
          )}
        </div>

        {selectedOutfit && outfitBookId && (
            <OutfitDetailModal
                open={!!selectedOutfit}
                combination={{
                  outfitId: selectedOutfit.outfitId,
                  bookId: outfitBookId,
                  title: selectedOutfit.title,
                  description: selectedOutfit.description,
                  top: toOutfitModalItem(selectedOutfit.items.find((it) => it.itemRole === "TOP")?.clothes),
                  bottom: toOutfitModalItem(selectedOutfit.items.find((it) => it.itemRole === "BOTTOM")?.clothes),
                  outer: toOutfitModalItem(selectedOutfit.items.find((it) => it.itemRole === "OUTER")?.clothes),
                  shoes: toOutfitModalItem(selectedOutfit.items.find((it) => it.itemRole === "SHOES")?.clothes),
                }}
                onClose={() => setSelectedOutfit(null)}
                onSaved={loadOutfits}
                clothes={clothes}
            />
        )}
      </div>
  );
}