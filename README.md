# PHRIT

PHRIT는 **하루에 하나의 질문**에 대해,
사용자가 **사진 1장 + 짧은 문장 1개**로 답하는 미니멀 감성 SNS입니다.

핵심 철학은 다음과 같습니다.

- 사용자가 중심이 아니라 **오늘의 질문**이 중심
- 팔로워/인플루언서 문화보다 **공유된 감정과 순간** 중심
- 빠른 소비형 피드보다 **조용하고 호흡 있는 시각 저널**

---

## 현재 구현 상태 (2026-05-18 기준)

> 아래는 현재 저장소 기준으로 **완료된 범위**와 **미완료 범위**를 구분한 내용입니다.

### ✅ 완료됨

#### 1) 프로젝트 기본 구조
- Expo Router 기반 앱 구조 구성
- 탭 네비게이션(홈/검색/알림/프로필) 구성
- 루트 스택 + 모달 라우트(post/create) 구성

#### 2) 디자인/테마 기반
- 라이트/다크 모드 색상 토큰 분리
- 공용 Screen, Typography 컴포넌트 생성
- 피드 카드 스타일(라운드/오버레이/잔잔한 페이드 애니메이션) 반영

#### 3) 피드 기본 동작
- TanStack Query `useInfiniteQuery` 기반 페이지네이션
- Supabase `posts` 테이블 조회 연동
- 리스트 무한 스크롤(onEndReached) 동작

#### 4) 인증 연동 유틸
- 이메일 로그인/회원가입
- 비밀번호 재설정 요청
- Google/Apple OAuth 진입 함수 구성
- Supabase 세션 영속화(AsyncStorage) 설정

#### 5) 업로드 파이프라인(핵심 유틸)
- 이미지 선택 + 편집 허용
- 이미지 리사이즈/압축
- Supabase Storage 업로드
- 게시글 생성 시 캡션 80자 제한 반영

#### 6) 백엔드 스키마 초안
- `profiles`, `daily_questions`, `posts`, `reactions`, `comments`, `saved_posts`
- 1일 1질문/유저-질문별 1포스트 제약(Unique)
- RLS 활성화 구문 포함

---

### ⚠️ 아직 미완료 / 추가 구현 필요

- 실제 인증 화면 UI/폼/검증/에러 처리
- Google/Apple OAuth 콜백 처리 및 딥링크 안정화
- 질문 관리(Admin) UI/운영 플로우
- Realtime 구독(새 포스트/리액션/댓글 알림)
- 댓글/리액션/저장/신고/삭제 전체 UX 완성
- 프로필 편집, 저장 포스트/반응 히스토리 상세 구현
- 검색(유저/지난 질문) 실제 쿼리 및 결과 UI
- 알림 시스템(테이블/트리거/푸시) 본 구현
- 이미지 로딩 스켈레톤/오류 fallback/성능 튜닝
- RLS 정책 상세 정의(현재는 enable만 되어 있음)
- 글로벌 폰트 `Chivo` 실제 로딩/적용
- 테스트 코드(E2E/단위) 및 CI

---

## 기술 스택

- **Frontend**: React Native (Expo), TypeScript, Expo Router, Zustand, TanStack Query
- **Backend**: Supabase Auth, Supabase Postgres, Supabase Storage

---

## 폴더 구조

```txt
app/
  _layout.tsx
  auth.tsx
  post/create.tsx
  (tabs)/
    _layout.tsx
    index.tsx
    search.tsx
    notifications.tsx
    profile.tsx

src/
  components/
  features/
    auth/
    feed/
    notifications/
    post/
    profile/
    search/
  lib/
  providers/
  store/
  theme/

supabase/
  schema.sql
```

---

## 실행 방법

### 1) 의존성 설치

```bash
npm install
```

### 2) 환경 변수 설정

`.env` 파일을 루트에 생성하고 아래 값 입력:

```env
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

(참고: `.env.example` 템플릿 사용 가능)

### 3) 개발 서버 실행

```bash
npm run start
```

필요 시:

```bash
npm run ios
npm run android
npm run web
```

---

## Supabase 스키마 반영

Supabase SQL Editor에서 아래 파일 내용을 실행하세요.

- `supabase/schema.sql`

> 현재 스키마는 기본 테이블/제약 위주이며,
> 실제 서비스 배포 전에는 RLS policy를 역할별로 상세 정의해야 합니다.

---

## 다음 우선 작업 추천

1. Auth 화면/세션 가드 완성
2. Daily Question 조회 API + 오늘 질문 고정 노출
3. Post 작성 모달(UI + 업로드 유틸 연결)
4. Realtime 피드 갱신
5. RLS 정책 및 신고/삭제 정책 확정

