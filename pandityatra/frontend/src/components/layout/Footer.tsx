import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaLinkedin,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCheckCircle,
  FaYoutube,
  FaGithub,
  FaCreditCard,
  FaLock,
  FaWallet
} from 'react-icons/fa';
import { SiStripe } from 'react-icons/si';
import logo from '@/assets/images/PanditYatralogo.png';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setSubscribed(true);
      setEmail('');
      setLoading(false);
      setTimeout(() => setSubscribed(false), 3000);
    }, 1000);
  };

  const footerLinks = {
    services: [
      { name: t('puja_samagri'), href: '/shop/samagri' },
      { name: t('book_puja'), href: '/booking' },
      { name: t('footer.offline_kundali'), href: '/kundali' },
    ],
    company: [
      { name: t('about'), href: '/about' },
      { name: t('contact'), href: '/contact' },
      { name: t('footer.privacy_policy'), href: '/privacy' },
      { name: t('footer.terms_of_service'), href: '/terms' },
    ],
  };

  const socialLinks = [
    { icon: FaFacebook, href: '#', label: 'Facebook' },
    { icon: FaTwitter, href: '#', label: 'Twitter' },
    { icon: FaInstagram, href: '#', label: 'Instagram' },
    { icon: FaLinkedin, href: '#', label: 'LinkedIn' },
    { icon: FaYoutube, href: '#', label: 'YouTube' },
    { icon: FaGithub, href: '#', label: 'GitHub' },


  ];

  return (
    <footer className="border-t bg-muted/30 mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link
              to="/"
              className="flex items-center gap-3 group"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <img
                src={logo}
                alt="PanditYatra Logo"
                className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-xl font-bold text-primary transition-colors duration-300 group-hover:text-primary/80">
                PanditYatra
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t('footer.brand_desc')}
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, index) => {
                const Icon = social.icon;
                return (
                  <a
                    key={index}
                    href={social.href}
                    className="p-2 rounded-full bg-background hover:bg-primary hover:text-primary-foreground transition-all duration-300 transform hover:scale-110 hover:rotate-12"
                    aria-label={social.label}
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">{t('footer.services')}</h3>
            <ul className="space-y-2">
              {footerLinks.services.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 inline-block hover:translate-x-1 group"
                  >
                    <span className="relative">
                      {link.name}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">{t('footer.company')}</h3>
            <ul className="space-y-2">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 inline-block hover:translate-x-1 group"
                  >
                    <span className="relative">
                      {link.name}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter Column */}
          <div>
            <h3 className="font-semibold mb-4 text-foreground">{t('footer.newsletter')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('footer.newsletter_desc')}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t('footer.newsletter_placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 transition-all duration-300 focus:scale-105"
                  required
                  disabled={loading || subscribed}
                />
                <Button
                  type="submit"
                  disabled={loading || subscribed}
                  className="shrink-0 transition-all duration-300 hover:scale-110 hover:shadow-lg"
                >
                  {loading ? (
                    <span className="animate-pulse">...</span>
                  ) : subscribed ? (
                    <FaCheckCircle className="h-4 w-4 animate-in zoom-in" />
                  ) : (
                    <FaEnvelope className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {subscribed && (
                <Alert className="animate-in slide-in-from-top-2">
                  <FaCheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    {t('footer.subscribe_success')}
                  </AlertDescription>
                </Alert>
              )}
            </form>
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 hover:text-primary transition-colors duration-300 group">
                <FaPhone className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>+977 9847226995</span>
              </div>
              <Link to="/contact" className="flex items-center gap-2 hover:text-primary transition-colors duration-300 group">
                <FaEnvelope className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>pandityatra9@gmail.com</span>
              </Link>
              <div className="flex items-center gap-2 hover:text-primary transition-colors duration-300 group">
                <FaMapMarkerAlt className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>{t('footer.kathmandu_nepal')}</span>
              </div>
            </div>
          </div>
        </div>



        {/* Payment Methods */}
        <div className="border-t py-6">
          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <FaLock className="h-3 w-3" />
              {t('footer.encrypted_secured')}
            </p>
            <div className="flex items-center justify-center gap-4">
              {/* Khalti Payment */}
              <a
                href="https://khalti.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gradient-to-br from-purple-600 to-purple-700 hover:shadow-lg transition-all duration-300 transform hover:scale-110 hover:rotate-12"
                aria-label="Khalti Payment"
              >
                <FaWallet className="h-4 w-4 text-white" />
              </a>

              {/* Stripe Payment */}
              <a
                href="https://stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 hover:shadow-lg transition-all duration-300 transform hover:scale-110 hover:rotate-12"
                aria-label="Stripe Payment"
              >
                <SiStripe className="h-4 w-4 text-white" />
              </a>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <FaCreditCard className="h-3 w-3" />
              {t('footer.encrypted_secured')}
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 PanditYatra. {t('footer.all_rights_reserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


