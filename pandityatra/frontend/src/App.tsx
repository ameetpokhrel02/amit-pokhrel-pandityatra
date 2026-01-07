
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { CartProvider } from './hooks/useCart';
import { FavoritesProvider } from './hooks/useFavorites';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';

// Pages
import HomePage from './pages/Home';
import PujaCategories from './pages/Shop/PujaCategories';
import Samagri from './pages/Shop/Samagri';
import Books from './pages/Shop/Books';
import CartPage from './pages/Shop/Cart';
import CartDrawer from './components/shop/CartDrawer';
import FavoritesDrawer from './components/shop/FavoritesDrawer';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import LoginOTPVerification from './pages/auth/otp-verification/LoginOTPVerification';
import ForgotPassword from './pages/auth/forgot-password/ForgotPassword';
import OTPVerification from './pages/auth/otp-verification/OTPVerification';
import ChangePassword from './pages/auth/change-password/ChangePassword';
import PanditRegister from './pages/auth/PanditRegister';
import { PanditList } from './pages/Booking/PanditList';
import PanditProfile from './pages/Booking/PanditProfile';
import BookingForm from './pages/Booking/BookingForm';
import MyBookingsPage from './pages/Booking/MyBookings';
import CustomerDashboard from './pages/Dashboard/CustomerDashboard';
import PanditDashboard from './pages/Dashboard/PanditDashboard';
import AdminDashboard from './pages/Dashboard/AdminDashboard';
import AdminVerificationDashboard from './pages/Dashboard/AdminVerification';
import EditProfile from './pages/Dashboard/Profile/EditProfile';
import ChatList from './pages/Chat/ChatList';
import ChatRoom from './pages/Chat/ChatRoom';
import UnifiedChatWidget from './components/UnifiedChatWidget';
import AboutUs from './pages/AboutUs';
import OfflineKundali from './pages/Kundali/OfflineKundali';

// Payment Pages
import PaymentPage from './pages/Payment/PaymentPage';
import PaymentSuccess from './pages/Payment/PaymentSuccess';
import PaymentFailure from './pages/Payment/PaymentFailure';
import KhaltiVerify from './pages/Payment/KhaltiVerify';


function App() {
  return (
    <CartProvider>
      <FavoritesProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/kundali" element={<OfflineKundali />} />
              <Route path="/shop/pujas" element={<PujaCategories />} />
              <Route path="/shop/samagri" element={<Samagri />} />
              <Route path="/shop/books" element={<Books />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/pandit/register" element={<PanditRegister />} />

              {/* Login OTP Verification */}
              <Route path="/otp-verification" element={<LoginOTPVerification />} />

              {/* Forgot Password Flow */}
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/otp-verification" element={<OTPVerification />} />
              <Route path="/auth/change-password" element={<ChangePassword />} />

              {/* Protected Routes */}
              <Route
                path="/booking"
                element={
                  <ProtectedRoute allowedRoles={['user', 'pandit']}>
                    <BookingForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute allowedRoles={['user', 'pandit']}>
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />
              
              {/* Payment Routes */}
              <Route
                path="/payment/:bookingId"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={<PaymentFailure />} />
              <Route path="/payment/khalti/verify" element={<KhaltiVerify />} />
              
              {/* Pandit List (Public) */}
              <Route
                path="/pandits"
                element={
                  <PanditList />
                }
              />
              {/* Public pandit profile */}
              <Route path="/pandits/:id" element={<PanditProfile />} />
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
              <Route
                path="/pandit/profile"
                element={
                  <ProtectedRoute allowedRoles={['pandit']}>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/profile"
                element={
                  <ProtectedRoute allowedRoles={['user']}>
                    <EditProfile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/verify-pandits"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminVerificationDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Chat Routes */}
              <Route
                path="/chat"
                element={
                  <ProtectedRoute allowedRoles={['user', 'pandit']}>
                    <ChatList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/chat/:roomId"
                element={
                  <ProtectedRoute allowedRoles={['user', 'pandit']}>
                    <ChatRoom roomId={0} />
                  </ProtectedRoute>
                }
              />

              {/* Catch all - redirect to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            {/* Cart Drawer (global) */}
            <CartDrawer />
            {/* Favorites Drawer (global) */}
            <FavoritesDrawer />
            {/* Unified Chat Widget (global) - supports guide mode and interaction mode */}
            <UnifiedChatWidget />
            {/* Toast notifications */}
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </FavoritesProvider>
    </CartProvider>
  );
}

export default App;
