import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import logo from '@/assets/images/PanditYatralogo.png';
import {
  FaUser,
  FaSignOutAlt,
  FaShoppingCart,
  FaRegHeart,
  FaBars,
  FaTimes,
  FaChevronDown,
  FaHome,
  FaBook,
  FaStar,
  FaInfoCircle
} from 'react-icons/fa';
import { useFavorites } from '@/hooks/useFavorites';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LogoutConfirmationDialog } from '@/components/common/LogoutConfirmationDialog';

const Navbar: React.FC = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { items: cartItems, openDrawer: openCartDrawer } = useCart();
  const { items: favoriteItems, openDrawer: openFavoritesDrawer } = useFavorites();
  const cartItemCount = cartItems.length;
  const favoritesCount = favoriteItems.length;

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  const navigationLinks = [
    { name: 'Home', href: '/', icon: <FaHome className="w-4 h-4" /> },
    { name: 'Find Pandits', href: '/booking', icon: <FaUser className="w-4 h-4" /> },
    { name: 'Puja Categories', href: '/shop/pujas', icon: <FaStar className="w-4 h-4" /> },
    { name: 'Kundali', href: '/kundali', icon: <FaBook className="w-4 h-4" /> },
    { name: 'About', href: '/about', icon: <FaInfoCircle className="w-4 h-4" /> },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-lg border-b border-orange-100/20' 
          : 'bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="container mx-auto px-4 lg:px-6">
        <div className="flex justify-between items-center h-16 lg:h-20">
          {/* Logo and Brand */}
          <Link
            to="/"
            className="flex items-center gap-3 hover:opacity-90 transition-all duration-300 group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <img
                src={logo}
                alt="PanditYatra Logo"
                className="h-10 lg:h-12 w-auto object-contain transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 relative z-10"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent transition-all duration-300">
                PanditYatra
              </h1>
              <p className="text-xs text-muted-foreground -mt-1">Your Spiritual Journey</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navigationLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 flex items-center gap-2 group ${
                  isActiveRoute(link.href)
                    ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/30'
                    : 'text-gray-700 dark:text-gray-200 hover:text-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-950/20'
                }`}
              >
                <span className="opacity-70 group-hover:opacity-100 transition-opacity">{link.icon}</span>
                <span>{link.name}</span>
                {isActiveRoute(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"></span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2 lg:gap-3">
            {/* Favorites */}
            <button
              className="relative p-2 lg:p-2.5 rounded-full hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-300 group"
              onClick={() => openFavoritesDrawer()}
              aria-label="Open favorites"
            >
              <FaRegHeart className="h-5 w-5 text-gray-700 dark:text-gray-200 group-hover:text-orange-600 group-hover:scale-110 transition-all duration-300" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-lg animate-pulse">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Shopping Cart */}
            <button
              className="relative p-2 lg:p-2.5 rounded-full hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-300 group"
              onClick={() => openCartDrawer()}
              aria-label="Open cart"
            >
              <FaShoppingCart className="h-5 w-5 text-gray-700 dark:text-gray-200 group-hover:text-orange-600 group-hover:scale-110 transition-all duration-300" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-[10px] font-bold bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full shadow-lg animate-pulse">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Auth Section */}
            {token ? (
              <div className="hidden md:flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:shadow-lg hover:scale-105 group">
                      <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                        <FaUser className="h-4 w-4" />
                      </div>
                      <span className="max-w-[120px] truncate font-medium">
                        {user?.full_name || 'User'}
                      </span>
                      <FaChevronDown className="h-3 w-3 group-hover:rotate-180 transition-transform duration-300" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-orange-100/20 shadow-xl">
                    <div className="px-3 py-2 border-b border-orange-100/20">
                      <p className="text-sm font-medium">{user?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="w-full cursor-pointer">
                        <FaUser className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="w-full cursor-pointer">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/bookings" className="w-full cursor-pointer">
                        My Bookings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLogoutClick}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      <FaSignOutAlt className="h-4 w-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <button className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-orange-600 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-300">
                    Login
                  </button>
                </Link>
                <Link to="/register">
                  <button className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:shadow-lg hover:scale-105">
                    Sign Up
                  </button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-300"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <FaTimes className="h-6 w-6 text-gray-700 dark:text-gray-200" />
              ) : (
                <FaBars className="h-6 w-6 text-gray-700 dark:text-gray-200" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div 
          className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
            isMobileMenuOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <nav className="flex flex-col gap-1 py-4 border-t border-orange-100/20 mt-4">
            {navigationLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isActiveRoute(link.href)
                    ? 'text-orange-600 bg-orange-50 dark:bg-orange-950/30'
                    : 'text-gray-700 dark:text-gray-200 hover:text-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-950/20'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}

            {/* Mobile Auth Section */}
            <div className="border-t border-orange-100/20 mt-3 pt-3 space-y-2">
              {token ? (
                <>
                  <div className="px-4 py-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg mb-3">
                    <p className="text-sm font-medium text-orange-600">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-orange-600 hover:bg-orange-50/50 dark:hover:bg-orange-950/20 rounded-lg transition-all duration-300"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FaUser className="h-4 w-4" />
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogoutClick}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all duration-300"
                  >
                    <FaSignOutAlt className="h-4 w-4" />
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 px-4">
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-orange-600 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all duration-300">
                      Login
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    <button className="w-full px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:shadow-lg">
                      Sign Up
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        onConfirm={handleLogoutConfirm}
      />
    </header>
  );
};

export default Navbar;