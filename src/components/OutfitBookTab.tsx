import React, { useState, useMemo, useEffect, useCallback } from "react";
import Spinner from "@/components/common/Spinner";
import AuthenticatedImage from "@/components/common/AuthenticatedImage";
import {
  Search,
  ChevronRight,
  LayoutGrid,
} from "./icons";
import { Garment } from "@/types";
import { fetchMyOutfitBook, type OutfitResponse } from "@/api/outfits";
import type { ClothesResponse } from "@/types/be";
import OutfitDetailModal, { type OutfitModalItem } from "./OutfitDetailModal";

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
  // 코디북 상태
  const [outfits, setOutfits] = useState<OutfitResponse[]>([]);
  const [outfitBookId, setOutfitBookId] = useState<number | null>(null);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitResponse | null>(null);
  const [outfitSearchTerm, setOutfitSearchTerm] = useState<string>("");

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

  // 검색 필터링된 코디 목록
  const filteredOutfits = useMemo(() => {
    if (!outfitSearchTerm.trim()) return outfits;
    return outfits.filter((o) =>
      o.title.toLowerCase().includes(outfitSearchTerm.toLowerCase())
    );
  }, [outfits, outfitSearchTerm]);

  return (
    <div className="space-y-6 animate-fade-in text-left">
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

            return (
              <div
                key={outfit.outfitId}
                onClick={() => setSelectedOutfit(outfit)}
                className="bg-white rounded-[24px] border border-slate-100 p-3 space-y-3 cursor-pointer hover:border-[#1E3A8A] transition shadow-3xs group"
              >
                <div className="aspect-square bg-slate-50 rounded-2xl flex overflow-hidden border border-slate-50">
                  <div className="w-1/2 h-full border-r border-slate-100 flex items-center justify-center p-1 bg-white">
                    {top?.imageUrl || top?.userImageUrl ? (
                      <AuthenticatedImage
                        src={(top.userImageUrl || top.imageUrl) as string}
                        alt="top"
                        className="w-full h-full object-contain"
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
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xl">👖</span>
                    )}
                  </div>
                </div>
                <div>
                  <h4 className="text-[12px] font-black text-slate-800 line-clamp-1 group-hover:text-[#1E3A8A] transition">
                    {outfit.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-bold">
                    아이템 {outfit.items.length}개
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
