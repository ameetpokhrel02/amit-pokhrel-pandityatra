import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import logo from '@/assets/images/logo.png';
import { 
  FaUser, 
  FaSignOutAlt, 
  FaShoppingCart, 
  FaBars, 
  FaTimes,
  FaChevronDown 
} from 'react-icons/fa';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

const Navbar: React.FC = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { items: cartItems, openDrawer } = useCart();
  const cartItemCount = cartItems.length;

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navigationLinks = [
    { name: 'Home', href: '/' },
    { name: 'Find Pandits', href: '/booking' },
    { name: 'Puja Categories', href: '/categories' },
    { name: 'Kundali', href: '/kundali' },
    { name: 'About', href: '/about' },
  ];

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo and Brand */}
          <Link 
            to="/" 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-300 group"
          >
            <img 
              src={logo} 
              alt="PanditYatra Logo" 
              className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
            />
            <h1 className="text-2xl font-bold text-primary transition-colors duration-300 group-hover:text-primary/80">
              PanditYatra
            </h1>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navigationLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.href} 
                className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors duration-300 relative group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            {/* Shopping Cart */}
            <Button
              variant="ghost"
              size="sm"
              className="relative transition-all duration-300 hover:scale-105"
              onClick={() => openDrawer()}
              aria-label="Open cart"
            >
              <FaShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs animate-pulse"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* Auth Section */}
            {token ? (
              <div className="hidden md:flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    >
                      <FaUser className="h-4 w-4" />
                      <span className="max-w-[120px] truncate">
                        {user?.full_name || 'User'}
                      </span>
                      <FaChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="w-full">
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="w-full">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/bookings" className="w-full">
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={handleLogout}
                      className="text-destructive focus:text-destructive"
                    >
                      <FaSignOutAlt className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-3">
                <Link to="/login">
                  <Button 
                    variant="ghost" 
                    className="transition-all duration-300 hover:scale-105"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button 
                    className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden transition-all duration-300 hover:scale-105"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <FaTimes className="h-5 w-5" />
              ) : (
                <FaBars className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-2 mt-4">
              {navigationLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-all duration-300"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* Mobile Auth Section */}
              <div className="border-t mt-2 pt-2">
                {token ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-md transition-all duration-300 flex items-center gap-2"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FaUser className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-all duration-300 flex items-center gap-2"
                    >
                      <FaSignOutAlt className="h-4 w-4" />
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="flex gap-2 px-4">
                    <Link to="/login" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button variant="ghost" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/register" className="flex-1" onClick={() => setIsMobileMenuOpen(false)}>
                      <Button className="w-full">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;