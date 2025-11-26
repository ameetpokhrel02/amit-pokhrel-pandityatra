
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import HomePage from './pages/Home';
import LoginPage from './pages/auth/Login';
import RegisterPage from './pages/auth/Register';
import LoginOTPVerification from './pages/auth/otp-verification/LoginOTPVerification';
import ForgotPassword from './pages/auth/forgot-password/ForgotPassword';
import OTPVerification from './pages/auth/otp-verification/OTPVerification';
import ChangePassword from './pages/auth/change-password/ChangePassword';
import { PanditList } from './pages/Booking/PanditList';
import CustomerDashboard from './pages/Dashboard/CustomerDashboard';
import PanditDashboard from './pages/Dashboard/PanditDashboard';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
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
                <PanditList />
              </ProtectedRoute>
            }
          />
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

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
