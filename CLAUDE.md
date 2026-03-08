# CLAUDE.md — Samurai Card Hub

## Project Overview
Samurai Card Hub is a **trading card e-commerce platform** (Pokémon, One Piece, etc.)
with separate US and EU storefronts. Built with Next.js 14 + Prisma + PostgreSQL.

- **US version**: `master` branch → `https://samuraicardhub.com`
- **EU version**: `eu` branch → `https://samuraicardhub-eu.com`
- **Deployment**: Coolify (self-hosted) on VPS

## Tech Stack
- **Framework**: Next.js 14 (App Router, Server Actions)
- **Auth**: NextAuth.js (JOSE/JWT)
- **ORM**: Prisma + PostgreSQL
- **Styling**: Tailwind CSS + shadcn/ui (Radix primitives)
- **Payments**: Wise API
- **Images**: Cloudinary
- **Email**: Resend

## Architecture
```
src/
├── app/                    # Next.js App Router pages
│   ├── admin/              # Admin panel (products, orders, users, settings)
│   ├── auth/               # Login, signup, verify
│   ├── checkout/           # Cart → Checkout → Payment → Success
│   │   ├── page.tsx        # Checkout form (shipping, billing)
│   │   ├── actions.ts      # Server Actions (createOrder, calculateShipping)
│   │   ├── payment/        # Wise payment page
│   │   └── success/        # Order confirmation
│   ├── products/           # Product listing + detail pages
│   └── search/             # Search results
├── components/             # Reusable UI components
├── lib/                    # Shared utilities
│   ├── auth.ts             # NextAuth config
│   ├── prisma.ts           # Prisma client
│   ├── cloudinary.ts       # Image upload
│   └── email.ts            # Resend email
└── types/                  # TypeScript type definitions
prisma/
└── schema.prisma           # Database schema
```

## Branch Strategy
- `master` = US production. All shared features go here first.
- `eu` = EU production. Fork of master with EU-specific changes (country list, branding, customs removal).
- Feature branches → PR to master → merge to eu after.
- **Always check which branch you're on before committing.**

## Key Business Logic
### Shipping Calculation (`checkout/actions.ts`)
- Based on `productType` (SINGLE vs BOX) and destination country
- **Known bug**: If `productType` is missing from cart item mapping, `calculateShipping()` returns `shipping: 0` (FREE). Always include `productType` in `cartItems` mapping.

### Country Restrictions
- US version: All countries
- EU version: `euOnlyCountries` array in signup + checkout (restricted list)

## Development Rules
1. **Use Superpowers workflow**: Brainstorm → Design → Plan → Implement (TDD) → Review → Finish
2. **Test before declaring done**: Run the app, verify the change works
3. **One branch at a time**: Don't mix US and EU changes
4. **Server Actions**: When modifying, be aware of cache invalidation — client JS caches Server Action IDs. After redeployment, users may need hard refresh.
5. **No direct production DB changes**: All schema changes via Prisma migrations
6. **Commit atomically**: One logical change per commit, descriptive messages
7. **Check `eu` branch sync**: Before EU work, ensure `eu` has latest `master` merged

## Environment Variables (required)
```
DATABASE_URL          # PostgreSQL connection
NEXTAUTH_SECRET       # JWT signing
NEXTAUTH_URL          # Site URL (US or EU)
WISE_API_TOKEN        # Payment processing
CLOUDINARY_*          # Image hosting (3 vars)
RESEND_API_KEY        # Email sending
EMAIL_FROM            # Sender address
ADMIN_EMAIL           # Admin notifications
ADMIN_PASSWORD        # Admin login
AUTH_TRUST_HOST       # NextAuth trusted host
```

## Current Known Issues
- `eu` branch is 3 commits behind `master` (needs merge)
- productType mapping missing in checkout → shipping defaults to FREE
- Server Action cache mismatch after container restarts (SIGTERM)

## Don't
- Don't modify `.env` files in git (they're examples only)
- Don't run `prisma db push` without migration review
- Don't commit large debug files or logs
- Don't change admin auth without coordinating both US and EU
