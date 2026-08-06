<h1 align="center">💊 MediCare</h1>



<p align="center">

  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=for-the-badge&logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
</p>


<p align="center">
  <strong>A full-stack pharmacy delivery platform with real-time GPS tracking, multi-role dashboards, and integrated payment processing.</strong>
</p>


---

## 🔗 Live Demo

Experience the live application here:  
👉 <a href="https://medicare-pharma.vercel.app/" target="_blank"><strong>🌐 Live Demo</strong></a> 

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

