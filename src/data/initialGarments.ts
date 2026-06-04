import { Garment } from "@/types/index";

// Default starting garments with precise anatomical properties initialized
export const INITIAL_GARMENTS: Garment[] = [
    {
        id: "g1",
        name: "고정밀 크루넥 입체 코튼 티셔츠",
        category: "Top",
        color: "수플레 화이트",
        style: "Minimal",
        fitType: "세미 오버핏",
        fabricMaterial: "헤비 쥬리 코튼 100% (450g/y)",
        isFavorite: true,
        isWishlist: false,
        thumbnailUrl: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600",
        anatomicalFit: {
            shoulderPrecision: 96,
            chestTightness: 42,
            muscularStressLevel: "대흉근(Pectoralis Major) 상단을 가볍게 스치듯 떨어지며, 겨드랑이 밑 광배근 이음새에 압박이 없는 유선형 흐름 설계",
            skeletonDrapeFactor: "양측 쇄골(Clavicle) 끝 가시돌기에 무게를 고르게 분산하여 승모근 하중에 의한 목 늘어남 현상을 완벽 방지",
            recommendedBodyType: "역삼각형 골격 유형 및 어깨가 소폭 굽은 라운드숄더 보정에 매우 적합"
        }
    },
    {
        id: "g2",
        name: "아나토믹 드레이프 루즈 와이드 데님",
        category: "Bottom",
        color: "인디고 블루",
        style: "Casual",
        fitType: "와이드 루즈핏",
        fabricMaterial: "14oz 프리미엄 댕강 셀비지 데님",
        isFavorite: false,
        isWishlist: false,
        thumbnailUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600",
        anatomicalFit: {
            shoulderPrecision: 85,
            chestTightness: 30,
            muscularStressLevel: "골반 장골극(Iliac Crest)부터 대퇴사두근(Quadriceps Femoris) 라인을 따라 흐르며 보행 운동 시 허벅지 마찰 응집력 제로 구현",
            skeletonDrapeFactor: "중력 작용 방향과 일치하는 미니멀 수직 드레이핑 곡선 설계",
            recommendedBodyType: "허벅지 근육(대퇴근)이 크게 발달하여 슬림 팬츠 착용 시 스트레스가 심한 운동인군"
        }
    },
    {
        id: "g3",
        name: "고정밀 입체 쉘 테크니컬 아노락",
        category: "Outer",
        color: "어반 피트 카키",
        style: "Gorpcore",
        fitType: "루즈 익스텐션",
        fabricMaterial: "3-Layer PTFE 방수 멤브레인 쉘",
        isFavorite: true,
        isWishlist: false,
        thumbnailUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600",
        anatomicalFit: {
            shoulderPrecision: 92,
            chestTightness: 55,
            muscularStressLevel: "삼각근(Deltoid) 회전 반경에 최적화된 패널 마감으로, 팔을 상방 180도 회전 시에도 편안함 선사",
            skeletonDrapeFactor: "경추 후방 돌출부(C7)에서 어깨 견봉(Acromion)으로 흐르는 비대칭 인체 곡선에 맞춤 밀착",
            recommendedBodyType: "어깨 볼륨감이 크거나 아웃도어 가동 범위가 넓어 유연성을 극대화해야 하는 액티브 등급"
        }
    },
    {
        id: "g4",
        name: "에센셜 미니멀 스트레이트 치노",
        category: "Bottom",
        color: "샌드 크림",
        style: "Minimal",
        fitType: "스트레이트 슬림핏",
        fabricMaterial: "고밀도 개버딘 수입 코튼 100%",
        isFavorite: false,
        isWishlist: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1479064555552-3ef4979f8908?auto=format&fit=crop&q=80&w=600",
        anatomicalFit: {
            shoulderPrecision: 78,
            chestTightness: 60,
            muscularStressLevel: "둔근(Gluteus Maximus) 굴곡선에 밀착하여 뒤태 힙업 시각적 효과 극대화",
            skeletonDrapeFactor: "무릎 슬개골(Patella) 주위 회전 하중을 고려한 테이퍼드 앵클 컷 구성",
            recommendedBodyType: "다리 라인이 직선으로 떨어지며 고관절 볼륨이 슬림한 마디형 골격군"
        }
    },
    {
        id: "g5",
        name: "프리미엄 입체 패딩 비건 가죽 재킷",
        category: "Outer",
        color: "매트 누아르 블랙",
        style: "Street",
        fitType: "박시 크롭핏",
        fabricMaterial: "헤비 비건 유광 플리츠 레더",
        isFavorite: false,
        isWishlist: true,
        thumbnailUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600",
        anatomicalFit: {
            shoulderPrecision: 89,
            chestTightness: 48,
            muscularStressLevel: "목덜미 근육 긴장을 분안하는 두터운 가죽 드레이프가 등쪽 능형근 마찰을 상쇄",
            skeletonDrapeFactor: "가슴 전면 갈비뼈(Ribcage)의 호흡 팽창 운동에 따라 자연스럽게 유격이 발생하는 스프링 웰 디자인",
            recommendedBodyType: "체구가 다소 슬림하며 어깨 라인에 묵직한 하드 쉘 서포팅을 주기 원하는 프레임 강화 스타일"
        }
    }
];