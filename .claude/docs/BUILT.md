# BUILT.md

## Current State
Scaffold complete. Next.js 16 app with TypeScript, Tailwind CSS v4, ESLint, D3, and Framer Motion. No features built yet.

## Steps Completed

### Step 0 — Scaffold (2026-03-27)
Bootstrapped project with `pnpm create next-app@latest` (App Router, TypeScript, Tailwind, src dir, `@/*` alias). Added D3, Framer Motion, `@types/d3`, Prettier with `prettier-plugin-tailwindcss`. Lint and tsc both pass with zero errors.

**Files changed:**
- `package.json` — dependencies: next, react, react-dom, d3, framer-motion; devDeps: tailwind, typescript, eslint, @types/d3, prettier, prettier-plugin-tailwindcss
- `pnpm-lock.yaml` — lockfile
- `.prettierrc` — semi:false, singleQuote, tabWidth:2, trailingComma:es5, prettier-plugin-tailwindcss
- `tsconfig.json` — strict mode, `@/*` → `src/*`
- `next.config.ts` — default Next.js config
- `eslint.config.mjs` — next/core-web-vitals + next/typescript
- `postcss.config.mjs` — @tailwindcss/postcss
- `src/app/layout.tsx` — root layout with Tailwind base
- `src/app/page.tsx` — default Next.js landing page
- `src/app/globals.css` — Tailwind directives
- `src/app/favicon.ico` — default favicon
- `public/` — default Next.js SVG assets

## Current File Tree
```
src/
  app/
    favicon.ico
    globals.css
    layout.tsx
    page.tsx
```
