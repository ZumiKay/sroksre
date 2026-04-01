# SrokSre — Online Store

A full-stack e-commerce platform built with Next.js 15 and React 19. Supports product variants, PayPal payments, an admin dashboard, multi-device session management, real-time notifications, and PDF invoice generation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Database | PostgreSQL · Prisma ORM |
| Auth | NextAuth 4 · JWT · bcryptjs |
| UI | Tailwind CSS v4 · HeroUI · Material UI · Framer Motion |
| Payments | PayPal REST API (`@paypal/react-paypal-js`) |
| Real-time | Socket.io |
| Storage | Vercel Blob |
| Email | Nodemailer (Gmail) |
| PDF / Excel | pdf-lib · ExcelJS |
| Testing | Jest · React Testing Library |
| Containerization | Docker + Docker Compose |

---

## Features

### Storefront
- Product listing with category filters, search, and pagination
- Product detail page with multi-variant selection (size, color, material, etc.) and dynamic pricing
- Cart and wishlist management
- Multi-step checkout — shipping address → shipping method → PayPal payment
- 10-minute checkout session with automatic stock hold and release
- PDF invoice generated and emailed on successful order

### Admin Dashboard
- **Inventory** — Create, edit, and delete products; manage variants, stock levels, images, and discounts
- **Orders** — View all orders, update statuses, download invoices, filter by date/price/status
- **User Management** — Create/edit/delete users, assign roles, bulk operations, CSV export
- **Promotions & Banners** — Manage site-wide promotions and homepage banners
- **Homepage Builder** — Drag-and-drop container layout for the storefront home page
- **Policies & FAQs** — Rich-text policy pages and FAQ management

### Security & Sessions
- JWT-based sessions stored in the database with per-device tracking
- Login rate limiting and account lockdown after repeated failures
- Multi-device session viewer — inspect and revoke individual device sessions
- Role-based access control (ADMIN / USER) enforced at middleware and API level
- Google reCAPTCHA on sensitive forms

### Notifications
- In-app notification system for order events (new order, order confirmed) and stock alerts (out-of-stock after purchase)
- Notifications persisted per-user in the database; real-time delivery via Socket.io when connected

---

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for the database)
- A PayPal developer account (sandbox credentials)
- A Gmail account with an App Password enabled
- A Vercel Blob store token

### 1. Clone and install

```bash
git clone https://github.com/your-username/sroksre.git
cd sroksre
npm install
```

### 2. Configure environment variables

Copy the example file and fill in every value:

```bash
cp .env.example .env
```

See the [Environment Variables](#environment-variables) section below for the full reference.

### 3. Start the database

```bash
docker compose up -d
```

This starts a PostgreSQL 18 container (`sroksre_postgres`) on port `5432`.

### 4. Apply migrations and seed

```bash
npx prisma migrate deploy
npx prisma generate
npm run seed        # or: npx tsx prisma/seed.ts
```

The seed script creates an admin account using the credentials in your `.env`.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To also run the Socket.io server (for real-time notifications):

```bash
npm run startserver
```

---

## Project Structure

```
sroksre/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts                # Seed script
│   └── seed/                  # Seed data modules
├── public/                    # Static assets
├── src/
│   ├── app/
│   │   ├── api/               # REST API routes
│   │   │   ├── auth/
│   │   │   ├── products/
│   │   │   ├── order/
│   │   │   ├── users/
│   │   │   ├── banner/
│   │   │   ├── promotion/
│   │   │   ├── policy/
│   │   │   ├── home/
│   │   │   ├── image/
│   │   │   ├── session/
│   │   │   └── cron/
│   │   ├── account/           # Login / registration
│   │   ├── checkout/          # Checkout flow + server actions
│   │   ├── contact/
│   │   ├── dashboard/
│   │   │   ├── inventory/     # Product & stock management (admin)
│   │   │   ├── order/         # Order management
│   │   │   ├── usermanagement/ # User admin
│   │   │   └── devices/       # Active sessions
│   │   ├── product/           # Storefront product pages
│   │   ├── privacyandpolicy/  # Policy & FAQ pages
│   │   ├── severactions/      # Shared Next.js server actions
│   │   ├── component/         # Shared UI components
│   │   ├── layout.tsx
│   │   ├── page.tsx           # Home page
│   │   └── globals.css
│   ├── context/               # React context providers
│   │   ├── GlobalContext.tsx
│   │   └── SocketContext.tsx
│   ├── lib/                   # Utilities (email, session, pricing, PDF…)
│   ├── types/                 # Shared TypeScript types
│   └── middleware.ts          # Route protection
├── docker-compose.yml
├── next.config.js
├── jest.config.ts
└── package.json
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Secret for NextAuth session signing |
| `NEXTAUTH_URL` | Public base URL (e.g. `http://localhost:3000`) |
| `JWT_SECRET` | Secret for custom JWT signing |
| `KEY` | Encryption key for sensitive data (order IDs, etc.) |
| `ADMIN_EMAIL` | Seed admin account email |
| `ADMIN_PASSWORD` | Seed admin account password |
| `ADMIN_FIRSTNAME` | Seed admin first name |
| `ADMIN_LASTNAME` | Seed admin last name |
| `ADMIN_PHONE` | Seed admin phone number |
| `DISCORD_CLIENTID` / `DISCORD_CLIENTSECRET` | Discord OAuth credentials |
| `GMAIL_CLIENTID` / `GMAIL_CLIENTSECRET` | Google OAuth credentials |
| `META_CLIENTID` / `META_CLIENTSECRET` | Meta (Facebook) OAuth credentials |
| `EMAIL` | Gmail address used for sending emails |
| `EMAIL_APPKEY` | Gmail App Password |
| `PAYPAL_BASE` | PayPal API base URL (`https://api-m.sandbox.paypal.com` for sandbox) |
| `NEXT_PUBLIC_PAYPAL_ID` | PayPal client ID |
| `PAYPAL_KEY` | PayPal client secret |
| `NEXT_PUBLIC_CAPTCHA_KEY` | Google reCAPTCHA site key |
| `CAPTCHA_SECRETKEY` | Google reCAPTCHA secret key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob access token |
| `NEXT_PUBLIC_BASE_URL` | Public base URL (used in emails and links) |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io server URL |
| `NEXT_PUBLIC_LOWSTOCK` | Low-stock threshold (default: `5`) |
| `NEXT_PUBLIC_ADMIN_EMAIL` | Contact email shown publicly |
| `NEXT_PUBLIC_ADMIN_PHONENUMBER` | Contact phone shown publicly |
| `NEXT_PUBLIC_ADMIN_FB` | Facebook username for contact links |
| `NEXT_PUBLIC_ADMIN_IG` | Instagram username for contact links |
| `NEXT_PUBLIC_ADMIN_TELEGRAM` | Telegram username for contact links |

---

## Scripts

```bash
npm run dev          # Development server (Next.js)
npm run build        # Production build
npm run start        # Start production server
npm run startserver  # Start Socket.io server (nodemon)
npm run lint         # ESLint
npm test             # Jest test suite
npm run test:watch   # Jest in watch mode
```

---

## Database Schema (Overview)

| Domain | Models |
|---|---|
| Users & Auth | `User`, `Usersession`, `LoginAttempt`, `Address` |
| Products | `Products`, `Variant`, `VariantSection`, `Stock`, `Stockvalue`, `Info`, `Productcover` |
| Categories | `Parentcategories`, `Childcategories`, `Productcategory`, `Producttype` |
| Orders | `Orders`, `Orderproduct` |
| Promotions | `Promotion`, `Banner` |
| Homepage | `Homecontainer`, `Containeritems` |
| Content | `Policy`, `Paragraph`, `Question` |
| User Activity | `Wishlist`, `Notification` |

---

## Order Lifecycle

```
Cart (Incart)
  └─► Checkout started → stock held (Unpaid)
        ├─► Payment confirmed (Paid) → invoice emailed, notifications sent
        ├─► Session expired after 10 min → stock released (Abandoned)
        └─► User navigates away → stock released (Abandoned)
```

After payment:
- Order and user receive in-app notifications
- Any product that reaches zero stock triggers an admin stock-alert notification
- PDF invoice is generated and attached to the confirmation email

---

## License

This project is private. All rights reserved.
