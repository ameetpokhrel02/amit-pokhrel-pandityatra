
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import {
  HeroSection,
  FeaturedPandits,
  PujaCategories,
  HowItWorks,
  KundaliHighlight,
  AppDownloadSection
} from '@/components/home';

const HomePage: React.FC = () => {
  const { token, role } = useAuth();
  const navigate = useNavigate();

  // Redirect logged-in admin/pandit users to their dashboards
  useEffect(() => {
    if (token && role) {
      if (role === 'admin') {
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

      {/* Featured/Top-Rated Pandits */}
      <FeaturedPandits />

      {/* Popular Puja Categories */}
      <PujaCategories />

      {/* How It Works */}
      <HowItWorks />

      {/* Kundali Highlight */}
      <KundaliHighlight />

      {/* App Download Section */}
      <AppDownloadSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;