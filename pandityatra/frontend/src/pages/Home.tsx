
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