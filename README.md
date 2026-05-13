# Cashlio — Admin SaaS (App A)

The cloud-hosted license management dashboard used internally by the software team. Manages tenants, generates license keys, and issues signed JWT tokens to activate branch installations.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Auth**: Better-Auth
- **Database**: PostgreSQL (cloud) via Prisma ORM
- **UI**: Tailwind CSS + Shadcn UI
- **Validation**: Zod + React Hook Form
- **JWT Signing**: Jose (HS256)

## Prerequisites

- Node.js 20+
- A running PostgreSQL instance (cloud or local)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | Secret key for Better-Auth sessions |
| `BETTER_AUTH_URL` | Public base URL of this app (e.g. `http://localhost:3000`) |
| `JWT_SECRET` | Secret used to sign license JWTs — **must match `JWT_SECRET` in `main-local`** |
| `NEXT_PUBLIC_APP_URL` | Public URL for the auth client |

### 3. Run database migrations

```bash
npx prisma migrate deploy
```

### 4. Seed the first admin user (first time only)

```bash
node scripts/seed-admin.cjs
```

## Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Build for Production

```bash
npm run build
npm run start
```

## Key API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/v1/licenses/activate` | Validates a license key, binds it to a hardware MAC, returns a signed JWT |
| `POST` | `/api/v1/licenses/update-profile` | Syncs branch name back to the cloud after shop profile setup |

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login page (Better-Auth)
│   ├── api/v1/          # REST API routes
│   └── dashboard/       # Tenant & license management UI
├── components/          # Shadcn UI + custom components
├── lib/
│   ├── auth.ts          # Better-Auth server config
│   ├── jwt.ts           # Jose JWT sign/verify helpers
│   └── prisma.ts        # Prisma client singleton
└── actions/             # Next.js server actions
prisma/
├── schema.prisma        # DB schema (Tenant, License, User)
└── migrations/          # Migration history
scripts/
├── seed-admin.cjs       # Seeds the first admin user
└── seed.cjs             # General seed data
```
