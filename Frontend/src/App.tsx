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
import PaymentSuccess from "./pages/payment/PaymentSuccess";
import PaymentFail from "./pages/payment/PaymentFail";
import LoginPage from "./pages/LoginPage";
import PrescriptionPage from "./pages/PrescriptionPage";
import WishlistPage from "./pages/WishlistPage";
import CustomerDashboardPage from "./pages/CustomerDashboardPage.tsx";
import RequireAuth from "@/components/layout/RequireAuth";
import RequireRole from "@/components/layout/RequireRole";

import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerMedicines from "./pages/owner/OwnerMedicines";
import OwnerOrders from "./pages/owner/OwnerOrders";

import DriverDashboard from "./pages/driver/DriverDashboard";

import AdminOverview, { AdminUsers, AdminDrivers, AdminPharmacies, AdminMedicines, AdminOrders } from "./pages/admin/AdminPages";

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
            <Route path="/payment/success" element={<RequireAuth><PaymentSuccess /></RequireAuth>} />
            <Route path="/payment/fail" element={<RequireAuth><PaymentFail /></RequireAuth>} />
            <Route path="/wishlist" element={<WishlistPage />} />
            <Route path="/prescription" element={<RequireAuth><PrescriptionPage /></RequireAuth>} />
            <Route path="/update-profile" element={<RequireAuth><UpdateProfilePage /></RequireAuth>} />

            <Route path="/owner" element={<RequireRole role={["owner", "pharmacy", "vendor", "shop_owner"]}><OwnerDashboard /></RequireRole>} />
            <Route path="/owner/medicines" element={<RequireRole role={["owner", "pharmacy", "vendor", "shop_owner"]}><OwnerMedicines /></RequireRole>} />
            <Route path="/owner/orders" element={<RequireRole role={["owner", "pharmacy", "vendor", "shop_owner"]}><OwnerOrders /></RequireRole>} />

            <Route path="/driver" element={<RequireRole role="driver"><DriverDashboard /></RequireRole>} />

            <Route path="/admin" element={<RequireRole role="admin"><AdminOverview /></RequireRole>} />
            <Route path="/admin/users" element={<RequireRole role="admin"><AdminUsers /></RequireRole>} />
            <Route path="/admin/drivers" element={<RequireRole role="admin"><AdminDrivers /></RequireRole>} />
            <Route path="/admin/pharmacies" element={<RequireRole role="admin"><AdminPharmacies /></RequireRole>} />
            <Route path="/admin/medicines" element={<RequireRole role="admin"><AdminMedicines /></RequireRole>} />
            <Route path="/admin/orders" element={<RequireRole role="admin"><AdminOrders /></RequireRole>} />
          </Route>

          <Route path="/login" element={<LoginPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
