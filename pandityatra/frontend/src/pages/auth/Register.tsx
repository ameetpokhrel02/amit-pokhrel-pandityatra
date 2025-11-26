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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';
import { FaUser, FaUserTie } from 'react-icons/fa';

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

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

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
        setMessage('Registered successfully! You can now login with your phone number and password.');
      } else {
        setMessage('Registered successfully. OTP sent to your phone. Please login with the OTP.');
      }
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Register</CardTitle>
          <CardDescription>
            Create a new account to get started
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="role">Register As *</Label>
            <Select value={role} onValueChange={(value: 'user' | 'pandit') => setRole(value)}>
              <SelectTrigger id="role" className="w-full">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">
                  <div className="flex items-center gap-2">
                    <FaUser className="h-4 w-4" />
                    <span>User / Customer</span>
                  </div>
                </SelectItem>
                <SelectItem value="pandit">
                  <div className="flex items-center gap-2">
                    <FaUserTie className="h-4 w-4" />
                    <span>Pandit</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {role === 'user' 
                ? 'Register as a customer to book puja services'
                : 'Register as a pandit to offer your services'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="98XXXXXXXX"
              type="tel"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email (Optional)</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              type="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password (Optional)</Label>
            <Input
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a password for password login"
              type="password"
            />
            <p className="text-xs text-muted-foreground">
              If you set a password, you can login with phone + password. Otherwise, use OTP login.
            </p>
          </div>

          <Button 
            onClick={handleRegister} 
            disabled={loading || !phone || !fullName}
            className="w-full"
          >
            {loading ? <LoadingSpinner size={18} /> : 'Register'}
          </Button>

          {message && (
            <Alert>
              <AlertDescription className="text-green-600">
                {message}
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="text-center text-sm text-muted-foreground mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RegisterPage;

