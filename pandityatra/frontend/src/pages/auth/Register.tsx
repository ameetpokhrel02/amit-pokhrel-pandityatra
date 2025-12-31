import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { FaUser, FaUserTie } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const { register, token } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'pandit'>('user');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  // Redirect to dedicated pandit registration if pandit role is selected
  useEffect(() => {
    if (role === 'pandit') {
      navigate('/pandit/register');
    }
  }, [role, navigate]);

  const handleRegister = async () => {
    setMessage(null);
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        full_name: fullName.trim(),
        phone_number: phone.trim(),
        role: role,  // Include role in registration
      };

      // Only include email if it's provided and not empty
      if (email && email.trim()) {
        payload.email = email.trim();
      }

      // Only include password if it's provided and not empty
      if (password && password.trim()) {
        payload.password = password.trim();
      }

      await register(payload);
      if (password && password.trim()) {
        setMessage('Registered successfully! You can now login.');
        // Optional: redirect after short delay?
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setMessage('Registered successfully. OTP sent to your phone. Please login with the OTP.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Get started with PanditYatra"
    >
      <div className="space-y-5">

        {/* Role Selection */}
        <div className="space-y-2">
          <Label htmlFor="role">I want to register as</Label>
          <Select value={role} onValueChange={(value: 'user' | 'pandit') => setRole(value)}>
            <SelectTrigger id="role" className="w-full h-12 rounded-xl border-gray-200 focus:ring-primary">
              <SelectValue placeholder="Select account type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">
                <div className="flex items-center gap-2">
                  <FaUser className="h-4 w-4 text-primary" />
                  <span>User</span>
                </div>
              </SelectItem>
              <SelectItem value="pandit">
                <div className="flex items-center gap-2">
                  <FaUserTie className="h-4 w-4 text-primary" />
                  <span>Pandit</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9847226995"
              type="tel"
              required
              className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="pokhrelameet@gmail.com"
              type="email"
              className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password (Optional)</Label>
            <div className="relative">
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Set a password"
                type={showPassword ? 'text' : 'password'}
                className="h-12 rounded-xl border-gray-200 focus-visible:ring-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Set a password to duplicate login methods (OTP is default).
            </p>
          </div>
        </div>

        <Button
          onClick={handleRegister}
          disabled={loading || !phone || !fullName}
          className="w-full h-12 text-base rounded-xl bg-primary hover:bg-primary/90 transition-colors"
        >
          {loading ? <LoadingSpinner size={20} className="text-white" /> : 'Create Account'}
        </Button>

        {message && (
          <Alert className="bg-green-50 text-green-800 border-green-200">
            <AlertDescription>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Login here
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};

export default RegisterPage;

