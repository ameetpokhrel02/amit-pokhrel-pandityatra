import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './hooks/useCart'
import { FavoritesProvider } from './hooks/useFavorites'
import { ChatProvider } from './contexts/ChatContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Public Pages
import HomePage from './pages/Home'
import AboutUs from './pages/AboutUs'
import Contact from './pages/Contact'
import OfflineKundali from './pages/Kundali/OfflineKundali'
import PanchangCalendar from './pages/Calendar/PanchangCalendar'

// Shop
import PujaCategories from './pages/Shop/PujaCategories'
import Samagri from './pages/Shop/Samagri'
import Books from './pages/Shop/Books'
import CartPage from './pages/Shop/Cart'
import CheckoutPage from './pages/Shop/Checkout'
import ShopPaymentSuccess from './pages/Shop/ShopPaymentSuccess'
import ShopPaymentFailure from './pages/Shop/ShopPaymentFailure'
import ShopEsewaVerify from './pages/Shop/ShopEsewaVerify'

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
import CustomerMessages from './pages/customer/CustomerMessages'
import PanditDashboard from './pages/pandit/PanditDashboard'
import PanditEarnings from './pages/pandit/PanditEarnings'
import PanditServices from './pages/pandit/PanditServices' // 
import PanditBookings from './pages/pandit/PanditBookings'
import PanditMessages from './pages/pandit/PanditMessages'
import PanditPrivateProfile from './pages/pandit/PanditProfile'
import PanditCalendarPage from './pages/pandit/PanditCalendarPage'
import PanditReviews from './pages/pandit/PanditReviews'
import PanditAppFeedback from './pages/pandit/PanditAppFeedback'

import AdminDashboard from './pages/admin/AdminDashboard'
import AdminPandits from './pages/admin/AdminPandits'
import AdminBookings from './pages/admin/AdminBookings'
import AdminUsers from './pages/admin/AdminUsers'
import AdminPayments from './pages/admin/AdminPayments'
import AdminPayouts from './pages/admin/AdminPayouts'
import AdminSettings from './pages/admin/AdminSettings'
import AdminSamagri from './pages/admin/AdminSamagri'
import AdminServices from './pages/admin/AdminServices'
import AdminActivityLogs from './pages/admin/AdminActivityLogs'
import AdminReviews from './pages/admin/AdminReviews'
import AdminPanditsList from './pages/admin/AdminPanditsList'
import AdminProfile from './pages/admin/AdminProfile'
import AdminSiteContent from './pages/admin/AdminSiteContent'
import AdminBanners from '@/pages/admin/AdminBanners'
import AdminSupport from './pages/admin/AdminSupport'
import AdminErrorLogs from './pages/admin/AdminErrorLogs'
import ManageAdmins from './pages/admin/ManageAdmins'

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
import EsewaVerify from './pages/Payment/EsewaVerify'

// Video
import PujaRoom from './pages/Video/PujaRoom'
import RecordingView from './pages/Video/RecordingView'

// Global UI
import CartDrawer from './components/shop/CartDrawer'
import FavoritesDrawer from './components/shop/FavoritesDrawer'
import UnifiedChatWidget from './components/UnifiedChatWidget'
import BackToTop from './components/common/BackToTop'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'
import BottomNavigation from './components/layout/BottomNavigation'

// Error Handling
import { ThemeProvider } from './components/theme/ThemeProvider'
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
          <ChatProvider>
          <AuthProvider>
        <FavoritesProvider>
            <ThemeProvider defaultTheme="system" storageKey="pandityatra-theme">
              <ErrorBoundary>
                <Offline />
                <BrowserRouter>
                  <Routes>
                    {/* 🌍 Public */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/about" element={<AboutUs />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/kundali" element={<OfflineKundali />} />
                    <Route path="/calendar" element={<PanchangCalendar />} />
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
                    <Route path="/shop/payment/esewa/verify" element={<ShopEsewaVerify />} />
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

                    <Route path="/messages" element={
                      <ProtectedRoute allowedRoles={['user']}>
                        <CustomerMessages />
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

                    <Route path="/pandit/calendar" element={
                      <ProtectedRoute allowedRoles={['pandit']}>
                        <PanditCalendarPage />
                      </ProtectedRoute>
                    } />

                    <Route path="/pandit/messages" element={
                      <ProtectedRoute allowedRoles={['pandit']}>
                        <PanditMessages />
                      </ProtectedRoute>
                    } />

                    <Route path="/pandit/reviews" element={
                      <ProtectedRoute allowedRoles={['pandit']}>
                        <PanditReviews />
                      </ProtectedRoute>
                    } />

                    <Route path="/pandit/app-feedback" element={
                      <ProtectedRoute allowedRoles={['pandit']}>
                        <PanditAppFeedback />
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

                    <Route path="/admin/pandits-list" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminPanditsList />
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

                    <Route path="/admin/activity-logs" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminActivityLogs />
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/reviews" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminReviews />
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/profile" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminProfile />
                      </ProtectedRoute>
                    } />

                    <Route path="/admin/site-content" element={<ProtectedRoute allowedRoles={['admin']}><AdminSiteContent /></ProtectedRoute>} />
                    <Route path="/admin/banners" element={<ProtectedRoute allowedRoles={['admin']}><AdminBanners /></ProtectedRoute>} />
                    <Route path="/admin/support" element={<ProtectedRoute allowedRoles={['admin']}><AdminSupport /></ProtectedRoute>} />
                    <Route path="/admin/manage-admins" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><ManageAdmins /></ProtectedRoute>} />

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
                    <Route path="/payment/esewa/verify" element={<EsewaVerify />} />

                    {/* 🎥 Video */}
                    <Route path="/puja-room/:id" element={
                      <ProtectedRoute allowedRoles={['user', 'pandit', 'admin']}>
                        <PujaRoom />
                      </ProtectedRoute>
                    } />
                    <Route path="/video/:id" element={
                      <ProtectedRoute allowedRoles={['user', 'pandit', 'admin']}>
                        <PujaRoom />
                      </ProtectedRoute>
                    } />
                    <Route path="/video/room/:id" element={
                      <ProtectedRoute allowedRoles={['user', 'pandit', 'admin']}>
                        <PujaRoom />
                      </ProtectedRoute>
                    } />
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
                  <div className="h-20 md:hidden" /> {/* Spacer for BottomNavigation */}

                  <CartDrawer />
                  <FavoritesDrawer />
                  <BackToTop />
                  <UnifiedChatWidget />
                  <PWAInstallPrompt />
                  <BottomNavigation />
                  <Toaster />
                </BrowserRouter>
              </ErrorBoundary>
            </ThemeProvider>
        </FavoritesProvider>
          </AuthProvider>
          </ChatProvider>
      </CartProvider>
    </GoogleOAuthProvider>
  )
}

export default App
