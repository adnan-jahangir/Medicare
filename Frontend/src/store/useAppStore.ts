import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SAMPLE_PICKUP, SAMPLE_DEST } from '@/lib/seed';
import type { CartItem, Medicine, Order, OrderStatus, Pharmacy, Role, User } from '@/lib/types';
import { ORDER_STAGES } from '@/lib/types';

import api from '@/lib/api';

interface AppState {
  user: User | null;
  token: string | null;
  role: Role;
  medicines: Medicine[];
  pharmacies: Pharmacy[];
  orders: Order[];
  cart: CartItem[];
  wishlist: string[];
  googleMapsKey: string;

  setRole: (r: Role) => void;
  setAuth: (user: User, token: string) => void;
  updateUser: (updatedData: Partial<User>) => void;
  logout: () => void;
  setGoogleMapsKey: (t: string) => void;

  // medicines
  setMedicines: (medicines: Medicine[]) => void;
  upsertMedicine: (m: Medicine) => void;
  deleteMedicine: (id: string) => void;

  // cart
  addToCart: (id: string, qty?: number) => void;
  updateCartQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;

  // wishlist
  toggleWishlist: (id: string) => void;

  // orders
  placeOrder: (customerName: string, customerEmail: string) => Order | null;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  advanceDriver: (id: string, progress: number) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      role: 'customer',
      medicines: [],
      pharmacies: [],
      orders: [],
      cart: [],
      wishlist: [],
      googleMapsKey: '',

      setRole: (role) => set({ role }),
      setAuth: (user, token) => set({ user: user || null, token: token || null, role: user?.role || 'customer' }),
      updateUser: (updatedData) => set((s) => ({ user: s.user ? { ...s.user, ...updatedData } : null })),
      logout: () => set({ user: null, token: null, role: 'customer' }),
      setGoogleMapsKey: (googleMapsKey) => set({ googleMapsKey }),

      setMedicines: (medicines) => set({ medicines }),
      upsertMedicine: (m) =>
        set((s) => {
          const exists = s.medicines.some((x) => x.id === m.id);
          return {
            medicines: exists ? s.medicines.map((x) => (x.id === m.id ? m : x)) : [m, ...s.medicines],
          };
        }),
      deleteMedicine: (id) => set((s) => ({ medicines: s.medicines.filter((m) => m.id !== id) })),

      addToCart: (id, qty = 1) =>
        set((s) => {
          const existing = s.cart.find((c) => c.medicineId === id);
          if (existing) {
            return { cart: s.cart.map((c) => (c.medicineId === id ? { ...c, quantity: c.quantity + qty } : c)) };
          }
          return { cart: [...s.cart, { medicineId: id, quantity: qty }] };
        }),
      updateCartQty: (id, qty) =>
        set((s) => ({
          cart: qty <= 0 ? s.cart.filter((c) => c.medicineId !== id) : s.cart.map((c) => (c.medicineId === id ? { ...c, quantity: qty } : c)),
        })),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((c) => c.medicineId !== id) })),
      clearCart: () => set({ cart: [] }),

      toggleWishlist: (id) =>
        set((s) => ({ wishlist: s.wishlist.includes(id) ? s.wishlist.filter((x) => x !== id) : [...s.wishlist, id] })),

      placeOrder: (customerName, customerEmail) => {
        const { cart, medicines } = get();
        if (cart.length === 0) return null;
        const items = cart.map((c) => ({ medicine: medicines.find((m) => m.id === c.medicineId)!, quantity: c.quantity })).filter(i => i.medicine);
        const total = items.reduce((sum, it) => sum + it.medicine.price * it.quantity, 0);
        const order: Order = {
          id: 'ORD-' + (1000 + Math.floor(Math.random() * 9000)),
          customerName,
          customerEmail,
          pharmacyId: items[0].medicine.pharmacyId,
          items,
          total,
          status: 'Pending',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          pickup: SAMPLE_PICKUP,
          destination: SAMPLE_DEST,
          driverProgress: 0,
        };
        set((s) => ({ orders: [order, ...s.orders], cart: [] }));
        return order;
      },

      updateOrderStatus: (id, status) =>
        set((s) => ({
          orders: s.orders.map((o) => {
            if (o.id !== id) return o;
            const stageIndex = ORDER_STAGES.indexOf(status);
            const progress = stageIndex >= 3 ? (status === 'Delivered' ? 1 : 0.6) : Math.max(o.driverProgress, stageIndex * 0.15);
            return { ...o, status, updatedAt: Date.now(), driverProgress: progress };
          }),
        })),

      advanceDriver: (id, progress) =>
        set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, driverProgress: progress } : o)) })),
    }),
    {
      name: 'medicare-store',
      partialize: (s) => ({ cart: s.cart, wishlist: s.wishlist, googleMapsKey: s.googleMapsKey, user: s.user, role: s.role, token: s.token }),
    },
  ),
);
