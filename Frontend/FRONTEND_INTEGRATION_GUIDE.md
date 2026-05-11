# Frontend Integration Guide

## Quick Start - Connecting Frontend to Backend

This guide shows you how to integrate your React frontend with the new backend API.

---

## 1. Update API Configuration

Update `src/lib/api.ts` to handle different environments:

```typescript
import axios, { AxiosInstance } from "axios";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5001/api";

// Create axios instance with base configuration
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - add JWT token to headers
api.interceptors.request.use(
  (config) => {
    try {
      const persistedState = localStorage.getItem("app-storage");
      if (persistedState) {
        const { state } = JSON.parse(persistedState);
        if (state.token) {
          config.headers.Authorization = `Bearer ${state.token}`;
        }
      }
    } catch (e) {
      console.error("Could not get token from local storage", e);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      localStorage.removeItem("app-storage");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
```

---

## 2. Update Zustand Store

Update `src/store/useAppStore.ts` to fetch from backend:

```typescript
import api from "@/lib/api";

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ... existing state

      // Auth methods
      register: async (
        name: string,
        email: string,
        password: string,
        role: "customer" | "owner" = "customer",
      ) => {
        try {
          const response = await api.post("/auth/register", {
            name,
            email,
            password,
            role,
          });
          const { data } = response.data;
          set({ user: data, token: data.token, role: data.role });
          return true;
        } catch (error: any) {
          console.error("Registration failed:", error.response?.data?.message);
          return false;
        }
      },

      login: async (email: string, password: string) => {
        try {
          const response = await api.post("/auth/login", { email, password });
          const { data } = response.data;
          set({ user: data, token: data.token, role: data.role });
          return true;
        } catch (error: any) {
          console.error("Login failed:", error.response?.data?.message);
          return false;
        }
      },

      verifyAuth: async () => {
        try {
          const response = await api.get("/auth/verify");
          const { data } = response.data;
          set({ user: data });
          return true;
        } catch (error) {
          set({ user: null, token: null, role: "customer" });
          return false;
        }
      },

      // Medicine methods
      fetchMedicines: async (filters?: any) => {
        try {
          const response = await api.get("/medicines", { params: filters });
          set({ medicines: response.data.data });
          return true;
        } catch (error: any) {
          console.error(
            "Failed to fetch medicines:",
            error.response?.data?.message,
          );
          return false;
        }
      },

      searchMedicines: async (query: string, filters?: any) => {
        try {
          const response = await api.get("/medicines", {
            params: { search: query, ...filters },
          });
          set({ medicines: response.data.data });
          return true;
        } catch (error: any) {
          console.error("Search failed:", error.response?.data?.message);
          return false;
        }
      },

      // Order methods
      createOrder: async (
        pharmacyId: string,
        items: { medicine: string; quantity: number }[],
        total: number,
        destination: { lat: number; lng: number },
      ) => {
        try {
          const response = await api.post("/orders", {
            pharmacyId,
            items,
            total,
            destination,
          });
          const newOrder = response.data.data;
          set((state) => ({ orders: [newOrder, ...state.orders] }));
          set((state) => ({ cart: [] })); // Clear cart
          return newOrder;
        } catch (error: any) {
          console.error(
            "Order creation failed:",
            error.response?.data?.message,
          );
          return null;
        }
      },

      fetchOrders: async () => {
        try {
          const response = await api.get("/orders");
          set({ orders: response.data.data });
          return true;
        } catch (error: any) {
          console.error(
            "Failed to fetch orders:",
            error.response?.data?.message,
          );
          return false;
        }
      },

      fetchOrder: async (orderId: string) => {
        try {
          const response = await api.get(`/orders/${orderId}`);
          return response.data.data;
        } catch (error: any) {
          console.error(
            "Failed to fetch order:",
            error.response?.data?.message,
          );
          return null;
        }
      },

      // Pharmacy methods
      fetchPharmacies: async (filters?: any) => {
        try {
          const response = await api.get("/pharmacies", { params: filters });
          set({ pharmacies: response.data.data });
          return true;
        } catch (error: any) {
          console.error(
            "Failed to fetch pharmacies:",
            error.response?.data?.message,
          );
          return false;
        }
      },

      // User methods
      updateProfile: async (updates: any) => {
        try {
          const response = await api.patch("/users/profile", updates);
          const updatedUser = response.data.data;
          set({ user: updatedUser });
          return true;
        } catch (error: any) {
          console.error(
            "Profile update failed:",
            error.response?.data?.message,
          );
          return false;
        }
      },

      changePassword: async (
        currentPassword: string,
        newPassword: string,
        confirmPassword: string,
      ) => {
        try {
          await api.patch("/users/change-password", {
            currentPassword,
            newPassword,
            confirmPassword,
          });
          return true;
        } catch (error: any) {
          console.error(
            "Password change failed:",
            error.response?.data?.message,
          );
          return false;
        }
      },

      // Dashboard methods
      fetchDashboardData: async () => {
        try {
          const user = get().user;
          if (!user) return false;

          let endpoint = "";
          if (user.role === "admin") {
            endpoint = "/dashboard/admin";
          } else if (user.role === "owner") {
            endpoint = "/dashboard/owner";
          } else if (user.role === "customer") {
            endpoint = "/dashboard/customer";
          }

          if (endpoint) {
            const response = await api.get(endpoint);
            // Store dashboard data in state as needed
            return response.data.data;
          }
          return false;
        } catch (error: any) {
          console.error(
            "Failed to fetch dashboard data:",
            error.response?.data?.message,
          );
          return false;
        }
      },
    }),
    {
      name: "app-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        role: state.role,
        cart: state.cart,
        wishlist: state.wishlist,
      }),
    },
  ),
);
```

---

## 3. Example: Update LoginPage

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        toast.error('Invalid email or password');
      }
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
}
```

---

## 4. Example: Fetch & Display Medicines

```typescript
import { useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { MedicineCard } from '@/components/MedicineCard';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MedicinesPage() {
  const { medicines, fetchMedicines, searchMedicines } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const loadMedicines = async () => {
      setIsLoading(true);
      const filters = selectedCategory ? { category: selectedCategory } : {};
      await fetchMedicines(filters);
      setIsLoading(false);
    };
    loadMedicines();
  }, [selectedCategory, fetchMedicines]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setIsLoading(true);
    const filters = selectedCategory ? { category: selectedCategory } : {};
    await searchMedicines(query, filters);
    setIsLoading(false);
  };

  return (
    <div className="container py-10">
      <h1 className="font-bold text-3xl mb-8">Medicines</h1>

      <div className="flex gap-4 mb-8">
        <Input
          placeholder="Search medicines..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="flex-1"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="Pain Relief">Pain Relief</SelectItem>
            <SelectItem value="Antibiotics">Antibiotics</SelectItem>
            <SelectItem value="Vitamins">Vitamins</SelectItem>
            {/* More categories */}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-10">Loading...</div>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {medicines.map((medicine) => (
            <MedicineCard key={medicine.id} medicine={medicine} />
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 5. Example: Place Order

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const { cart, medicines, createOrder, user } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const items = cart.map((c) => ({
    medicine: c.medicineId,
    quantity: c.quantity
  }));

  const subtotal = cart.reduce((sum, item) => {
    const medicine = medicines.find((m) => m.id === item.medicineId);
    return sum + (medicine?.price || 0) * item.quantity;
  }, 0);

  const total = subtotal + (subtotal >= 25 ? 0 : 3.99) + subtotal * 0.08;

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const order = await createOrder(
        'pharmacy_id', // Get from context or params
        items,
        total,
        { lat: 40.7128, lng: -74.0060 } // Get from user location
      );

      if (order) {
        toast.success('Order placed successfully!');
        navigate(`/orders/${order._id}`);
      } else {
        toast.error('Failed to place order');
      }
    } catch (error: any) {
      toast.error(error.message || 'Checkout failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="font-bold text-3xl mb-8">Checkout</h1>

      <div className="mb-6 p-4 border rounded">
        <p>Subtotal: ${subtotal.toFixed(2)}</p>
        <p>Shipping: ${subtotal >= 25 ? 0 : 3.99}</p>
        <p>Tax: ${(subtotal * 0.08).toFixed(2)}</p>
        <h3 className="font-bold text-lg">Total: ${total.toFixed(2)}</h3>
      </div>

      <Button
        onClick={handleCheckout}
        disabled={isLoading || items.length === 0}
        className="w-full"
      >
        {isLoading ? 'Processing...' : 'Place Order'}
      </Button>
    </div>
  );
}
```

---

## 6. Add Environment Variables

Create `.env.local` in your React project root:

```env
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_key
```

---

## 7. Handle Authentication on App Load

Update `src/main.tsx` or `src/App.tsx`:

```typescript
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

function App() {
  const { verifyAuth, token } = useAppStore();

  useEffect(() => {
    // Verify token on app load
    if (token) {
      verifyAuth();
    }
  }, [token, verifyAuth]);

  return (
    // ... rest of your app
  );
}
```

---

## 8. Error Handling Best Practices

```typescript
// Create a hook for API calls with error handling
import { useState } from "react";
import { AxiosError } from "axios";

export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = async (fn: () => Promise<any>) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { call, isLoading, error };
};

// Usage:
const { call, isLoading, error } = useApi();

const handleSubmit = async () => {
  await call(() => api.post("/orders", orderData));
  if (error) {
    toast.error(error);
  }
};
```

---

## 9. TypeScript Types for API Responses

Create `src/lib/api-types.ts`:

```typescript
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "owner" | "admin" | "driver";
  token: string;
  shopCode?: string;
  shopName?: string;
}
```

---

## 10. Testing API Integration

```typescript
// src/test/api.test.ts
import api from "@/lib/api";

describe("API Integration", () => {
  it("should login successfully", async () => {
    const response = await api.post("/auth/login", {
      email: "test@example.com",
      password: "password123",
    });

    expect(response.data.success).toBe(true);
    expect(response.data.data.token).toBeDefined();
  });

  it("should fetch medicines", async () => {
    const response = await api.get("/medicines");
    expect(response.data.success).toBe(true);
    expect(Array.isArray(response.data.data)).toBe(true);
  });

  it("should create order", async () => {
    const response = await api.post("/orders", {
      pharmacyId: "pharmacy_id",
      items: [{ medicine: "med_id", quantity: 2 }],
      total: 29.98,
      destination: { lat: 40.7128, lng: -74.006 },
    });

    expect(response.data.success).toBe(true);
    expect(response.data.data._id).toBeDefined();
  });
});
```

---

## Common Issues & Solutions

### 1. **CORS Error**

**Problem**: `Access to XMLHttpRequest blocked by CORS policy`

**Solution**: CORS is already configured in backend. If issue persists, verify:

```typescript
// server/index.ts
const corsOptions = {
  origin: "http://localhost:8080", // Your frontend URL
  credentials: true,
};
app.use(cors(corsOptions));
```

### 2. **Token Not Sent**

**Problem**: API calls are unauthorized even with valid token

**Solution**: Verify token is in localStorage:

```typescript
localStorage.setItem('app-storage', JSON.stringify({
  state: { token: 'your_token_here', ... },
  version: 0
}));
```

### 3. **404 Routes**

**Problem**: Routes returning 404

**Solution**: Ensure backend routes are registered in `server/index.ts`:

```typescript
app.use("/api/orders", orderRoutes);
app.use("/api/medicines", medicineRoutes);
// etc.
```

---

This should get your frontend fully integrated with the new backend API! Let me know if you need any clarification.
