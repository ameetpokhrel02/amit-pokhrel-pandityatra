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
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

const PanditRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
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
      await axios.post(
        'http://localhost:8000/api/pandits/register/',
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      toast({
        title: "Registration Submitted!",
        description: "Your documents are under review. We will contact you shortly.",
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
    <AuthLayout title="Register as Pandit" subtitle="Share your expertise with seekers">
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
              className="h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all"
              required
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
              className="h-14 rounded-2xl bg-gray-100/50 border-transparent focus:bg-white focus:ring-orange-500/20 focus:border-orange-200 pl-12 text-base transition-all"
              required
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

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-600 font-semibold px-1">Password *</Label>
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
              required
              minLength={6}
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
          <p className="text-xs text-gray-500 px-1">Minimum 6 characters</p>
        </div>

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
