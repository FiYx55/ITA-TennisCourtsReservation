# Web Client Guidelines

## Tech Stack
- Next.js (App Router) + TypeScript
- shadcn/ui + Tailwind CSS
- Micro frontend architecture (modular by business domain)

## Architecture
- `src/modules/` — isolated business modules (auth, courts, reservations, notifications, admin)
- `src/components/ui/` — shadcn/ui base components (never edit directly)
- `src/components/ui/custom/` — modified or extended versions of shadcn/ui components
- `src/lib/` — shared utilities (API client, auth context, constants)
- `src/app/` — Next.js App Router pages (thin shell, delegates to modules)
- Modules must not import from other modules — only from shared `components/`, `lib/`

## Component Rules
- Use shadcn/ui components as much as possible
- Never directly edit shadcn/ui base components in `components/ui/`
- If a modification is needed, create a new component in `components/ui/custom/` that wraps or extends the original
- Maximize modularity and reusability — extract repeated patterns into shared components
- Keep page-level components thin; business logic lives in module-specific hooks

## Styling Rules
- Mobile-first approach — design for small screens first, add responsive breakpoints up
- No magic values — use Tailwind theme tokens, CSS variables, or named constants
- Styles and design tokens should be defined globally in `globals.css` or `tailwind.config.ts`
- Use Tailwind utility classes; avoid inline style objects

## Code Standards
- All API calls go through a single shared API client configured with the gateway base URL
- Types/interfaces for API responses live in their respective module's `types.ts`
- Prefer server components where possible; use `"use client"` only when needed
