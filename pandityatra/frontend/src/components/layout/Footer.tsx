import React, { useState } from 'react';
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
  FaGithub
} from 'react-icons/fa';
import logo from '@/assets/images/logo.png';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Footer: React.FC = () => {
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
      { name: 'Puja Services', href: '/booking' },
      { name: 'Marriage Ceremonies', href: '/booking' },
      { name: 'Griha Pravesh', href: '/booking' },
      { name: 'Kundali Services', href: '/kundali' },
    ],
    company: [
      { name: 'About Us', href: '#' },
      { name: 'Contact', href: '#' },
      { name: 'Privacy Policy', href: '#' },
      { name: 'Terms of Service', href: '#' },
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
            <div className="flex items-center gap-3 group">
              <img 
                src={logo} 
                alt="PanditYatra Logo" 
                className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
              />
              <span className="text-xl font-bold text-primary transition-colors duration-300 group-hover:text-primary/80">
                PanditYatra
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your trusted platform for authentic puja services and spiritual guidance.
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
            <h3 className="font-semibold mb-4 text-foreground">Services</h3>
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
            <h3 className="font-semibold mb-4 text-foreground">Company</h3>
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
            <h3 className="font-semibold mb-4 text-foreground">Newsletter</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Subscribe to get updates on new services and offers.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-3">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
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
                    Subscribed successfully!
                  </AlertDescription>
                </Alert>
              )}
            </form>
            <div className="mt-6 space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 hover:text-primary transition-colors duration-300 group">
                <FaPhone className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>+977 98XXXXXXXX</span>
              </div>
              <div className="flex items-center gap-2 hover:text-primary transition-colors duration-300 group">
                <FaEnvelope className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>info@pandityatra.com.np</span>
              </div>
              <div className="flex items-center gap-2 hover:text-primary transition-colors duration-300 group">
                <FaMapMarkerAlt className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                <span>Kathmandu, Nepal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 PanditYatra. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


