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
import { FaUser, FaUserTie, FaEnvelope, FaLock, FaArrowRight, FaBriefcase } from 'react-icons/fa';
import { Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { GoogleLogin } from '@react-oauth/google';
import { COUNTRY_OPTIONS, detectUserCountryCode, formatInternationalPhone, getCountryOption } from './country-phone';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

const registerSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional().refine(val => !val || /^\d{7,15}$/.test(val.replace(/\D/g, '')), "Invalid phone number length"),
  countryCode: z.string(),
  password: z.string().optional().refine(val => {
     if (!val) return true;
     return val.length >= 8 && /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val) && /[!@#$%^&*(),.?":{}|<>]/.test(val);
  }, "Password must be min 8 chars with 1 uppercase, 1 lowercase, 1 number, and 1 special char."),
});

type RegisterValues = z.infer<typeof registerSchema>;

const RegisterPage: React.FC = () => {
  const { register, googleLogin, token } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [role, setRole] = useState<'user' | 'pandit' | 'vendor' | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDetectingCountry, setIsDetectingCountry] = useState(false);

  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '',
      countryCode: 'NP',
      password: '',
    },
    mode: "onChange",
  });

  const selectedCountry = getCountryOption(form.watch('countryCode'));

  // Redirect if already logged in
  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
  }, [token, navigate]);

  // Auto-redirect for Pandit & Vendor
  useEffect(() => {
    if (role === 'pandit') {
      navigate('/pandit/register', { replace: true });
    } else if (role === 'vendor') {
      navigate('/vendor/register', { replace: true });
    }
  }, [role, navigate]);

  useEffect(() => {
    let active = true;

    const detectCountry = async () => {
      setIsDetectingCountry(true);
      try {
        const detected = await detectUserCountryCode();
        if (!active || !detected) return;
        const exists = COUNTRY_OPTIONS.some((country) => country.code === detected);
        if (exists) form.setValue('countryCode', detected);
      } finally {
        if (active) setIsDetectingCountry(false);
      }
    };

    void detectCountry();
    return () => {
      active = false;
    };
  }, []);

  const validatePassword = (pass: string) => {
    if (!pass) return { score: 0, met: [] };
    const requirements = [
      { id: 'length', text: 'Min 8 characters', test: (p: string) => p.length >= 8 },
      { id: 'upper', text: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
      { id: 'lower', text: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
      { id: 'number', text: 'One number', test: (p: string) => /[0-9]/.test(p) },
      { id: 'special', text: 'One special character', test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];
    const met = requirements.filter(r => r.test(pass)).map(r => r.id);
    return { score: met.length, met };
  };

  const passwordInfo = validatePassword(form.watch('password') || '');

  const onSubmit = async (data: RegisterValues) => {
    setError(null);
    setLoading(true);
    try {
      const payload: any = {
        full_name: data.fullName.trim(),
        email: data.email.trim(),
        role: 'user',
      };
      if (data.phone?.trim()) payload.phone_number = formatInternationalPhone(data.phone, selectedCountry.dialCode);
      if (data.password?.trim()) payload.password = data.password.trim();

      await register(payload);

      toast({
        title: "Account Created!",
        description: data.password ? "You can now login with your password." : "OTP sent to your email.",
        variant: "default",
      });

      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={role === 'user' ? "Create Account" : "Join PanditYatra"}
      subtitle={role === 'user' ? "Fill in your details below" : "Choose how you want to register"}
    >
      <motion.div className="space-y-5">

        {/* Role Selection (Always visible) */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium">I want to register as:</Label>
          <Select value={role} onValueChange={(value: 'user' | 'pandit' | 'vendor') => setRole(value)}>
            <SelectTrigger className="w-full h-12 rounded-xl bg-gray-50/50 border-orange-100 focus:ring-orange-500">
              <SelectValue placeholder="Select your role..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="user">
                <div className="flex items-center gap-2">
                  <FaUser className="w-4 h-4 text-blue-500" />
                  <span>Customer / User</span>
                </div>
              </SelectItem>
              <SelectItem value="pandit">
                <div className="flex items-center gap-2">
                  <FaUserTie className="w-4 h-4 text-orange-500" />
                  <span>Pandit / Priest (Service)</span>
                </div>
              </SelectItem>
              <SelectItem value="vendor">
                <div className="flex items-center gap-2">
                  <FaBriefcase className="w-4 h-4 text-green-600" />
                  <span>Vendor / Seller (Samagri)</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full text-sm font-semibold text-gray-600 underline underline-offset-4 hover:text-orange-600 pt-1"
          >
            Explore as Guest
          </button>
        </div>

        {/* User Registration Form (Shows when 'user' is selected) */}
        <AnimatePresence>
          {role === 'user' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="fullName" className="text-gray-600 font-semibold px-1">Full Name *</Label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                          <FaUser className="w-4 h-4" />
                        </span>
                        <FormControl>
                          <Input
                            id="fullName"
                            placeholder="Your full name"
                            className={`h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all ${form.formState.errors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="px-1" />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="email" className="text-gray-600 font-semibold px-1">Email Address *</Label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                          <FaEnvelope className="w-4 h-4" />
                        </span>
                        <FormControl>
                          <Input
                            id="email"
                            placeholder="you@example.com"
                            type="email"
                            className={`h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all ${form.formState.errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            {...field}
                          />
                        </FormControl>
                      </div>
                      <FormMessage className="px-1" />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-600 font-semibold px-1">Phone Number (Optional)</Label>
                      <div className="space-y-1">
                        <div className={`h-14 rounded-2xl bg-gray-100/50 border focus-within:bg-white focus-within:ring-2 transition-all flex items-center overflow-hidden ${form.formState.errors.phone ? 'border-red-500 focus-within:ring-red-500/20 focus-within:border-red-500' : 'border-transparent focus-within:ring-orange-500/20 focus-within:border-orange-200'}`}>
                          <div className="h-full flex items-center pl-3 pr-2 border-r border-gray-200/80">
                            <select
                              value={form.watch('countryCode')}
                              onChange={(e) => form.setValue('countryCode', e.target.value)}
                              className="bg-transparent text-sm font-medium text-gray-700 focus:outline-none max-w-[165px]"
                              aria-label="Select country"
                            >
                              {COUNTRY_OPTIONS.map((country) => (
                                <option key={country.code} value={country.code}>
                                  {country.flag} {country.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <span className="px-3 text-sm font-semibold text-gray-500">{selectedCountry.dialCode}</span>
                          <FormControl>
                            <Input
                              id="phone"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                              placeholder="98XXXXXXXX"
                              inputMode="numeric"
                              type="tel"
                              className="h-full border-0 rounded-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 text-base"
                            />
                          </FormControl>
                        </div>
                        <p className="text-xs text-gray-500 px-1">
                          {isDetectingCountry ? 'Detecting country…' : `Using ${selectedCountry.flag} ${selectedCountry.name}`}
                        </p>
                        <FormMessage className="px-1" />
                      </div>
                    </FormItem>
                  )}
                />

                {/* Password */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <Label htmlFor="password" className="text-gray-600 font-semibold px-1">Password (Optional)</Label>
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                          <FaLock className="w-4 h-4" />
                        </span>
                        <FormControl>
                          <Input
                            id="password"
                            placeholder="Create a password"
                            type={showPassword ? 'text' : 'password'}
                            className={`h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 pr-12 text-base transition-all ${form.formState.errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}`}
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      <FormMessage className="px-1" />
                      
                      {field.value && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Strength</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          passwordInfo.score <= 2 ? 'bg-red-100 text-red-600' : 
                          passwordInfo.score <= 4 ? 'bg-orange-100 text-orange-600' : 
                          'bg-green-100 text-green-600'
                        }`}>
                          {passwordInfo.score <= 2 ? 'Weak' : passwordInfo.score <= 4 ? 'Medium' : 'Strong'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-1.5">
                        {[1, 2, 3, 4, 5].map((lvl) => (
                          <div key={lvl} className={`h-1.5 rounded-full transition-all duration-500 ${
                            lvl <= passwordInfo.score ? (
                              passwordInfo.score <= 2 ? 'bg-red-500' : 
                              passwordInfo.score <= 4 ? 'bg-orange-500' : 
                              'bg-green-500'
                            ) : 'bg-gray-200'
                          }`} />
                        ))}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 pt-1">
                        {[
                          { id: 'length', text: '8+ Characters' },
                          { id: 'upper', text: 'Uppercase' },
                          { id: 'lower', text: 'Lowercase' },
                          { id: 'number', text: 'Number' },
                          { id: 'special', text: 'Special Char' },
                        ].map((req) => (
                          <div key={req.id} className="flex items-center gap-2">
                            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                              passwordInfo.met.includes(req.id) ? 'bg-green-500' : 'bg-gray-200'
                            }`}>
                              {passwordInfo.met.includes(req.id) && <span className="text-[10px] text-white">✓</span>}
                            </div>
                            <span className={`text-[11px] font-medium ${
                              passwordInfo.met.includes(req.id) ? 'text-gray-700' : 'text-gray-400'
                            }`}>{req.text}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  <p className="text-xs text-gray-500 px-1 pt-1 font-medium">Leave blank to use OTP login only.</p>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 text-lg font-bold rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xl shadow-orange-200/50 transition-all active:scale-[0.98] border-none mt-4"
                >
                  {loading ? <LoadingSpinner size={24} className="text-white" /> : (
                    <div className="flex items-center gap-2">
                      Join PanditYatra <FaArrowRight size={14} />
                    </div>
                  )}
                </Button>
              </form>
              </Form>

              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Hint when no role selected */}
        {!role && (
          <p className="text-center text-sm text-gray-500 py-4">
            Select a role above to continue.
          </p>
        )}

        {/* Google Login Section */}
        <div className="flex flex-col items-center gap-4 pt-2">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Or Continue With</p>
          <div className="w-full flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setLoading(true);
                  try {
                    await googleLogin(credentialResponse.credential);
                    toast({
                      title: "Success!",
                      description: "Your account is ready. Redirecting...",
                    });
                  } catch (err: any) {
                    setError(err.message || "Google registration failed");
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              onError={() => {
                setError("Google authentication failed. Please try again.");
              }}
              theme="outline"
              shape="pill"
              size="large"
              width="100%"
              text="signup_with"
            />
          </div>
        </div>

        {/* Back to Login */}
        <div className="pt-8 text-center border-t border-gray-100 mt-4">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-orange-600 hover:underline">
              Login here
            </Link>
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default RegisterPage;
