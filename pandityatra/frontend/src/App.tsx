import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { FavoritesProvider } from './hooks/useFavorites';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/Home';
import AboutUs from './pages/AboutUs';
import PujaCategoriesPage from './pages/Shop/PujaCategories';
import Samagri from './pages/Shop/Samagri';
import Books from './pages/Shop/Books';
import OpenCartRedirect from './pages/Shop/OpenCartRedirect';
import CartDrawer from './components/shop/CartDrawer';
import FavoritesDrawer from './components/shop/FavoritesDrawer';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import LoginOTPVerification from './pages/auth/otp-verification/LoginOTPVerification';
import ForgotPassword from './pages/auth/forgot-password/ForgotPassword';
import ChangePassword from './pages/auth/change-password/ChangePassword';
import PanditProfile from './pages/Booking/PanditProfile';
import { PanditList } from './pages/Booking/PanditList';
import CustomerDashboard from './pages/Dashboard/CustomerDashboard';
import PanditDashboard from './pages/Dashboard/PanditDashboard';
import MyBookings from "./pages/MyBookings";
import PanditRecommendations from "./pages/PanditRecommendations";

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <NavbarWrapper />
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/shop/pujas" element={<PujaCategoriesPage />} />
                <Route path="/shop/samagri" element={<Samagri />} />
                <Route path="/shop/books" element={<Books />} />
                <Route path="/cart" element={<OpenCartRedirect />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Login OTP Verification */}
                <Route
                  path="/login/otp-verification"
                  element={<LoginOTPVerification />}
                />

                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route path="/my-bookings" element={<MyBookings />} />
                <Route path="/recommendations" element={<PanditRecommendations />} />

                {/* Booking Routes */}
                <Route path="/booking" element={<PanditList />} />
                <Route path="/pandits/:id" element={<PanditProfile />} />

                {/* Protected Dashboard Routes */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/pandit/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['pandit']}>
                      <PanditDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

              {/* Drawers & Toasts */}
              <CartDrawer />
              <FavoritesDrawer />
              <Toaster />
            </ErrorBoundary>
          </BrowserRouter>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}

// Helper to conditionally render navbar if needed, or just include it in routes or layout.
// Since original App.tsx had Navbar inside specific pages or layouts (Home has it, About has it, Shop has it), 
// but here we want it globally or handled by pages.
// Looking at Home.tsx, it includes <Navbar />. 
// Looking at PujaCategories.tsx, it includes <Navbar />.
// So we don't need a global Navbar here, UNLESS specific pages are missing it.
// I will not add global Navbar to avoid duplication, assuming pages handle it. 
// However, the user asked for "favourite button also in nav bar".
// I need, therefore, to update the Navbar COMPONENT.

// Note: I removed Navbar from global scope here because pages like Home render it themselves.

const NavbarWrapper = () => null; // Placeholder if we need global later, otherwise empty.

export default App;
