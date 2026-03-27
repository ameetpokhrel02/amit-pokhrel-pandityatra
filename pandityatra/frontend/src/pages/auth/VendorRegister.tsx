import React, { useState } from 'react';
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

const VendorRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone_number: '',
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
    setLoading(true);

    try {
      const submitData = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null) {
          submitData.append(key, value);
        }
      });

      await apiClient.post('/vendors/register/', submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast({
        title: "Application Submitted!",
        description: "Your vendor account is under review. We'll contact you soon.",
      });

      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Register as Vendor" subtitle="Start selling your spiritual products">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Basic Info */}
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input name="full_name" value={formData.full_name} onChange={handleInputChange} className="pl-10 h-11" placeholder="Amit Pokhrel" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email *</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input name="email" type="email" value={formData.email} onChange={handleInputChange} className="pl-10 h-11" placeholder="riya@example.com" required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Phone Number *</Label>
            <div className="relative">
              <Smartphone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="pl-10 h-11" placeholder="98XXXXXXXX" required />
            </div>
          </div>
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
