import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoadingSpinner from './components/common/LoadingSpinner'
import { AuthProvider } from '@/hooks/useAuth'
import { CartProvider } from './hooks/useCart'
import { FavoritesProvider } from './hooks/useFavorites'
import { ChatProvider } from './contexts/ChatContext'
import { ProtectedRoute } from './components/common/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'
import { GoogleOAuthProvider } from '@react-oauth/google'

// Public Pages
const HomePage = lazy(() => import('./pages/Home'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const Contact = lazy(() => import('./pages/Contact'))
const OfflineKundali = lazy(() => import('./pages/Kundali/OfflineKundali'))
const PanchangCalendar = lazy(() => import('./pages/Calendar/PanchangCalendar'))

// Shop
const PujaCategories = lazy(() => import('./pages/Shop/PujaCategories'))
const Samagri = lazy(() => import('./pages/Shop/Samagri'))
const Books = lazy(() => import('./pages/Shop/Books'))
const CartPage = lazy(() => import('./pages/Shop/Cart'))
const CheckoutPage = lazy(() => import('./pages/Shop/Checkout'))
const ShopPaymentSuccess = lazy(() => import('./pages/Shop/ShopPaymentSuccess'))
const ShopPaymentFailure = lazy(() => import('./pages/Shop/ShopPaymentFailure'))
const ShopEsewaVerify = lazy(() => import('./pages/Shop/ShopEsewaVerify'))

// Auth
const LoginPage = lazy(() => import('./pages/auth/Login'))
const RegisterPage = lazy(() => import('./pages/auth/Register'))
const PanditRegister = lazy(() => import('./pages/auth/PanditRegister'))
const VendorRegister = lazy(() => import('./pages/auth/VendorRegister'))
const LoginOTPVerification = lazy(() => import('./pages/auth/otp-verification/LoginOTPVerification'))
const ForgotPassword = lazy(() => import('./pages/auth/forgot-password/ForgotPassword'))
const OTPVerification = lazy(() => import('./pages/auth/otp-verification/OTPVerification'))
const ChangePassword = lazy(() => import('./pages/auth/change-password/ChangePassword'))
const VendorTerms = lazy(() => import('./pages/auth/VendorTerms'))

// Booking
const PanditList = lazy(() => import('./pages/Booking/PanditList').then(m => ({ default: m.PanditList })))
const PanditProfile = lazy(() => import('./pages/find-pandit/PanditProfile'))
const BookingForm = lazy(() => import('./pages/Booking/BookingForm'))
const Confirmation = lazy(() => import('./pages/Booking/Confirmation'))
const ReviewForm = lazy(() => import('./pages/Booking/ReviewForm'))
const MyBookingsPage = lazy(() => import('./pages/customer/MyBookings'))
const RescheduleBooking = lazy(() => import('./pages/Booking/RescheduleBooking'))

// Customer
const CustomerDashboard = lazy(() => import('./pages/customer/CustomerDashboard'))
const CustomerMessages = lazy(() => import('./pages/customer/CustomerMessages'))
const EditProfile = lazy(() => import('./pages/customer/Profile'))

// Pandit
const PanditDashboard = lazy(() => import('./pages/pandit/PanditDashboard'))
const PanditEarnings = lazy(() => import('./pages/pandit/PanditEarnings'))
const PanditServices = lazy(() => import('./pages/pandit/PanditServices'))
const PanditBookings = lazy(() => import('./pages/pandit/PanditBookings'))
const PanditMessages = lazy(() => import('./pages/pandit/PanditMessages'))
const PanditPrivateProfile = lazy(() => import('./pages/pandit/PanditProfile'))
const PanditCalendarPage = lazy(() => import('./pages/pandit/PanditCalendarPage'))
const PanditReviews = lazy(() => import('./pages/pandit/PanditReviews'))
const PanditAppFeedback = lazy(() => import('./pages/pandit/PanditAppFeedback'))

// Vendor
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard'))
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts'))
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders'))
const VendorPayouts = lazy(() => import('./pages/vendor/VendorPayouts'))
const VendorProfilePage = lazy(() => import('./pages/vendor/VendorProfile'))
const VendorMessages = lazy(() => import('./pages/vendor/VendorMessages'))
const VendorSettings = lazy(() => import('./pages/vendor/VendorSettings'))
const VendorAppFeedback = lazy(() => import('./pages/vendor/VendorAppFeedback'))

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminPandits = lazy(() => import('./pages/admin/AdminPandits'))
const AdminBookings = lazy(() => import('./pages/admin/AdminBookings'))
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'))
const AdminPayments = lazy(() => import('./pages/admin/AdminPayments'))
const AdminShopOrders = lazy(() => import('./pages/admin/AdminShopOrders'))
const AdminPayouts = lazy(() => import('./pages/admin/AdminPayouts'))
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'))
const AdminSamagri = lazy(() => import('./pages/admin/AdminSamagri'))
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'))
const AdminServices = lazy(() => import('./pages/admin/AdminServices'))
const AdminActivityLogs = lazy(() => import('./pages/admin/AdminActivityLogs'))
const AdminReviews = lazy(() => import('./pages/admin/AdminReviews'))
const AdminPanditsList = lazy(() => import('./pages/admin/AdminPanditsList'))
const AdminVendorsList = lazy(() => import('./pages/admin/AdminVendorsList'))
const VendorVerification = lazy(() => import('./pages/admin/VendorVerification'))
const AdminProfile = lazy(() => import('./pages/admin/AdminProfile'))
const AdminSiteContent = lazy(() => import('./pages/admin/AdminSiteContent'))
const AdminBanners = lazy(() => import('@/pages/admin/AdminBanners'))
const AdminSupport = lazy(() => import('./pages/admin/AdminSupport'))
const AdminErrorLogs = lazy(() => import('./pages/admin/AdminErrorLogs'))
const ManageAdmins = lazy(() => import('./pages/admin/ManageAdmins'))
const AdminBugReports = lazy(() => import('./pages/admin/AdminBugReports'))
const AdminCreateUser = lazy(() => import('./pages/admin/AdminCreateUser'))

// Misc
const ReportBug = lazy(() => import('./pages/bugs/ReportBug'))
const ChatList = lazy(() => import('./pages/Chat/ChatList'))
const ChatRoom = lazy(() => import('./pages/Chat/ChatRoom'))
const PaymentPage = lazy(() => import('./pages/Payment/PaymentPage'))
const PaymentSuccess = lazy(() => import('./pages/Payment/PaymentSuccess'))
const PaymentFailure = lazy(() => import('./pages/Payment/PaymentFailure'))
const KhaltiVerify = lazy(() => import('./pages/Payment/KhaltiVerify'))
const EsewaVerify = lazy(() => import('./pages/Payment/EsewaVerify'))
const PujaRoom = lazy(() => import('./pages/Video/PujaRoom'))
const RecordingView = lazy(() => import('./pages/Video/RecordingView'))

// Error Pages
const NotFound = lazy(() => import('./pages/Error/NotFound'))
const ServerError = lazy(() => import('./pages/Error/ServerError'))
const Unauthorized = lazy(() => import('./pages/Error/Unauthorized'))
const Offline = lazy(() => import('./pages/Error/Offline'))

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
                <BrowserRouter>
                  <Suspense fallback={
                    <div className="flex flex-col items-center justify-center min-h-screen w-full bg-stone-50 gap-4">
                      <LoadingSpinner size={60} className="text-orange-600" />
                      <p className="text-orange-900/60 text-sm font-bold tracking-widest uppercase animate-pulse">Entering Protected Space</p>
                    </div>
                  }>
                    <Offline />
                    <Routes>
                      {/* 🌍 Public */}
                      <Route path="/" element={
                        <ProtectedRoute allowedRoles={['user', 'admin']} isPublic>
                          <HomePage />
                        </ProtectedRoute>
                      } />
                      <Route path="/about" element={<AboutUs />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/kundali" element={<ProtectedRoute allowedRoles={['user', 'admin']} isPublic><OfflineKundali /></ProtectedRoute>} />
                      <Route path="/calendar" element={<ProtectedRoute allowedRoles={['user', 'admin']} isPublic><PanchangCalendar /></ProtectedRoute>} />
                      <Route path="/shop/pujas" element={<ProtectedRoute allowedRoles={['user', 'admin']} isPublic><PujaCategories /></ProtectedRoute>} />
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
                      <Route path="/pandits" element={<ProtectedRoute allowedRoles={['user', 'admin']} isPublic><PanditList /></ProtectedRoute>} />
                      <Route path="/pandits/:id" element={<ProtectedRoute allowedRoles={['user', 'admin']} isPublic><PanditProfile /></ProtectedRoute>} />

                      {/* 🔐 Auth */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/pandit/register" element={<PanditRegister />} />
                      <Route path="/vendor/register" element={<VendorRegister />} />
                      <Route path="/otp-verification" element={<LoginOTPVerification />} />
                      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                      <Route path="/auth/otp-verification" element={<OTPVerification />} />
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/auth/change-password" element={<ChangePassword />} />
                      <Route path="/vendor/terms" element={<VendorTerms />} />

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

                      <Route path="/booking/reschedule/:id" element={
                        <ProtectedRoute allowedRoles={['user']}>
                          <RescheduleBooking />
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

                      <Route path="/pandit/report-bug" element={
                        <ProtectedRoute allowedRoles={['pandit']}>
                          <ReportBug />
                        </ProtectedRoute>
                      } />

                      <Route path="/pandit/profile" element={
                        <ProtectedRoute allowedRoles={['pandit']}>
                          <PanditPrivateProfile />
                        </ProtectedRoute>
                      } />

                      {/* 📦 Vendor */}
                      <Route path="/vendor/dashboard" element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorDashboard />
                        </ProtectedRoute>
                      } />

                      <Route path="/vendor/products" element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorProducts />
                        </ProtectedRoute>
                      } />

                      <Route path="/vendor/orders" element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorOrders />
                        </ProtectedRoute>
                      } />

                      <Route path="/vendor/payouts" element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorPayouts />
                        </ProtectedRoute>
                      } />

                      <Route path="/vendor/profile" element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorProfilePage />
                        </ProtectedRoute>
                      } />

                      <Route path="/vendor/messages" element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorMessages />
                        </ProtectedRoute>
                      } />

                      <Route path="/vendor/settings" element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorSettings />
                        </ProtectedRoute>
                      } />

                      <Route path="/vendor/report-bug" element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <ReportBug />
                        </ProtectedRoute>
                      } />

                      <Route path="/vendor/app-feedback" element={
                        <ProtectedRoute allowedRoles={['vendor']}>
                          <VendorAppFeedback />
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

                      <Route path="/admin/vendors-list" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <AdminVendorsList />
                          </ProtectedRoute>
                      } />

                      <Route path="/admin/vendors-verification" element={
                          <ProtectedRoute allowedRoles={['admin']}>
                            <VendorVerification />
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
                      <Route path="/admin/users/create" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminCreateUser />
                        </ProtectedRoute>
                      } />

                      <Route path="/admin/payments" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminPayments />
                        </ProtectedRoute>
                      } />
                      <Route path="/admin/marketplace-orders" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdminShopOrders />
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
                      <Route path="/admin/error-logs" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminErrorLogs /></ProtectedRoute>} />
                      <Route path="/admin/bugs" element={<ProtectedRoute allowedRoles={['admin', 'superadmin']}><AdminBugReports /></ProtectedRoute>} />

                      {/* 🐛 Bug Reports (All Roles) */}
                      <Route path="/report-bug" element={
                        <ProtectedRoute allowedRoles={['user', 'pandit', 'vendor']}>
                          <ReportBug />
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
                  </Suspense>
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
