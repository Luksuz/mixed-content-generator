# Next Level Auth

Next.js 14 - @supabase/ssr

## About

This is a Starter Template

Every line of code is open source, offering a collaborative learning experience. Join us on this coding journey and contribute to the future of web development!

# Features

- Nextjs 14 (latest)
- App router
- Supabase
- Supabase with Authentication
- Dark, Light and System - Color theme mode
- SEO Optimized
- Styled using **Tailwind CSS**
- UI Components built using **Shadcn UI (Radix UI)**
- Validations using **Zod**
- Written in **TypeScript**

## Getting Started

1. Install dependencies using pnpm:

```bash
npm install
# or
yarn install
# or
pnpm install
```

<br />

2. Copy `.env.example` to `.env.local` and update the environment variables.

<br />

3. Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

<br />

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/(main)/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

## Environment Variables

This project requires the following environment variables to be set in `.env.local`:

```bash
# Supabase Auth Variables (example; replace with your values)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI API Key for Script Generator and Text-to-Speech
OPENAI_API_KEY=your_openai_api_key

# MiniMax API Key for Text-to-Speech
MINIMAX_API_KEY=your_minimax_api_key
MINIMAX_GROUP_ID=your_minimax_group_id
```

**Note:** The Whisper TTS integration requires a valid OpenAI API key with sufficient credits to use the text-to-speech API. Similarly, the MiniMax TTS integration requires both a valid MiniMax API key and Group ID.
