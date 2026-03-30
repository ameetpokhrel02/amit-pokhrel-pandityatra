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
import { Upload, FileText } from 'lucide-react';
import { FaUser, FaPhone, FaEnvelope, FaLanguage, FaBriefcase } from 'react-icons/fa';
import { useToast } from '@/hooks/use-toast';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import apiClient from '@/lib/api-client';
import { z } from 'zod';

const panditRegisterSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone_number: z.string().optional().refine(val => !val || /^\+?\d{7,15}$/.test(val.replace(/\s/g, '')), 'Invalid phone number'),
  password: z.string().optional().refine(val => {
    if (!val) return true;
    return val.length >= 8 && /[A-Z]/.test(val) && /[a-z]/.test(val) && /[0-9]/.test(val) && /[!@#$%^&*(),.?":{}|<>]/.test(val);
  }, 'Password must be at least 8 chars with uppercase, lowercase, number and special character'),
  expertise: z.array(z.string()).min(1, 'Please select at least one area of expertise'),
  language: z.string().min(1, 'Please select a primary language'),
  experience_years: z.string().min(1, 'Years of experience is required').refine(val => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 0 && num <= 80;
  }, 'Experience must be a number between 0 and 80'),
  has_certification_file: z.boolean().refine(val => val === true, 'Certification/license file is required for verification'),
});

const PanditRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { googleLogin, user } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone_number: '',
    email: '',
    password: '',
    expertise: [] as string[], // Changed to array
    language: '',
    experience_years: '',
    bio: '',
    certification_file: null as File | null,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fileSelected, setFileSelected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const expertiseOptions = [
    'Vedic Rituals',
    'Astrology & Kundali',
    'Marriage Ceremonies',
    'Griha Pravesh',
    'Naming Ceremony',
    'Funeral Rites',
    'Satyanarayan Puja',
    'Lakshmi Puja',
    'Ganesh Puja',
    'Navgraha Puja',
    'Rudrabhishek',
    'Thread Ceremony',
    'All Ceremonies'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleExpertiseChange = (expertise: string) => {
    setFormData(prev => {
      const newExpertise = prev.expertise.includes(expertise)
        ? prev.expertise.filter(e => e !== expertise)
        : [...prev.expertise, expertise];
      return { ...prev, expertise: newExpertise };
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        certification_file: e.target.files![0]
      }));
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Run Zod validation
    const validation = panditRegisterSchema.safeParse({
      full_name: formData.full_name,
      email: formData.email,
      phone_number: formData.phone_number || undefined,
      password: formData.password || undefined,
      expertise: formData.expertise,
      language: formData.language,
      experience_years: formData.experience_years,
      has_certification_file: !!formData.certification_file,
    });

    if (!validation.success) {
      const firstError = validation.error.issues[0]?.message || 'Please fill all required fields';
      setError(firstError);
      return;
    }

    // Extra: password strength enforced if not Google user
    if (!user && formData.password && passwordInfo.score < 5) {
      setError('Password does not meet strength requirements. Please add uppercase, number and special character.');
      return;
    }

    const uploadToastId = toast({
      title: "Uploading documents to Cloudinary...",
      description: "Please wait while we securely store your certifications.",
      duration: Infinity,
    }).id;

    setLoading(true);

    try {
      // Create FormData for multipart file upload
      const submitData = new FormData();
      submitData.append('full_name', formData.full_name.trim());
      submitData.append('phone_number', formData.phone_number.trim());
      submitData.append('email', formData.email.trim());
      submitData.append('password', formData.password);
      submitData.append('expertise', formData.expertise.join(', ')); // Join multiple selections
      submitData.append('language', formData.language.trim());
      submitData.append('experience_years', formData.experience_years);
      submitData.append('bio', formData.bio.trim());

      if (formData.certification_file) {
        submitData.append('certification_file', formData.certification_file);
      } else {
        throw new Error('Certification file is required');
      }

      // Send to backend
      await apiClient.post(
        '/pandits/register/',
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast({
        title: "Registration Submitted!",
        description: "Your documents have been saved to Cloudinary and are under review. We will contact you shortly.",
        variant: "default",
      });

      setSuccess(
        'Registration successful! Your documents are under review. We will contact you shortly.'
      );

      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.certification_file?.[0] || err.message || 'Registration failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
        title={user ? "Complete Your Professional Profile" : "Register as Pandit"} 
        subtitle={user ? "Finalize your expertise details for admin review" : "Share your expertise with seekers"}
    >
      {!user && (
        <div className="mb-8 space-y-4">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold text-center">Faster Application</p>
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                if (credentialResponse.credential) {
                  setLoading(true);
                  try {
                    const resp = await googleLogin(credentialResponse.credential);
                    // Pre-fill form from Google identity
                    if (resp && resp.user) {
                      setFormData(prev => ({
                        ...prev,
                        full_name: resp.user.full_name || prev.full_name,
                        email: resp.user.email || prev.email,
                      }));
                      toast({
                        title: "Identity Verified!",
                        description: "We've pre-filled your name and email. Please complete the rest of the form.",
                      });
                    }
                  } catch (err: any) {
                    setError(err.message || "Google authentication failed");
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
              text="continue_with"
            />
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-white text-gray-400">Or fill manually</span>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name" className="text-gray-600 font-semibold px-1">Full Name *</Label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
              <FaUser className="w-4 h-4" />
            </span>
            <Input
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Your full name"
              className={`h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all ${user ? 'opacity-80 cursor-not-allowed' : ''}`}
              required
              disabled={!!user}
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-600 font-semibold px-1">Email Address *</Label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
              <FaEnvelope className="w-4 h-4" />
            </span>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              className={`h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all ${user ? 'opacity-80 cursor-not-allowed' : ''}`}
              required
              disabled={!!user}
            />
          </div>
        </div>

        {/* Phone Number */}
        <div className="space-y-2">
          <Label htmlFor="phone_number" className="text-gray-600 font-semibold px-1">Phone Number (Optional)</Label>
          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
              <FaPhone className="w-4 h-4" />
            </span>
            <Input
              id="phone_number"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleInputChange}
              placeholder="9841234567"
              className="h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all"
            />
          </div>
        </div>

        {!user && (
          <div className="space-y-2">
            <Label htmlFor="password" {...(!user && { className: "text-gray-600 font-semibold px-1" })}>
              Password *
            </Label>
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              </span>
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a strong password"
                className="h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 pr-12 text-base transition-all"
                required={!user}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" x2="23" y1="1" y2="23" /></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
            
            {formData.password && (
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
            <p className="text-xs text-gray-500 px-1 pt-1 font-medium">Use a strong password for account security.</p>
          </div>
        )}

        {/* Expertise */}
        <div className="space-y-2">
          <Label>Areas of Expertise * (Select all that apply)</Label>
          <div className="grid grid-cols-2 gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
            {expertiseOptions.map((expertise) => (
              <label key={expertise} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.expertise.includes(expertise)}
                  onChange={() => handleExpertiseChange(expertise)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{expertise}</span>
              </label>
            ))}
          </div>
          {formData.expertise.length === 0 && (
            <p className="text-xs text-red-500">Please select at least one area of expertise</p>
          )}
          {formData.expertise.length > 0 && (
            <p className="text-xs text-green-600">Selected: {formData.expertise.join(', ')}</p>
          )}
        </div>

        {/* Language */}
        <div className="space-y-1">
          <Label htmlFor="language">Primary Language *</Label>
          <Select
            value={formData.language}
            onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
          >
            <SelectTrigger className="h-10 rounded-lg border-gray-200 text-sm">
              <SelectValue placeholder="Select your preferred language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Nepali">Nepali</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
              <SelectItem value="Sanskrit">Sanskrit</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Maithili">Maithili</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Experience Years */}
        <div className="space-y-1">
          <Label htmlFor="experience_years">Years of Experience *</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              <FaBriefcase className="w-5 h-5" />
            </span>
            <Input
              id="experience_years"
              name="experience_years"
              type="number"
              value={formData.experience_years}
              onChange={handleInputChange}
              placeholder="e.g., 10"
              min="0"
              max="100"
              className="h-10 rounded-lg border-gray-200 text-sm pl-10"
              required
            />
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-1">
          <Label htmlFor="bio">Brief Bio (Optional)</Label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us about yourself and your experience..."
            className="w-full h-24 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        {/* Certification File Upload */}
        <div className="space-y-1">
          <Label htmlFor="certification_file">Certification/License *</Label>
          <label
            htmlFor="certification_file"
            className={`flex items-center justify-center w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${fileSelected
              ? 'border-green-400 bg-green-50'
              : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
              }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {fileSelected ? (
                <>
                  <FileText className="h-8 w-8 text-green-600 mb-2" />
                  <p className="text-sm font-semibold text-green-600">
                    {formData.certification_file?.name}
                  </p>
                  <p className="text-xs text-gray-500">Click to change</p>
                </>
              ) : (
                <>
                  <Upload className="h-8 w-8 text-orange-600 mb-2" />
                  <p className="text-sm font-semibold text-gray-700">Upload certification</p>
                  <p className="text-xs text-gray-500">PDF, JPG, PNG (max 5MB)</p>
                </>
              )}
            </div>
            <input
              id="certification_file"
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              required
            />
          </label>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={loading || !fileSelected}
          className="w-full h-14 text-lg font-bold rounded-full bg-[#F97316] hover:bg-[#EA580C] text-white shadow-xl shadow-orange-200/50 transition-all active:scale-[0.98] border-none mt-6"
        >
          {loading ? (
            <LoadingSpinner size={24} className="text-white" />
          ) : (
            'Apply for Verification'
          )}
        </Button>

        {/* Back to Login */}
        <div className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-orange-600 hover:underline">
            Login here
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default PanditRegisterPage;
