# SmartInventory 

A full-featured inventory and order management dashboard.

**Live site:** [https://speed-distribution-client.vercel.app](https://speed-distribution-client.vercel.app)

---

## Features

- **Authentication** — Secure sign-up and login with client-side password encryption.
- **Dashboard** — At-a-glance stat cards (orders, stock alerts, revenue trends) with a bar chart powered by Recharts. Recent activity feed inline.
- **Products** — Full CRUD for products with category assignment, price, stock level, minimum stock threshold, and status. Paginated table with search.
- **Orders** — Create orders with async product search (react-select). Advance order status through a defined flow: `pending → confirmed → shipped → delivered` (or `cancelled`). Paginated with status badges.
- **Restock Queue** — Auto-populated list of products below their minimum stock threshold, sorted by priority (high / medium / low).
- **Activity Log** — Paginated audit trail of all actions taken within the system.
- **Protected Routes** — All dashboard pages require authentication; unauthenticated users are redirected to login.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [React 19](https://react.dev) |
| Language | [TypeScript 5.9](https://www.typescriptlang.org) |
| Build tool | [Vite 8](https://vite.dev) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| State management | [Redux Toolkit](https://redux-toolkit.js.org) + [React Redux](https://react-redux.js.org) |
| Routing | [React Router v7](https://reactrouter.com) |
| HTTP client | [Axios](https://axios-http.com) |
| Charts | [Recharts](https://recharts.org) |
| Select / async search | [React Select](https://react-select.com) |
| Icons | [Lucide React](https://lucide.dev) |
| Encryption | [CryptoJS](https://github.com/brix/crypto-js) |
| Linting | ESLint 9 + typescript-eslint |
| Deployment | [Vercel](https://vercel.com) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview production build locally

```bash
npm run preview
```

---

## Project Structure

```
src/
├── api/            # Axios API modules (products, orders, restock, activity, analytics)
├── components/     # Shared UI components (Layout, sidebar, etc.)
├── pages/          # Route-level page components
│   ├── Login.tsx
│   ├── SignUp.tsx
│   ├── Dashboard.tsx
│   ├── Products.tsx
│   ├── Orders.tsx
│   ├── RestockQueue.tsx
│   └── ActivityLog.tsx
├── store/          # Redux store and slices (auth)
├── types/          # Shared TypeScript types
├── utils/          # Utility helpers (e.g. password encryption)
└── App.tsx         # Root component with routing
```
