// Static recommended product collections mapping beautifully for each recommendation button triggers
export const TRIGGER_PRODUCTS: Record<string, any[]> = {
    Casual: [
        {
            id: "tr_cas1",
            name: "피그먼트 오버사이즈 쿨 코튼 맨투맨",
            category: "Top",
            color: "피그먼트 차콜",
            matchRate: 98,
            imageName: "top_tee",
            styleTag: "Casual",
            price: "49,000",
            notes: "대흉근 하단을 누르는 가벼운 세미 오버 드롭라인"
        },
        {
            id: "tr_cas2",
            name: "라이트 워시드 스트레이트 크롭 데님",
            category: "Bottom",
            color: "아이스 블루",
            matchRate: 94,
            imageName: "bottom_jeans",
            styleTag: "Casual",
            price: "58,000",
            notes: "대퇴사두근에 쓸림이 없는 여유로운 골반 둘레"
        },
        {
            id: "tr_cas3",
            name: "어반 데일리 컴포트 스웨이드 스니커즈",
            category: "Shoes",
            color: "크림 샌드",
            matchRate: 88,
            imageName: "shoes_sneakers",
            styleTag: "Casual",
            price: "72,000",
            notes: "아킬레스건 마찰을 상쇄하는 쿠션 패딩"
        }
    ],
    Minimal: [
        {
            id: "tr_min1",
            name: "시그니처 입체 크루넥 코튼 티셔츠",
            category: "Top",
            color: "수플레 벨벳 화이트",
            matchRate: 99,
            imageName: "top_tee",
            styleTag: "Minimal",
            price: "39,000",
            notes: "목 늘어남을 방지하는 실리콘 이음 테이핑"
        },
        {
            id: "tr_min2",
            name: "테일러드 플랫 플리츠 슬림 티드 슬랙스",
            category: "Bottom",
            color: "슬레이트 탄소 블랙",
            matchRate: 96,
            imageName: "bottom_jeans",
            styleTag: "Minimal",
            price: "69,000",
            notes: "무릎 슬개골 하단부터 부드럽게 좁아지는 입체 패턴"
        },
        {
            id: "tr_min3",
            name: "에센셜 버진 울 드레이프 블레이저 코트",
            category: "Outer",
            color: "미드나잇 누아르",
            matchRate: 91,
            imageName: "outer_jacket",
            styleTag: "Minimal",
            price: "189,000",
            notes: "쇄골 끝 견봉 부위에 하중을 고르게 배분하는 특수 패드"
        }
    ],
    Street: [
        {
            id: "tr_str1",
            name: "그래픽 프린티드 오버사이즈 피그먼트 후디",
            category: "Top",
            color: "블랭크 데미지 그레이",
            matchRate: 97,
            imageName: "top_tee",
            styleTag: "Street",
            price: "85,000",
            notes: "삼각근과 회선건개 가동 범위를 고려한 벌룬 슬리브"
        },
        {
            id: "tr_str2",
            name: "헤비 듀티 벌룬 와이드 데님 카고 팬츠",
            category: "Bottom",
            color: "딥 가먼트 워시드 인디고",
            matchRate: 95,
            imageName: "bottom_jeans",
            styleTag: "Street",
            price: "79,000",
            notes: "고관절 및 복직근 압박을 완벽 소멸한 고무 밴딩"
        },
        {
            id: "tr_str3",
            name: "볼륨 테크 플레이트 하이 폼 더블 슈즈",
            category: "Shoes",
            color: "매트 유광 블랙",
            matchRate: 92,
            imageName: "shoes_sneakers",
            styleTag: "Street",
            price: "135,000",
            notes: "족저근막 하방 피로도를 경감하는 특수 러버 아웃솔"
        }
    ],
    Amekaji: [
        {
            id: "tr_ame1",
            name: "헤리티지 마운틴 아노락 캠퍼 셔츠 자켓",
            category: "Outer",
            color: "비치 머스타드 샌드",
            matchRate: 95,
            imageName: "outer_jacket",
            styleTag: "Amekaji",
            price: "124,000",
            notes: "광배근 이음새 수축 하중을 분진 방지처리"
        },
        {
            id: "tr_ame2",
            name: "프리미엄 헤비 옥스포드 워크 인디고 셔츠",
            category: "Top",
            color: "빈티지 샴브레이 스카이",
            matchRate: 91,
            imageName: "top_tee",
            styleTag: "Amekaji",
            price: "56,000",
            notes: "경추 후방 피로도를 상쇄하는 넉넉한 넥 드롭 둘레"
        },
        {
            id: "tr_ame3",
            name: "더블 니 헤비 트윌 크롭 카키 팬츠",
            category: "Bottom",
            color: "아메리칸 빈티지 카키",
            matchRate: 89,
            imageName: "bottom_jeans",
            styleTag: "Amekaji",
            price: "89,000",
            notes: "허벅지 봉공근 라인의 활동 편의를 위한 덧댐 박음질"
        }
    ],
    Gorpcore: [
        {
            id: "tr_gop1",
            name: "테크니컬 방수 PTFE 3-Layer 미니멀 아노락",
            category: "Outer",
            color: "어반 세이지 카키",
            matchRate: 99,
            imageName: "outer_jacket",
            styleTag: "Gorpcore",
            price: "198,000",
            notes: "어깨 회전축 입체 보정이 반영되어 가동성 극대화"
        },
        {
            id: "tr_gop2",
            name: "나일론 패러슈트 테크 조거 기어 팬츠",
            category: "Bottom",
            color: "어반 피트 스톤 그레이",
            matchRate: 96,
            imageName: "bottom_jeans",
            styleTag: "Gorpcore",
            price: "115,000",
            notes: "오금막 주름 및 걸음 스트레스를 제거하는 테이핑 절개"
        },
        {
            id: "tr_gop3",
            name: "비브람 아웃솔 전방위 접지 트레일 트레커",
            category: "Shoes",
            color: "아노다이즈 머드 블랙",
            matchRate: 93,
            imageName: "shoes_sneakers",
            styleTag: "Gorpcore",
            price: "189,000",
            notes: "복사골 통증을 제어하는 인체 맞춤 오쏘라이트 폼 패드"
        }
    ],
    Rainy: [
        {
            id: "tr_rai1",
            name: "울트라 하드쉘 3레이어 패커블 레이니 코트",
            category: "Outer",
            color: "세미 매트 누아르",
            matchRate: 98,
            imageName: "outer_jacket",
            styleTag: "Gorpcore",
            price: "159,000",
            notes: "방수 멤브레인이 완벽 탑재되어 빗방울을 전방위 탄성 튕김"
        },
        {
            id: "tr_rai2",
            name: "발수 나일론 테크 조거 카고 쇼츠",
            category: "Bottom",
            color: "어스 카키 그레이",
            matchRate: 93,
            imageName: "bottom_jeans",
            styleTag: "Casual",
            price: "68,000",
            notes: "빗물이 튀어도 즉시 표면 건조되는 극강 나일론 테크"
        },
        {
            id: "tr_rai3",
            name: "고인장 접지방지 워터프루프 아웃솔 데크 슈즈",
            category: "Shoes",
            color: "매트 누아르",
            matchRate: 90,
            imageName: "shoes_sneakers",
            styleTag: "Gorpcore",
            price: "95,000",
            notes: "미끄러운 대리석 지면 노면 접지 계수를 78% 강화"
        }
    ],
    Special: [
        {
            id: "tr_sp1",
            name: "어반 미니멀 투 버튼 이브닝 피트 재킷",
            category: "Outer",
            color: "차분한 딥 네이비",
            matchRate: 97,
            imageName: "outer_jacket",
            styleTag: "Minimal",
            price: "168,000",
            notes: "어깨 하향 각도가 완만한 정중형 드레이핑 블레이저"
        },
        {
            id: "tr_sp2",
            name: "스위스 수입 코튼 슬림 릴랙스드 드레스 셔츠",
            category: "Top",
            color: "아이보리 퓨어 화이트",
            matchRate: 93,
            imageName: "top_tee",
            styleTag: "Minimal",
            price: "79,000",
            notes: "수축 복원력이 뛰어난 하이 카운트 패브릭"
        },
        {
            id: "tr_sp3",
            name: "스퀘어드 솔 클래식 레더 로퍼 드레스슈즈",
            category: "Shoes",
            color: "피아노 블랙",
            matchRate: 91,
            imageName: "shoes_sneakers",
            styleTag: "Minimal",
            price: "198,000",
            notes: "발볼 압박 강도를 32% 경감한 부드러운 가죽 전사피"
        }
    ]
};