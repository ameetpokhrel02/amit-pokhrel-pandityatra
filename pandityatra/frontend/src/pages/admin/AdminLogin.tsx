import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Lock, User } from 'lucide-react';

const AdminLoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { passwordLogin, token, role, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in as admin
  useEffect(() => {
    if (token && (role === 'admin' || role === 'superadmin')) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [token, role, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      toast({
        title: "Error",
        description: "Please enter both username/email and password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const resp = await passwordLogin(identifier, password);
      // Detailed role check: must be admin or superadmin
      if (resp.role === 'admin' || resp.role === 'superadmin') {
        toast({
          title: "Admin Authenticated",
          description: "Access granted to central control.",
        });
        navigate('/admin/dashboard', { replace: true });
      } else {
        // If not an admin, logout immediately to prevent session pollution
        await logout();
        toast({
          title: "Access Denied",
          description: "This portal is strictly for system administrators.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Login Failed",
        description: err.response?.data?.detail || "Invalid admin credentials.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout 
      title="System Board" 
      subtitle="Administrative authentication required for dashboard access."
    >
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="identifier">Admin Username or Email</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="identifier"
              type="text"
              placeholder="admin / admin@pandityatra.com"
              className="pl-10 h-12 rounded-xl border-gray-200 focus:ring-black"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Secret Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              className="pl-10 h-12 rounded-xl border-gray-200 focus:ring-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-12 bg-[#1A1A1A] hover:bg-black text-white rounded-xl font-bold transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg flex items-center justify-center gap-2"
          disabled={loading}
        >
          {loading ? <Loader2 className="animate-spin" size={24} /> : "System Access"}
        </Button>
        
        <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-4 text-center">
            <p className="text-xs text-gray-400 leading-relaxed uppercase tracking-[0.1em]">
                Secure Entry Node: admin_access_v1
            </p>
            <p className="text-[10px] text-gray-300">
                Unauthorized access is strictly prohibited and monitored.
            </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default AdminLoginPage;
