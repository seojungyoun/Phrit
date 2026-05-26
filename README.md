# PHRIT

PHRIT은 하루에 하나의 질문에 답하듯, 사진 한 장과 짧은 문장 하나를 남기는 미니멀 감성 SNS입니다.

서비스의 핵심은 많은 콘텐츠를 빠르게 소비하는 것이 아니라, 오늘을 닮은 장면 하나를 조용히 기록하고 서로의 감각에 반응하는 것입니다.

## 현재 완성 상태

기준일: 2026-05-22

배포 가능한 MVP 기준으로 다음 흐름을 구현했습니다.

- 이메일 로그인, 회원가입, 비밀번호 재설정
- Google/Apple OAuth 진입 및 Supabase 세션 교환
- 앱 실행 시 Supabase 세션 복원
- 로그인 전/후 라우팅 분리
- 오늘의 질문 조회
- 하루 한 질문에 한 번만 게시 가능하도록 클라이언트 차단
- 사진 선택, 이미지 리사이즈/압축, Supabase Storage 업로드
- 게시물 생성
- 무한 스크롤 피드
- pull-to-refresh
- 피드 empty/loading/error 상태
- 게시물 felt 반응 추가/취소
- 문장 검색
- 내 프로필 자동 생성 및 내 게시물 목록
- 프로필 편집
- 내 게시물에 도착한 반응 알림 목록
- 게시물 상세 화면
- 댓글 작성 및 삭제
- 게시물 저장
- 게시물 신고
- 사용자 차단
- 내 게시물 삭제
- 관리자용 오늘의 질문 등록/활성화 화면
- 관리자용 신고 검토 화면
- Expo Push Token 저장
- Supabase Edge Function 기반 Expo Push 발송 엔드포인트
- Supabase 테이블, RLS 정책, Storage bucket 정책
- 기본 앱 아이콘/스플래시 이미지
- 스토어 등록 초안 및 기본 스크린샷
- E2E 수동 체크리스트
- GitHub Actions CI 기본 설정
- EAS Build 기본 설정

아직 운영 품질을 높이기 위해 추가하면 좋은 항목은 다음과 같습니다.

- 정식 법률 검토가 완료된 개인정보 처리방침/이용약관

## 기술 스택

- React Native
- Expo
- Expo Router
- TypeScript
- Zustand
- TanStack Query
- Supabase Auth
- Supabase Postgres
- Supabase Storage

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
  functions/send-push/
```

## 실행 방법

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만들고 Supabase 값을 입력합니다.

```env
EXPO_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### 3. Supabase 스키마 적용

Supabase SQL Editor에서 아래 파일 내용을 실행합니다.

```txt
supabase/schema.sql
```

이 스키마는 다음을 포함합니다.

- `profiles`
- `daily_questions`
- `posts`
- `reactions`
- `comments`
- `saved_posts`
- `reports`
- `blocked_users`
- `push_tokens`
- `post-images` Storage bucket
- `profile-images` Storage bucket
- RLS 정책
- 신규 사용자 프로필 자동 생성 트리거
- 오늘 날짜의 기본 질문 seed

관리자 화면을 사용하려면 Supabase SQL Editor에서 해당 사용자의 `profiles.is_admin` 값을 `true`로 바꾸세요.

```sql
update profiles
set is_admin = true
where id = 'USER_UUID';
```

소셜 로그인을 사용하려면 Supabase Dashboard에서 아래를 설정하세요.

```txt
Authentication → Providers → Google / Apple 활성화
Authentication → URL Configuration → Redirect URLs
```

개발 중에는 Expo redirect URL과 앱 scheme을 함께 등록해야 합니다.

```txt
phrit://
exp://127.0.0.1:8081
http://localhost:8081
```

실제 EAS 빌드에서는 Expo가 출력하는 redirect URL을 추가로 등록하세요.

푸시 발송 Edge Function은 아래처럼 배포합니다.

```bash
supabase functions deploy send-push
```

호출 예시:

```json
{
  "userId": "USER_UUID",
  "title": "New echo",
  "body": "Someone reacted to your PHRIT.",
  "data": { "postId": "POST_UUID" }
}
```

### 4. 개발 서버 실행

```bash
npm run start
```

플랫폼별 실행:

```bash
npm run ios
npm run android
npm run web
```

## 배포 방법

EAS CLI 로그인 후 빌드합니다.

```bash
npx eas login
npx eas build --profile production --platform ios
npx eas build --profile production --platform android
```

스토어 제출 전 `app.json`의 `ios.bundleIdentifier`, `android.package`, 앱 아이콘, 스플래시 이미지, 권한 문구를 실제 서비스 정보로 바꾸세요.

## 배포 전 체크리스트

- Supabase URL과 anon key가 `.env`에 들어갔는지 확인
- `supabase/schema.sql` 적용
- Supabase Auth에서 Email provider 활성화
- Google/Apple OAuth를 사용할 경우 provider 설정과 redirect URL 등록
- `post-images` bucket이 public인지 확인
- iOS/Android bundle id를 실제 소유 도메인 기준으로 변경
- 앱 아이콘과 스플래시 이미지 추가
- 관리자 계정의 `profiles.is_admin` 설정
- `npm run typecheck` 통과
- 실제 기기에서 로그인, 게시, 피드, 검색, 로그아웃 테스트

## 주요 명령어

```bash
npm run start
npm run typecheck
npm run lint
```
