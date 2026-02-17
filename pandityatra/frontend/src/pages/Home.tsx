
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
  ShopByCategory
} from '@/components/home';
import PanchangWidget from '@/components/panchang/PanchangWidget';

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

      {/* Daily Panchang & Guidance */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1">
              <PanchangWidget />
            </div>
            <div className="md:col-span-2 space-y-6">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3 h-3" />
                Spiritual Alignment
              </div>
              <h2 className="text-4xl font-black text-[#3E2723] tracking-tight leading-tight">
                Align Your Actions with <br />
                <span className="text-orange-600">Cosmic Rhythms</span>
              </h2>
              <p className="text-lg text-[#3E2723]/70 font-medium max-w-xl">
                Stay connected with the ancient wisdom of the Nepali Panchang. From tithi to auspicious muhurats, our calendar guides you through your daily spiritual journey.
              </p>
              <div className="flex gap-4">
                <Button className="bg-[#FF6F00] hover:bg-[#E65100] text-white rounded-full px-8 py-6 h-auto font-bold text-base shadow-lg hover:shadow-orange-400/40 transition-all duration-300 transform hover:-translate-y-1">
                  Book Special Puja
                </Button>
                <Link to="/calendar">
                  <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50 rounded-full px-8 py-6 h-auto font-bold text-base transition-transform hover:-translate-y-1">
                    Explore Calendar
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

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

      {/* App Download Section */}
      <AppDownloadSection />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default HomePage;