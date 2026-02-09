import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './hooks/useCart'
import { FavoritesProvider } from './hooks/useFavorites'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Public Pages
import HomePage from './pages/Home'
import AboutUs from './pages/AboutUs'
import Contact from './pages/Contact'
import OfflineKundali from './pages/Kundali/OfflineKundali'

// Shop
import PujaCategories from './pages/Shop/PujaCategories'
import Samagri from './pages/Shop/Samagri'
import Books from './pages/Shop/Books'
import CartPage from './pages/Shop/Cart'
import CheckoutPage from './pages/Shop/Checkout'
import ShopPaymentSuccess from './pages/Shop/ShopPaymentSuccess'
import ShopPaymentFailure from './pages/Shop/ShopPaymentFailure'

// Auth
import LoginPage from './pages/auth/Login'
import RegisterPage from './pages/auth/Register'
import PanditRegister from './pages/auth/PanditRegister'
import LoginOTPVerification from './pages/auth/otp-verification/LoginOTPVerification'
import ForgotPassword from './pages/auth/forgot-password/ForgotPassword'
import OTPVerification from './pages/auth/otp-verification/OTPVerification'
import ChangePassword from './pages/auth/change-password/ChangePassword'

// Booking
// Booking
import { PanditList } from './pages/Booking/PanditList'
import PanditProfile from './pages/find-pandit/PanditProfile'
import BookingForm from './pages/Booking/BookingForm'
import Confirmation from './pages/Booking/Confirmation'
import ReviewForm from './pages/Booking/ReviewForm'
import MyBookingsPage from './pages/customer/MyBookings'

// Dashboards (NEW STRUCTURE)
import CustomerDashboard from './pages/customer/CustomerDashboard'
import PanditDashboard from './pages/pandit/PanditDashboard'
import PanditEarnings from './pages/pandit/PanditEarnings'
import PanditServices from './pages/pandit/PanditServices' // 🆕
import PanditBookings from './pages/pandit/PanditBookings'
import PanditPrivateProfile from './pages/pandit/PanditProfile'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPandits from './pages/admin/AdminPandits'
import AdminBookings from './pages/admin/AdminBookings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPayments from './pages/admin/AdminPayments'
import AdminPayouts from './pages/admin/AdminPayouts'
import AdminSettings from './pages/admin/AdminSettings'
import AdminSamagri from './pages/admin/AdminSamagri'
import AdminServices from './pages/admin/AdminServices'

// Profile
import EditProfile from './pages/customer/Profile'

// Chat
import ChatList from './pages/Chat/ChatList'
import ChatRoom from './pages/Chat/ChatRoom'

// Payment
import PaymentPage from './pages/Payment/PaymentPage'
import PaymentSuccess from './pages/Payment/PaymentSuccess'
import PaymentFailure from './pages/Payment/PaymentFailure'
import KhaltiVerify from './pages/Payment/KhaltiVerify'

// Video
import PujaRoom from './pages/Video/PujaRoom'
import RecordingView from './pages/Video/RecordingView'

// Global UI
import CartDrawer from './components/shop/CartDrawer'
import FavoritesDrawer from './components/shop/FavoritesDrawer'
import UnifiedChatWidget from './components/UnifiedChatWidget'
import BackToTop from './components/common/BackToTop'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'

// Error Handling
import ErrorBoundary from './components/ErrorBoundary'
import NotFound from './pages/Error/NotFound'
import ServerError from './pages/Error/ServerError'
import Unauthorized from './pages/Error/Unauthorized'
import Offline from './pages/Error/Offline'

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <CartProvider>
        <FavoritesProvider>
          <AuthProvider>
            <ErrorBoundary>
              <Offline />
              <BrowserRouter>
                <Routes>
                  {/* 🌍 Public */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/kundali" element={<OfflineKundali />} />
                  <Route path="/shop/pujas" element={<PujaCategories />} />
                  <Route path="/shop/samagri" element={<Samagri />} />
                  <Route path="/shop/books" element={<Books />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/shop/checkout" element={
                    <ProtectedRoute allowedRoles={['user', 'pandit', 'admin']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/shop/payment/success" element={<ShopPaymentSuccess />} />
                  <Route path="/shop/payment/cancel" element={<ShopPaymentFailure />} />
                  <Route path="/pandits" element={<PanditList />} />
                  <Route path="/pandits/:id" element={<PanditProfile />} />

                  {/* 🔐 Auth */}
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/pandit/register" element={<PanditRegister />} />
                  <Route path="/otp-verification" element={<LoginOTPVerification />} />
                  <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                  <Route path="/auth/otp-verification" element={<OTPVerification />} />
                  <Route path="/auth/change-password" element={<ChangePassword />} />

                  {/* 👤 Customer */}
                  <Route path="/dashboard" element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <CustomerDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/profile" element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <EditProfile />
                    </ProtectedRoute>
                  } />

                  <Route path="/my-bookings" element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <MyBookingsPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/booking" element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <BookingForm />
                    </ProtectedRoute>
                  } />

                  <Route path="/booking/:serviceId" element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <BookingForm />
                    </ProtectedRoute>
                  } />

                  <Route path="/booking/:id/review" element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <ReviewForm />
                    </ProtectedRoute>
                  } />

                  <Route path="/booking/confirmation" element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <Confirmation />
                    </ProtectedRoute>
                  } />

                  {/* 🧑‍🕉️ Pandit */}
                  <Route path="/pandit/dashboard" element={
                    <ProtectedRoute allowedRoles={['pandit']}>
                      <PanditDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/pandit/earnings" element={
                    <ProtectedRoute allowedRoles={['pandit']}>
                      <PanditEarnings />
                    </ProtectedRoute>
                  } />

                  <Route path="/pandit/services" element={
                    <ProtectedRoute allowedRoles={['pandit']}>
                      <PanditServices />
                    </ProtectedRoute>
                  } />

                  <Route path="/pandit/bookings" element={
                    <ProtectedRoute allowedRoles={['pandit']}>
                      <PanditBookings />
                    </ProtectedRoute>
                  } />

                  <Route path="/pandit/profile" element={
                    <ProtectedRoute allowedRoles={['pandit']}>
                      <PanditPrivateProfile />
                    </ProtectedRoute>
                  } />


                  {/* 👑 Admin */}
                  <Route path="/admin/dashboard" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/pandits" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPandits />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/bookings" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminBookings />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/users" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminUsers />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/payments" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPayments />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/payouts" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminPayouts />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/settings" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSettings />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/inventory" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminSamagri />
                    </ProtectedRoute>
                  } />

                  <Route path="/admin/services" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <AdminServices />
                    </ProtectedRoute>
                  } />

                  {/* 💳 Payments */}
                  <Route path="/payment/:bookingId" element={
                    <ProtectedRoute allowedRoles={['user']}>
                      <PaymentPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/payment/success" element={<PaymentSuccess />} />
                  <Route path="/payment/success/:bookingId" element={<PaymentSuccess />} />
                  <Route path="/payment/cancel" element={<PaymentFailure />} />
                  <Route path="/payment/khalti/verify" element={<KhaltiVerify />} />

                  {/* 🎥 Video */}
                  <Route path="/puja-room/:id" element={<PujaRoom />} />
                  <Route path="/recording/:bookingId" element={<RecordingView />} />

                  {/* 💬 Chat */}
                  <Route path="/chat" element={
                    <ProtectedRoute allowedRoles={['user', 'pandit']}>
                      <ChatList />
                    </ProtectedRoute>
                  } />
                  <Route path="/chat/:roomId" element={
                    <ProtectedRoute allowedRoles={['user', 'pandit']}>
                      <ChatRoom roomId={0} />
                    </ProtectedRoute>
                  } />

                  {/* 🚫 Error Pages */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="/500" element={<ServerError />} />
                  <Route path="/403" element={<Unauthorized />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>

                <CartDrawer />
                <FavoritesDrawer />
                <BackToTop />
                <UnifiedChatWidget />
                <PWAInstallPrompt />
                <Toaster />
              </BrowserRouter>
            </ErrorBoundary>
          </AuthProvider>
        </FavoritesProvider>
      </CartProvider>
    </GoogleOAuthProvider>
  )
}

export default App
