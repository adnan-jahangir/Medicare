import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { RootLayout } from "@/components/layout/RootLayout";
import HomePage from "./pages/HomePage";
import MedicinesPage from "./pages/MedicinesPage";
import MedicineDetailPage from "./pages/MedicineDetailPage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import OrdersPage from "./pages/OrdersPage";
import OrderTrackingPage from "./pages/OrderTrackingPage";
import LoginPage from "./pages/LoginPage";
import PrescriptionPage from "./pages/PrescriptionPage";
import WishlistPage from "./pages/WishlistPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage.tsx";
import RequireAuth from "@/components/layout/RequireAuth";
import RequireRole from "@/components/layout/RequireRole";

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerMedicines from "./pages/owner/OwnerMedicines";
import OwnerOrders from "./pages/owner/OwnerOrders";

import AdminOverview, { AdminUsers, AdminPharmacies, AdminMedicines, AdminOrders } from "./pages/admin/AdminPages";

import NotFound from "./pages/NotFound.tsx";
import UpdateProfilePage from "./pages/UpdateProfilePage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route path="/dashboard" element={<RequireAuth><CustomerDashboardPage /></RequireAuth>} />
            <Route path="/" element={<HomePage />} />
            <Route path="/medicines" element={<MedicinesPage />} />
            <Route path="/medicines/:id" element={<MedicineDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<RequireRole role="customer"><CheckoutPage /></RequireRole>} />
            <Route path="/orders" element={<RequireAuth><OrdersPage /></RequireAuth>} />
            <Route path="/orders/:id" element={<RequireAuth><OrderTrackingPage /></RequireAuth>} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/prescription" element={<RequireAuth><PrescriptionPage /></RequireAuth>} />
            <Route path="/update-profile" element={<RequireAuth><UpdateProfilePage /></RequireAuth>} />

            <Route path="/owner" element={<OwnerDashboard />} />
            <Route path="/owner/medicines" element={<OwnerMedicines />} />
            <Route path="/owner/orders" element={<OwnerOrders />} />

            <Route path="/admin" element={<AdminOverview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/pharmacies" element={<AdminPharmacies />} />
            <Route path="/admin/medicines" element={<AdminMedicines />} />
            <Route path="/admin/orders" element={<AdminOrders />} />
          </Route>

          <Route path="/login" element={<LoginPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
