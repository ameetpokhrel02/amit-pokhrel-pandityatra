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
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Upload, FileText, Smartphone, Mail, Lock, User, MapPin, Building2, Landmark, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { GoogleLogin } from '@react-oauth/google';
import { z } from 'zod';

const vendorRegisterSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string().min(7, 'Phone number is required').refine(val => /^\+?\d{7,15}$/.test(val.replace(/\s/g, '')), 'Invalid phone number format'),
  password: z.string().optional().refine(val => {
    if (!val) return true; // Google auth users skip password
    return val.length >= 8 && /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val) && /[!@#$%^&*(),.?":{}|<>]/.test(val);
  }, 'Password must be at least 8 chars with uppercase, lowercase, number and special character'),
  shop_name: z.string().min(2, 'Shop/Business name is required').max(100),
  business_type: z.string().min(1, 'Please select a business type'),
  address: z.string().min(5, 'Please enter a complete address'),
  city: z.string().min(2, 'City is required'),
  bank_name: z.string().min(2, 'Bank name is required'),
  account_holder_name: z.string().min(2, 'Account holder name is required'),
  bank_account_number: z.string().min(5, 'Bank account number is required').max(30),
  has_id_proof: z.boolean().refine(val => val === true, 'Government ID proof document is required'),
});

const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, token, googleLogin, refreshUser } = useAuth();

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    password: '',
    shop_name: '',
    business_type: '',
    address: '',
    city: '',
    bank_account_number: '',
    bank_name: '',
    account_holder_name: '',
    id_proof: null as File | null,
    bio: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleAuth, setIsGoogleAuth] = useState(!!user?.email);

  // Update form if user logs in via Google during the process
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || prev.full_name,
        email: user.email || prev.email,
        phone_number: user.phone_number || prev.phone_number
      }));
      setIsGoogleAuth(true);
    }
  }, [user]);

  const businessTypes = [
    'Samagri Store',
    'Book Store',
    'Murtis & Idols',
    'Clothing & Ritual Wear',
    'Ayurvedic & Herbal',
    'Other'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, id_proof: e.target.files![0] }));
      setFileSelected(true);
    }
  };

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

  const passwordInfo = validatePassword(formData.password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Run Zod validation
    const validation = vendorRegisterSchema.safeParse({
      full_name: formData.full_name,
      email: formData.email,
      phone_number: formData.phone_number,
      password: isGoogleAuth ? undefined : formData.password,
      shop_name: formData.shop_name,
      business_type: formData.business_type,
      address: formData.address,
      city: formData.city,
      bank_name: formData.bank_name,
      account_holder_name: formData.account_holder_name,
      bank_account_number: formData.bank_account_number,
      has_id_proof: !!formData.id_proof,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Please fill all required fields';
      setError(firstError);
      return;
    }

    // Extra: password strength check for non-Google registrations
    if (!isGoogleAuth && formData.password && passwordInfo.score < 5) {
      setError('Password does not meet strength requirements. Please add uppercase, number and special character.');
      return;
    }

    const uploadToastId = toast({
      title: "Uploading verification documents to Cloudinary...",
      description: "Please wait while we securely store your business ID.",
      duration: Infinity,
    }).id;

    setLoading(true);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          // Skip password if registering via Google
          if (isGoogleAuth && key === 'password') return;
          submitData.append(key, value);
        }
      });

      await apiClient.post('/vendors/register/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: "Application Submitted!",
        description: "Your vendor account details and ID have been saved to Cloudinary and are under review. We'll contact you soon.",
      });

      // If they were in onboarding mode, refresh user profile to show they have a profile now
      if (token) await refreshUser();

      setTimeout(() => navigate(token ? '/vendor/dashboard' : '/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
        title={token ? "Complete Your Vendor Profile" : "Register as Vendor"} 
        subtitle={token ? "Update your details and submit for verification" : "Start selling your spiritual products"}
    >
      <div className="mb-8 space-y-4">
        {!isGoogleAuth && (
            <div className="flex flex-col items-center gap-4 p-6 bg-gradient-to-br from-orange-50 to-white rounded-2xl border border-orange-100 shadow-sm transition-all hover:shadow-md">
                <p className="text-xs text-orange-600 uppercase tracking-widest font-bold">Register Fast With</p>
                <div className="w-full flex justify-center scale-110">
                    <GoogleLogin
                        onSuccess={async (credentialResponse) => {
                            if (credentialResponse.credential) {
                                setLoading(true);
                                try {
                                    await googleLogin(credentialResponse.credential, 'vendor');
                                    toast({
                                        title: "Google Auth Successful!",
                                        description: "Please complete your business details below.",
                                    });
                                } catch (err: any) {
                                    setError(err.message || "Google registration failed");
                                } finally {
                                    setLoading(false);
                                }
                            }
                        }}
                        onError={() => setError("Google registration failed. Please try again.")}
                        useOneTap
                        theme="outline"
                        shape="pill"
                        size="large"
                        text="signup_with"
                    />
                </div>
            </div>
        )}

        {isGoogleAuth && (
            <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-100 rounded-xl flex items-center justify-between"
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                        ✓
                    </div>
                    <div>
                        <p className="text-sm font-bold text-green-800">Connected with Google</p>
                        <p className="text-xs text-green-600">{formData.email}</p>
                    </div>
                </div>
                {!token && (
                     <Button variant="ghost" size="sm" onClick={() => setIsGoogleAuth(false)} className="text-xs text-gray-500 hover:text-red-500">
                        Disconnect
                    </Button>
                )}
            </motion.div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                name="full_name" 
                value={formData.full_name} 
                onChange={handleInputChange} 
                className={`pl-10 h-11 ${isGoogleAuth ? 'bg-gray-50 cursor-not-allowed opacity-80' : ''}`} 
                placeholder="Amit Pokhrel" 
                required 
                disabled={isGoogleAuth}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                name="email" 
                type="email" 
                value={formData.email} 
                onChange={handleInputChange} 
                className={`pl-10 h-11 ${isGoogleAuth ? 'bg-gray-50 cursor-not-allowed opacity-80' : ''}`} 
                placeholder="riya@example.com" 
                required 
                disabled={isGoogleAuth}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input 
                name="phone_number" 
                value={formData.phone_number} 
                onChange={handleInputChange} 
                className={`pl-10 h-11 ${isGoogleAuth && user?.phone_number ? 'bg-gray-50 cursor-not-allowed opacity-80' : ''}`} 
                placeholder="98XXXXXXXX" 
                required 
                disabled={!!(isGoogleAuth && user?.phone_number)}
              />
            </div>
          </div>
          {!isGoogleAuth && (
            <div className="space-y-2">
              <Label>Password *</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleInputChange} className="pl-10 h-11" required />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-orange-500 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" x2="23" y1="1" y2="23" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                  )}
                </button>
              </div>
              
              {formData.password && (
                <motion.div 
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Security</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      passwordInfo.score <= 2 ? 'bg-red-50 text-red-600' : 
                      passwordInfo.score <= 4 ? 'bg-orange-100 text-orange-600' : 
                      'bg-green-100 text-green-600'
                    }`}>
                      {passwordInfo.score <= 2 ? 'Weak' : passwordInfo.score <= 4 ? 'Medium' : 'Strong'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-1">
                    {[1, 2, 3, 4, 5].map((lvl) => (
                      <div key={lvl} className={`h-1 rounded-full transition-all duration-500 ${
                        lvl <= passwordInfo.score ? (
                          passwordInfo.score <= 2 ? 'bg-red-500' : 
                          passwordInfo.score <= 4 ? 'bg-orange-500' : 
                          'bg-green-500'
                        ) : 'bg-gray-200'
                      }`} />
                    ))}
                  </div>
  
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {[
                      { id: 'length', text: '8+ chars' },
                      { id: 'upper', text: 'ABC' },
                      { id: 'lower', text: 'abc' },
                      { id: 'number', text: '123' },
                      { id: 'special', text: '#@!' },
                    ].map((req) => (
                      <div key={req.id} className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-colors ${
                          passwordInfo.met.includes(req.id) ? 'bg-green-500' : 'bg-gray-200'
                        }`}>
                          {passwordInfo.met.includes(req.id) && <span className="text-[7px] text-white">✓</span>}
                        </div>
                        <span className={`text-[9px] font-semibold ${
                          passwordInfo.met.includes(req.id) ? 'text-gray-600' : 'text-gray-400'
                        }`}>{req.text}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-bold text-gray-800">Business details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Shop / Business Name *</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="shop_name" value={formData.shop_name} onChange={handleInputChange} className="pl-10 h-11" placeholder="Riya's Puja Samagri" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Business Type *</Label>
              <Select onValueChange={(v) => setFormData(p => ({ ...p, business_type: v }))}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {businessTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Complete Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input name="address" value={formData.address} onChange={handleInputChange} className="pl-10 h-11" placeholder="123 Spiritual St" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>City *</Label>
            <Input name="city" value={formData.city} onChange={handleInputChange} className="h-11" placeholder="Kathmandu" required />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h3 className="font-bold text-gray-800">Payout Details (Bank Info)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bank Name *</Label>
              <div className="relative">
                <Landmark className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="bank_name" value={formData.bank_name} onChange={handleInputChange} className="pl-10 h-11" placeholder="Nabil Bank" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Account Holder Name *</Label>
              <Input name="account_holder_name" value={formData.account_holder_name} onChange={handleInputChange} className="h-11" required />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Account Number *</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input name="bank_account_number" value={formData.bank_account_number} onChange={handleInputChange} className="pl-10 h-11" required />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2 border-t pt-4">
          <Label>Upload ID Proof (Citizenship/PAN) *</Label>
          <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all ${fileSelected ? 'border-green-400 bg-green-50' : 'border-orange-200 bg-orange-50 hover:bg-orange-100'}`}>
            <div className="flex flex-col items-center justify-center py-5">
              {fileSelected ? <FileText className="h-8 w-8 text-green-600 mb-2" /> : <Upload className="h-8 w-8 text-orange-400 mb-2" />}
              <p className="text-sm font-medium">{fileSelected ? formData.id_proof?.name : 'Click to upload proof'}</p>
            </div>
            <input type="file" className="hidden" onChange={handleFileChange} required />
          </label>
        </div>

        {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Button type="submit" disabled={loading} className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-all">
          {loading ? <LoadingSpinner /> : 'Register for Verification'}
        </Button>

        <p className="text-center text-sm text-gray-500">
          Already have a shop? <Link to="/login" className="text-orange-600 font-bold hover:underline">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default VendorRegisterPage;
