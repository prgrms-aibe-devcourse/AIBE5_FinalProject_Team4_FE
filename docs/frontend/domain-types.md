---
doc_type: fe_domain_types
source_of_truth: AIBE5_FinalProject_Team4_FE
be_domain_source_of_truth: AIBE5_FinalProject_Team4_BE/docs/domain
last_updated: 2026-06-21
---

# FE 도메인 타입 기준

이 문서는 FE 코드에서 사용하는 도메인 타입, API code, 화면 label의 기준을 정리합니다. 도메인 용어와 code 원본은 BE 공통 문서인 [glossary.md](../domain/glossary.md), [catalog.md](../domain/catalog.md), [invariants.md](../domain/invariants.md)를 따릅니다.

FE 코드는 화면 표시를 위해 한글 label이나 UI 전용 타입을 둘 수 있지만, API 요청/응답과 실제 도메인 상태 판단은 이 문서의 공식 code 기준을 사용합니다.

## 공식 API Code

### CategoryCode

| Code | 화면 표시 | 설명 |
| --- | --- | --- |
| `TOP` | 상의 | 상의 카테고리 |
| `BOTTOM` | 하의 | 하의 카테고리 |
| `OUTER` | 아우터 | 아우터 카테고리 |
| `SHOES` | 신발 | 신발 카테고리 |

FE 화면에서 `Top`, `Bottom`, `Outer`, `Shoes` 같은 PascalCase 표시값을 임시로 사용할 수 있으나, 실제 API 요청/응답 타입의 기준값으로 사용하지 않습니다.

### OwnershipStatus

| Code | 화면 표시 | 설명 |
| --- | --- | --- |
| `OWNED` | 보유 | 사용자가 실제로 보유한 옷 |
| `WISHLIST` | 미보유 | 아직 보유하지 않았지만 관심 상품으로 저장한 옷 |

보유/미보유 상태는 `WARDROBE_CLOTHES.ownership_status` 기준입니다. FE 내부의 `isWishlist` boolean은 mock 또는 변환 전 UI 상태로만 사용할 수 있으며, 실제 API 연동 기준을 대체하지 않습니다.

### ClothesInfoSource

| Code | 화면 표시 | 설명 |
| --- | --- | --- |
| `PHOTO` | 사진 기반 등록 | 사용자가 직접 촬영하거나 업로드한 옷 사진 기반 등록 |
| `PURCHASE_HISTORY` | 구매내역 기반 등록 | 구매내역 캡처 이미지 기반 등록 |
| `EXTERNAL_SHOPPING` | 외부 쇼핑몰 등록 | 외부 쇼핑몰 상품 정보 기반 등록 |

옷 등록 흐름에서 사용자가 어떤 등록 방식을 선택했는지와 실제 저장 source 값이 충돌하지 않아야 합니다.

### ClothesGender

| Code | 설명 |
| --- | --- |
| `MALE` | 남성 대상 옷 |
| `FEMALE` | 여성 대상 옷 |
| `UNISEX` | 남녀 공용 또는 대상 성별을 특정하기 어려운 옷 |

`ClothesGender`는 `CLOTHES.gender`의 code입니다. 사용자 프로필 성별(`USERS.gender`)과 다른 값이며, FE 화면에 표시하거나 사용자가 직접 수정하는 값으로 취급하지 않습니다.

FE는 이 값을 아래 목적으로만 사용합니다.

- 옷 등록/수정 저장 요청 payload에 포함
- 사진·구매내역 draft/analyze 응답의 내부 상태 유지
- 추천 응답에서 내부 필터 또는 제외 기준으로 사용

### ClothesSeason

| Code | 화면 표시 | 설명 |
| --- | --- | --- |
| `SPRING` | 봄 | 봄에 주로 착용하는 옷 |
| `SUMMER` | 여름 | 여름에 주로 착용하는 옷 |
| `FALL` | 가을 | 가을에 주로 착용하는 옷 |
| `WINTER` | 겨울 | 겨울에 주로 착용하는 옷 |
| `ALL_SEASON` | 사계절 | 특정 계절에 한정하지 않는 옷 |

`ClothesSeason`은 `CLOTHES.season`의 code입니다. 사용자별 옷장 정보가 아니라 옷 공통 정보이며, 옷 등록 저장 시 1개 선택하고 생성 후에는 변경하지 않습니다.

### StyleCode

공식 스타일 code는 [glossary.md](../domain/glossary.md)의 스타일 표를 따릅니다.

| Code | 화면 표시 |
| --- | --- |
| `CASUAL` | 캐주얼 |
| `STREET` | 스트릿 |
| `MINIMAL` | 미니멀 |
| `SPORTY` | 스포티 |
| `CLASSIC` | 클래식 |
| `CHIC` | 시크 |
| `WORKWEAR` | 워크웨어 |
| `CITYBOY` | 시티보이 |
| `GORPCORE` | 고프코어 |
| `RETRO` | 레트로 |

`Amekaji`, `Dandy`, `Tech Casual`, `Vintage Casual`, `Minimal Street`처럼 공식 카탈로그에 없는 값은 실제 API 요청 code로 사용하지 않습니다. 필요한 스타일이 추가되면 BE 카탈로그와 공통 문서를 먼저 갱신합니다.

### ColorCode

공식 색상 code는 [glossary.md](../domain/glossary.md)와 [catalog.md](../domain/catalog.md)를 따릅니다.

대표 예:

| Code | 화면 표시 | HEX |
| --- | --- | --- |
| `WHITE` | 화이트 | `#FFFFFF` |
| `BLACK` | 블랙 | `#212121` |
| `NAVY` | 네이비 | `#1F3A5F` |
| `GRAY` | 그레이 | `#9E9E9E` |
| `BROWN` | 브라운 | `#795548` |

FE 화면은 `hex`로 swatch를 표시할 수 있지만, API 요청에는 `hex`나 한글 이름이 아니라 `code`를 보냅니다.

## API 응답 타입 기준

BE API는 기본적으로 `ApiResponse<T>` 구조를 사용합니다.

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  message: string | null;
};
```

FE 공통 API 타입은 위 구조를 반영해야 합니다. `status`, `errorCode`처럼 BE 공통 응답에 없는 필드를 공통 성공/실패 판단 기준으로 사용하지 않습니다.

HTTP status는 Axios response 또는 error response에서 확인하고, 공통 응답 body의 필드로 가정하지 않습니다.

## FE 타입 작성 기준

API DTO 타입과 UI view model 타입은 구분합니다.

```ts
type CategoryCode = 'TOP' | 'BOTTOM' | 'OUTER' | 'SHOES';
type OwnershipStatus = 'OWNED' | 'WISHLIST';
type ClothesInfoSource = 'PHOTO' | 'PURCHASE_HISTORY' | 'EXTERNAL_SHOPPING';
type ClothesGender = 'MALE' | 'FEMALE' | 'UNISEX';
type ClothesSeason = 'SPRING' | 'SUMMER' | 'FALL' | 'WINTER' | 'ALL_SEASON';

type ApiClothes = {
  clothesId: number;
  brandName?: string;
  name: string;
  category: CategoryCode;
  itemType: string;
  season: ClothesSeason;
  gender: ClothesGender;
  ownershipStatus: OwnershipStatus;
  imageUrl: string | null;
  externalProductUrl?: string | null;
};

type RecommendedClothesItem = {
  clothesId: number;
  wardrobeClothesId: number | null;
  name: string;
  brandName?: string | null;
  imageUrl: string;
  category: CategoryCode;
  itemType: string;
  season: ClothesSeason | null;
  gender?: ClothesGender;
  primaryColor: string;
  secondaryColors: string[];
  styleCodes: string[];
  compatibilityScore: number;
  externalProductUrl?: string | null;
};

type ClothesCardViewModel = {
  id: string;
  title: string;
  categoryLabel: string;
  ownershipLabel: string;
  imageUrl: string | null;
};

type MyProfileResponse = {
  userId: number;
  nickname: string;
  onboarded: boolean;
  birthDate: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  regionName: string;
  regionCode: string;
  profileImageUrl: string;
  profileBio: string;
  externalLinkUrl: string;
  styleCodes: string[];
  socialProviders: string[];
  guideTourCompletedHome?: boolean | null;
  guideTourCompletedWardrobe?: boolean | null;
  guideTourCompletedFeed?: boolean | null;
  guideTourCompletedMypage?: boolean | null;
};

// 룩피드 타입 — src/types/feed.ts 기준
type FeedAuthor = {
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  followedByMe?: boolean;  // 현재 로그인 사용자가 작성자를 팔로우 중인지 여부. undefined이면 팔로우 버튼 미표시. BE FeedAuthorResponse에 필드 추가 후 필수로 전환 예정
};

type FeedPost = {
  feedPostId: number;
  author: FeedAuthor;
  outfit: FeedOutfit | null;
  caption: string | null;
  images: FeedImage[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  savedByMe: boolean;
  hidden: boolean;
  mine: boolean;           // true이면 현재 사용자의 게시물 — 팔로우 버튼 미표시
  createdAt: string;
  updatedAt: string;
};

type FeedInteraction = {
  active: boolean;   // 좋아요/저장/팔로우 현재 활성 상태
  count: number;     // 좋아요/저장/팔로우 총 수
};

type UserProfileResponse = {
  userId: number;
  nickname: string;
  profileImageUrl?: string | null;
  profileBio?: string | null;
  externalLinkUrl?: string | null;
};

type OutfitResponse = {
  outfitId: number;
  title: string;
  items: Array<{
    clothesId: number;
    itemRole: string;
    layerOrder?: number | null;
  }>;
};

type AiMdPersonaResponse = {
  mdId: number;
  name: string;
  speechStyle: string;
};
```

API 응답 타입은 BE DTO 필드명과 code를 유지합니다. 화면 컴포넌트에는 별도 mapper를 통해 label, icon, swatch, empty message 등 UI 표현값을 전달합니다.

프로필, 코디, AI MD 응답 타입의 상세 필드는 BE API 계약을 원본으로 확인합니다. FE 타입은 화면에서 사용하는 필드를 중심으로 작성하되, API DTO 필드명을 임의로 바꾸지 않습니다.

## 현재 코드와 목표 기준

| 구분 | 현재 코드에 남아 있을 수 있는 값 | 목표 기준 |
| --- | --- | --- |
| 카테고리 | `Top`, `Bottom`, `Outer`, `Shoes` | `TOP`, `BOTTOM`, `OUTER`, `SHOES` |
| 보유 상태 | `isWishlist: boolean` | `ownershipStatus: OWNED/WISHLIST` |
| 스타일 | legacy label 또는 static/mock 문자열 | BE catalog의 `StyleCode` |
| 옷 대상 성별 | 등록/수정 화면에서 `MALE`, `FEMALE`, `UNISEX` 직접 선택 UI | 화면 비노출, 내부 저장 요청/추천 분류 code |
| 옷 계절 | 생성 후 수정 화면에서 변경 가능한 값처럼 취급 | `CLOTHES.season`, 등록 시 확정하고 생성 후 변경하지 않음 |
| 응답 타입 | `{ data, message, status }` | `{ success, data, message }` |
| 사용자 ID | `/users/1` 또는 고정 ID | 인증 사용자 ID |

위 현재 코드 값은 임시/mock 또는 변환 전 UI 상태로만 볼 수 있습니다. 실제 API 연동 코드에서는 목표 기준을 사용해야 합니다.

## 문서 변경 기준

- BE 공통 catalog, glossary, invariant가 바뀌면 이 문서도 함께 확인합니다.
- FE API 타입이나 view model 기준이 바뀌면 이 문서를 같은 PR에서 수정합니다.
- 공식 code가 아닌 값을 실제 API 요청에 사용해야 하는 경우, BE 공통 문서와 API 계약을 먼저 갱신합니다.
