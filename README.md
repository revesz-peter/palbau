# Pál Sándor website

Next.js 16, next-intl (Hungarian at `/`, English at `/en`), React Three Fiber, Resend.

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

- **Business facts** (showroom address, phone, email, company data): `lib/site.ts`. A `null` value stays off the page, or shows as "to be added" on the legal pages.
- **All text**: `messages/hu.json` and `messages/en.json`. `pnpm build` fails if their keys differ or if either contains an em or en dash.
- **3D house**: `components/hero/house-model.ts`.
- **Hero posters and section images** come from the 3D scene. After changing the model, start `pnpm dev`, then run `pnpm render:stills` (needs Google Chrome).
