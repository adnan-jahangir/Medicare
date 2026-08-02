<p align="center">
  <img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>

<h1 align="center">💊 MediCare</h1>

<p align="center">
  <strong>A full-stack pharmacy delivery platform with real-time GPS tracking, multi-role dashboards, and integrated payment processing.</strong>
</p>

<p align="center">
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-user-roles">User Roles</a> •
  <a href="#-api-reference">API Reference</a> •
  <a href="#-project-structure">Project Structure</a>
</p>

---

## 🌟 Features

### 🛒 Customer Experience
- **Medicine Catalog** — Browse 1000+ medicines across 8 categories (Pain Relief, Antibiotics, Vitamins, Cold & Flu, Digestive, Diabetes, Heart, Skin Care)
- **Smart Search** — Full-text search with category filtering and instant results
- **Shopping Cart & Wishlist** — Persistent cart with quantity management and wishlist support
- **Prescription Upload** — Upload prescriptions for pharmacist verification and fulfillment
- **Online Payment** — SSLCommerz payment gateway integration with Cash on Delivery fallback
- **Order Tracking** — Real-time GPS tracking on an interactive Leaflet map with live driver location updates

### 📍 Real-Time Delivery Tracking
- **Live GPS Updates** — WebSocket-powered driver location broadcasting via Socket.IO
- **Interactive Map** — Leaflet-based map showing pharmacy → driver → customer route
- **Auto-Arrival Detection** — Haversine distance calculation auto-triggers "Arrived" status at 300m proximity
- **OTP Verification** — 4-digit OTP confirmation for secure delivery handoff
- **Order Timeline** — Visual step-by-step progress indicator from placement to delivery

### 💊 Pharmacy Owner Dashboard
- **Inventory Management** — Add, edit, and manage medicine listings with images, pricing, and stock levels
- **Order Processing** — Accept/reject orders, update preparation status, and manage fulfillment pipeline
- **Revenue Analytics** — Track monthly revenue with interactive Recharts-powered graphs
- **Real-Time Notifications** — Instant new order alerts via Socket.IO pharmacy dashboard rooms

### 🚗 Driver Dashboard
- **Delivery Management** — View available deliveries, accept orders, and manage active routes
- **Live Location Broadcasting** — Real-time GPS coordinate streaming to customers and pharmacy owners
- **OTP-Based Delivery** — Enter customer OTP to confirm successful delivery
- **Wallet System** — Track earnings with built-in driver wallet
- **Registration & Approval** — Multi-step driver registration with NID, driving license, and vehicle verification

### 🔐 Admin Panel
- **User Management** — View, search, and manage all registered users across all roles
- **Driver Approval** — Review and approve/reject pending driver registrations
- **Pharmacy Oversight** — Monitor all registered pharmacies and their performance
- **Medicine Catalog Control** — Global oversight of all medicine listings
- **Order Monitoring** — Track and manage all orders system-wide

### 🔑 Authentication & Security
- **JWT Authentication** — Secure token-based authentication with role-based access control
- **Google OAuth 2.0** — One-click Google Sign-In via `@react-oauth/google`
- **Password Hashing** — bcrypt-based password security
- **Helmet & CORS** — HTTP security headers and cross-origin request handling
- **Rate Limiting** — Express rate limiter to prevent brute-force attacks
- **Input Validation** — Joi schema validation on all API endpoints

---

## 🛠 Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI framework with component-based architecture |
| **TypeScript** | Type safety across the entire frontend |
| **Vite 5** | Lightning-fast build tool and dev server |
| **TailwindCSS 3** | Utility-first CSS with custom design system |
| **Radix UI** | Accessible, unstyled UI primitives (Dialog, Tabs, Toast, etc.) |
| **React Router 6** | Client-side routing with nested layouts |
| **TanStack React Query** | Server state management with caching |
| **Zustand** | Lightweight global state management |
| **Framer Motion** | Smooth page transitions and micro-animations |
| **Leaflet + React Leaflet** | Interactive maps for live order tracking |
| **Recharts** | Data visualization for analytics dashboards |
| **Socket.IO Client** | Real-time WebSocket communication |
| **Zod + React Hook Form** | Form validation and management |
| **Lucide React** | Beautiful, consistent icon library |

### Backend
| Technology | Purpose |
|---|---|
| **Node.js + Express** | RESTful API server |
| **TypeScript** | Type safety across the entire backend |
| **MongoDB + Mongoose** | Document database with ODM |
| **Socket.IO** | Real-time bidirectional WebSocket communication |
| **JWT** | Stateless authentication tokens |
| **bcryptjs** | Secure password hashing |
| **Joi** | Request payload validation |
| **Helmet** | HTTP security headers |
| **Morgan** | HTTP request logging |
| **SSLCommerz** | Payment gateway integration |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Customer │ │  Owner   │ │  Driver  │ │     Admin     │  │
│  │Dashboard │ │Dashboard │ │Dashboard │ │    Panel      │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬────────┘  │
│       │             │            │               │          │
│  ┌────┴─────────────┴────────────┴───────────────┴───────┐  │
│  │              Zustand Store + React Query               │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │ HTTP + WebSocket                     │
└──────────────────────┼──────────────────────────────────────┘
                       │
┌──────────────────────┼──────────────────────────────────────┐
│                 SERVER (Express + Socket.IO)                 │
│  ┌───────────────────┴───────────────────────────────────┐  │
│  │                   API Routes                          │  │
│  │  /auth  /medicines  /orders  /delivery  /payment ...  │  │
│  └───────────────────┬───────────────────────────────────┘  │
│  ┌───────────────────┴───────────────────────────────────┐  │
│  │              Middleware Layer                          │  │
│  │      JWT Auth · Rate Limit · Helmet · Validation      │  │
│  └───────────────────┬───────────────────────────────────┘  │
│  ┌───────────────────┴───────────────────────────────────┐  │
│  │              Socket.IO (Real-Time Layer)               │  │
│  │   Live Tracking · Order Updates · Pharmacy Alerts     │  │
│  └───────────────────┬───────────────────────────────────┘  │
│                      │                                      │
└──────────────────────┼──────────────────────────────────────┘
                       │
              ┌────────┴────────┐
              │    MongoDB      │
              │  (Mongoose ODM) │
              └─────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **MongoDB** (local instance or [MongoDB Atlas](https://www.mongodb.com/atlas))
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/adnan-jahangir/Medicare.git
cd Medicare
```

### 2. Backend Setup

```bash
cd Backend
npm install
```

Create a `.env` file in the `Backend/` directory:

```env
PORT=5001
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/medicare
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id

# SSLCommerz Payment Gateway
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false

# Frontend URL (for CORS and payment callbacks)
CLIENT_URL=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

The API will be running at `http://localhost:5001`

### 3. Frontend Setup

```bash
cd Frontend
npm install
```

Create a `.env` file in the `Frontend/` directory:

```env
VITE_API_URL=http://localhost:5001/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

Start the frontend dev server:

```bash
npm run dev
```

The app will be running at `http://localhost:5173`

### 4. Seed the Database (Optional)

```bash
cd Backend
npx tsx seed.ts
```

---

## 👥 User Roles

| Role | Access | Key Capabilities |
|------|--------|-------------------|
| **Customer** | `/dashboard` | Browse medicines, place orders, track deliveries, upload prescriptions, manage wishlist |
| **Owner / Pharmacy** | `/owner` | Manage inventory, process orders, view analytics, receive real-time order alerts |
| **Driver** | `/driver` | Accept deliveries, broadcast live location, complete deliveries with OTP verification |
| **Admin** | `/admin` | Full platform oversight — manage users, drivers, pharmacies, medicines, and orders |

---

## 📡 API Reference

| Endpoint Group | Base Path | Description |
|---|---|---|
| **Authentication** | `/api/auth` | Register, login, Google OAuth, token refresh |
| **Medicines** | `/api/medicines` | CRUD operations, search, filter by category |
| **Orders** | `/api/orders` | Place orders, update status, fetch order history |
| **Delivery** | `/api/delivery` | Driver assignment, location updates, OTP verification |
| **Payment** | `/api/payment` | SSLCommerz payment initiation, success/fail callbacks |
| **Pharmacies** | `/api/pharmacies` | Pharmacy registration and management |
| **Users** | `/api/users` | Profile management, role updates |
| **Dashboard** | `/api/dashboard` | Analytics data for owner/admin dashboards |
| **Admin** | `/api/admin` | User/driver approval, platform-wide management |
| **Images** | `/api/images` | Medicine image upload and serving |

### WebSocket Events

| Event | Direction | Description |
|---|---|---|
| `join_room` | Client → Server | Join order tracking room |
| `driver_location_update` | Driver → Server | Broadcast GPS coordinates |
| `location_changed` | Server → Client | Live driver location to all watchers |
| `order:statusChanged` | Server → Client | Order status transition notification |
| `pharmacy:joinDashboard` | Owner → Server | Join pharmacy dashboard for real-time alerts |

---

## 📁 Project Structure

```
Medicare/
├── Backend/
│   ├── config/              # Environment and app configuration
│   ├── middleware/           # Auth, error handling, privacy middleware
│   ├── routes/              # Express route handlers
│   │   ├── authRoutes.ts        # Authentication & registration
│   │   ├── medicineRoutes.ts    # Medicine CRUD & search
│   │   ├── orderRoutes.ts       # Order lifecycle management
│   │   ├── deliveryRoutes.ts    # Driver assignment & tracking
│   │   ├── paymentRoutes.ts     # SSLCommerz integration
│   │   ├── pharmacyRoutes.ts    # Pharmacy management
│   │   ├── userRoutes.ts        # User profile operations
│   │   ├── dashboardRoutes.ts   # Analytics & reporting
│   │   ├── adminRoutes.ts       # Admin panel endpoints
│   │   └── imageRoutes.ts       # Image upload & serving
│   ├── cache/images/        # Cached medicine images
│   ├── data/                # Seed data & import files
│   ├── scripts/             # Database utilities & import scripts
│   ├── models.ts            # Mongoose schemas (User, Pharmacy, Medicine, Order)
│   ├── db.ts                # MongoDB connection
│   ├── index.ts             # Express server + Socket.IO setup
│   └── seed.ts              # Database seeding script
│
├── Frontend/
│   ├── public/images/       # Static medicine images
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # Radix-based UI primitives (shadcn/ui)
│   │   │   ├── layout/          # Header, RootLayout, RequireAuth, RequireRole
│   │   │   ├── dashboard/       # Dashboard layout components
│   │   │   ├── driver/          # Driver registration form
│   │   │   ├── LiveOrderMap.tsx  # Leaflet real-time tracking map
│   │   │   ├── MedicineCard.tsx  # Product card component
│   │   │   ├── OrderTimeline.tsx # Visual order progress tracker
│   │   │   └── EditProfileDialog.tsx
│   │   ├── pages/
│   │   │   ├── HomePage.tsx          # Landing page with hero & categories
│   │   │   ├── MedicinesPage.tsx     # Medicine catalog with search/filter
│   │   │   ├── MedicineDetailPage.tsx # Single medicine view
│   │   │   ├── CartPage.tsx          # Shopping cart
│   │   │   ├── CheckoutPage.tsx      # Checkout with map picker
│   │   │   ├── OrderTrackingPage.tsx # Live delivery tracking
│   │   │   ├── LoginPage.tsx         # Multi-panel auth page
│   │   │   ├── owner/               # Pharmacy owner dashboard pages
│   │   │   ├── driver/              # Driver dashboard
│   │   │   ├── admin/               # Admin panel pages
│   │   │   └── payment/             # Payment success/fail pages
│   │   ├── store/
│   │   │   └── useAppStore.ts   # Zustand global state
│   │   ├── hooks/               # Custom React hooks
│   │   ├── lib/                 # API client, types, utilities
│   │   └── App.tsx              # Root component with routing
│   ├── tailwind.config.ts   # Custom design system
│   └── vite.config.ts       # Vite configuration
│
└── README.md
```

---

## 🔐 Environment Variables

### Backend (`Backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: `5001`) |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret key for JWT token signing |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID |
| `SSLCOMMERZ_STORE_ID` | No | SSLCommerz store identifier |
| `SSLCOMMERZ_STORE_PASSWORD` | No | SSLCommerz store password |
| `CLIENT_URL` | No | Frontend URL for CORS & callbacks |

### Frontend (`Frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Backend API base URL |
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID |

---

## 🧪 Testing

```bash
cd Frontend
npm test          # Run tests once
npm run test:watch  # Run tests in watch mode
```

---

## 📜 License

This project is licensed under the [ISC License](https://opensource.org/licenses/ISC).

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/adnan-jahangir">Adnan Jahangir</a>
</p>