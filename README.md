# PHRIT

A calm, cinematic, question-based social photo app built with Expo + Supabase.

## Architecture

- `app/`: Expo Router route tree
- `src/components`: reusable primitives
- `src/features`: domain-based feature modules (auth, feed, post, profile, search, notifications)
- `src/theme`: light/dark theme tokens and hooks
- `src/lib`: third-party clients (Supabase)
- `supabase/schema.sql`: Postgres schema and RLS setup

## Core Product Flows

1. **Authentication**: Email/password, Google, Apple, forgot password via Supabase Auth.
2. **Daily Question Feed**: Infinite, realtime-ready feed with cinematic card UI and subtle fade transitions.
3. **Posting**: One photo + one short sentence (<=80 chars), crop and compress before Storage upload.
4. **Profile**: History, saved posts, reactions, account/session controls.

## Setup

```bash
npm install
cp .env.example .env
npm run start
```

Create `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```
