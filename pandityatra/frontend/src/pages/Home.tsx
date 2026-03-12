
import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  HeroSection,
  FeaturedPandits,
  PujaCategories,
  HowItWorks,
  KundaliHighlight,
  AppDownloadSection,
  ShopByCategory,
  PanchangHighlight,
  ReviewsSection
} from '@/components/home';
import PanchangWidget from '@/components/panchang/PanchangWidget';

const HomePage: React.FC = () => {
  const { token, role } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in admin/pandit users to their dashboards
  useEffect(() => {
    if (token && role) {
      if (role === 'admin' || role === 'superadmin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (role === 'pandit') {
        navigate('/pandit/dashboard', { replace: true });
      }
    }
  }, [token, role, navigate]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Sticky Navigation */}
      <Navbar />

      {/* Hero Section */}
      <HeroSection />

      {/* Daily Panchang & Guidance */}
      <PanchangHighlight />

      {/* Featured/Top-Rated Pandits */}
      <FeaturedPandits />

      {/* Shop By Category Section */}
      <ShopByCategory />

      {/* Popular Puja Categories */}
      <PujaCategories />

      {/* How It Works */}
      <HowItWorks />

      {/* Kundali Highlight */}
      <KundaliHighlight />

      {/* Reviews & Ratings */}
      <ReviewsSection />

      {/* App Download Section */}
      <AppDownloadSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;