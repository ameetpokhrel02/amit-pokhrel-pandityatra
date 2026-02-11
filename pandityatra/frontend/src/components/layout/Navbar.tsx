import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import logo from '@/assets/images/PanditYatralogo.png';
import { Search, Menu, ShoppingCart, User, LogOut, LayoutDashboard, Wallet, BookOpen, Home, MonitorDown, ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import LanguageSelector from './LanguageSelector';
import { usePWA } from '@/hooks/usePWA';
import MegaMenu from './MegaMenu';
import { fetchSamagriCategories, type SamagriCategory as CategoryType } from '@/lib/api';

const Navbar: React.FC = () => {
  const { t } = useTranslation();
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { items: cartItems, openDrawer: openCartDrawer } = useCart();
  const cartItemCount = cartItems.length;
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const { isInstallable, installPWA } = usePWA();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchSamagriCategories();
        setCategories(data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    };
    loadCategories();
  }, []);

  const performSearch = (query: string) => {
    if (!query.trim()) return;
    navigate(`/pandits?q=${encodeURIComponent(query.trim())}`);
    setIsSearchExpanded(false);
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performSearch(searchQuery);
    }
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setLogoutDialogOpen(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Shopping Bag Icon Component for consistency
  const ShoppingBagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>
  );

  // Common Navigation Items
  const navItems = [
    { name: t('home'), path: '/', icon: <Home className="w-4 h-4" /> },
    { name: t('about'), path: '/about', icon: <User className="w-4 h-4" /> },
    { name: 'Offline Kundali', path: '/kundali', icon: <BookOpen className="w-4 h-4" /> },
    {
      name: t('shop'),
      path: '/shop/samagri',
      icon: <ShoppingBagIcon />,
      hasMegaMenu: true
    },
    { name: t('contact'), path: '/contact', icon: <User className="w-4 h-4" /> },
  ];

  // Logout Confirmation Dialog Component
  const LogoutConfirmDialog = () => (
    <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
      <AlertDialogContent className="max-w-sm rounded-2xl p-6 text-center">
        {/* Mascot Image */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <img
              src="/src/assets/images/PanditYatralogo.png"
              alt="PanditYatra Mascot"
              className="w-24 h-24 object-contain"
            />
            <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center border-2 border-white">
              <span className="text-orange-500 text-lg">⚠️</span>
            </div>
          </div>
        </div>

        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-2xl font-bold text-gray-900 text-center">
            Logout?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-600 text-center">
            Are you sure you want to logout from<br />PanditYatra?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="flex flex-row gap-3 mt-6 sm:justify-center">
          <AlertDialogCancel className="flex-1 rounded-xl h-12 border-gray-200 hover:bg-gray-50">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleLogout}
            className="flex-1 rounded-xl h-12 bg-orange-500 hover:bg-orange-600 text-white font-medium"
          >
            Yes, Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <>
      <LogoutConfirmDialog />
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${scrolled
          ? 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm border-b border-orange-100'
          : 'bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm'
          }`}
      >
        <div className="container mx-auto px-4 h-20 flex items-center justify-between gap-4">
          {/* Left: Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0 group">
            <div className="relative w-10 h-10 lg:w-12 lg:h-12">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl group-hover:opacity-100 opacity-0 transition-opacity" />
              <img src={logo} alt="PanditYatra" className="w-full h-full object-contain relative z-10 transition-transform group-hover:scale-105" />
            </div>
            <span className="font-playfair font-bold text-xl lg:text-2xl text-orange-600 hidden sm:block">
              PanditYatra
            </span>
          </Link>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 items-center justify-end relative">
            <motion.div
              initial={false}
              animate={{
                width: isSearchExpanded ? '100%' : '40px',
                maxWidth: isSearchExpanded ? '600px' : '40px'
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative group"
            >
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors z-10 ${isSearchExpanded ? 'text-orange-500' : 'text-gray-500'
                  }`}
                onClick={() => setIsSearchExpanded(true)}
              />
              <Input
                placeholder={isSearchExpanded ? t('search_placeholder') : ""}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyPress}
                onFocus={() => setIsSearchExpanded(true)}
                onBlur={(e) => {
                  if (!e.relatedTarget?.classList.contains('search-clear')) {
                    setIsSearchExpanded(false);
                  }
                }}
                className={`pl-10 h-10 w-full bg-gray-100/50 dark:bg-gray-800/50 border-transparent focus:border-orange-200 focus:bg-white dark:focus:bg-gray-900 focus-visible:ring-orange-500 rounded-full transition-all cursor-pointer ${!isSearchExpanded ? 'placeholder:text-transparent' : ''
                  }`}
              />
              {isSearchExpanded && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="search-clear absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery('');
                    setIsSearchExpanded(false);
                  }}
                >
                  <LogOut className="w-4 h-4 rotate-90" /> {/* Mimicking a close/collapse icon if X isn't available, or just use X if I had it */}
                </motion.button>
              )}
            </motion.div>
          </div>

          {/* Right: Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Common Text Links */}
            {!isSearchExpanded && (
              <div
                className="relative flex items-center gap-1"
                onMouseLeave={() => setIsMegaMenuOpen(false)}
              >
                {navItems.map(item => (
                  <div
                    key={item.path}
                    className="relative py-2" // Added padding to increase hover area
                    onMouseEnter={() => {
                      if (item.hasMegaMenu) {
                        setIsMegaMenuOpen(true);
                      } else {
                        setIsMegaMenuOpen(false);
                      }
                    }}
                  >
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 ${isActive(item.path)
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50'
                        }`}
                    >
                      {item.icon}
                      <span>{item.name}</span>
                      {item.hasMegaMenu && <ChevronDown className={`w-3 h-3 transition-transform ${isMegaMenuOpen ? 'rotate-180' : ''}`} />}
                    </Link>
                  </div>
                ))}

                <AnimatePresence>
                  {isMegaMenuOpen && (
                    <div
                      className="absolute top-full right-0 mt-0 pt-2 z-50"
                      onMouseEnter={() => setIsMegaMenuOpen(true)}
                    >
                      <MegaMenu
                        categories={categories.filter(c => c.is_active)}
                        isOpen={isMegaMenuOpen}
                        onClose={() => setIsMegaMenuOpen(false)}
                      />
                    </div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
              <Link to="/booking">{t('find_pandit')}</Link>
            </Button>

            <LanguageSelector />

            {/* PWA Install Trigger (Desktop) */}
            {isInstallable && (
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-orange-50 text-orange-600"
                onClick={installPWA}
                title="Install PanditYatra App"
              >
                <MonitorDown className="w-5 h-5" />
              </Button>
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-orange-50 text-gray-700" onClick={openCartDrawer}>
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-600 hover:bg-orange-600 text-[10px]">
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* Auth / Profile */}
            {token && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 overflow-hidden border border-orange-200 hover:border-orange-300 transition-all">
                    <Avatar className="h-full w-full">
                      <AvatarImage src={user.profile_image} alt={user.full_name} />
                      <AvatarFallback className="bg-orange-100 text-orange-600 font-medium">
                        {user.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 shadow-xl border-orange-100">
                  <div className="flex items-center gap-3 p-2 mb-2 bg-gradient-to-br from-orange-50 to-white rounded-lg border border-orange-100/50">
                    <Avatar className="h-10 w-10 border border-white shadow-sm">
                      <AvatarImage src={user.profile_image} />
                      <AvatarFallback className="bg-orange-200 text-orange-700">
                        {user.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-semibold truncate text-gray-800">{user.full_name}</span>
                      <span className="text-xs text-gray-500 truncate">{user.email}</span>
                    </div>
                  </div>

                  <DropdownMenuSeparator className="bg-orange-100" />

                  {user.role === 'pandit' && (
                    <>
                      <DropdownMenuItem asChild className="focus:bg-orange-50 focus:text-orange-700">
                        <Link to="/pandit/dashboard" className="cursor-pointer gap-2">
                          <LayoutDashboard className="w-4 h-4" /> {t('dashboard')}
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="focus:bg-orange-50 focus:text-orange-700">
                        <Link to="/earnings" className="cursor-pointer gap-2">
                          <Wallet className="w-4 h-4" /> My Earnings
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-orange-100" />
                    </>
                  )}

                  {(user.role === 'admin' || user.is_superuser) && (
                    <DropdownMenuItem asChild className="focus:bg-purple-50 focus:text-purple-700">
                      <Link to="/admin/dashboard" className="cursor-pointer gap-2 text-purple-600 font-medium">
                        <LayoutDashboard className="w-4 h-4" /> Admin Panel
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem asChild className="focus:bg-orange-50 focus:text-orange-700">
                    <Link to="/my-bookings" className="cursor-pointer gap-2">
                      <BookOpen className="w-4 h-4" /> My Bookings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="focus:bg-orange-50 focus:text-orange-700">
                    <Link to="/profile" className="cursor-pointer gap-2">
                      <User className="w-4 h-4" /> {t('profile')}
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-orange-100" />

                  <DropdownMenuItem
                    onClick={() => setLogoutDialogOpen(true)}
                    className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer gap-2"
                  >
                    <LogOut className="w-4 h-4" /> {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="hover:text-orange-600 hover:bg-orange-50">
                  <Link to="/login">{t('login')}</Link>
                </Button>
                <Button asChild className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg">
                  <Link to="/register">{t('signup')}</Link>
                </Button>
              </div>
            )}
          </div>

          {/* Mobile View Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            {/* Mobile Cart */}
            <Button variant="ghost" size="icon" className="relative rounded-full" onClick={openCartDrawer}>
              <ShoppingCart className="w-5 h-5" />
              {cartItemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-600">
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-orange-50">
                  <Menu className="w-6 h-6 text-gray-700" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] sm:w-[350px] p-0 border-r-orange-100">
                <SheetHeader className="text-left border-b border-orange-100 p-6 bg-orange-50/30">
                  <SheetTitle className="flex items-center gap-2 font-playfair text-xl text-orange-600">
                    <img src={logo} alt="Logo" className="w-8 h-8" />
                    PanditYatra
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col h-[calc(100vh-80px)] overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {/* Mobile Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        placeholder="Search for pujas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearchKeyPress}
                        className="pl-10 h-12 bg-gray-50 border-orange-100 rounded-xl focus-visible:ring-orange-500"
                      />
                    </div>

                    <nav className="flex flex-col gap-1">
                      {navItems.map(item => (
                        <React.Fragment key={item.path}>
                          <Link
                            to={item.path}
                            className={`flex items-center justify-between px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${isActive(item.path)
                              ? 'bg-orange-100 text-orange-700'
                              : 'text-gray-600 hover:bg-orange-50'
                              }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-orange-500">{item.icon}</span>
                              {item.name}
                            </div>
                            {item.hasMegaMenu && <ChevronDown className="w-4 h-4 text-gray-400" />}
                          </Link>

                          {/* Mobile Submenu for Shop */}
                          {item.hasMegaMenu && (
                            <div className="grid grid-cols-2 gap-3 px-2 py-3 mt-1 mb-4 bg-orange-50/20 rounded-2xl border border-orange-100/30">
                              {categories.filter(c => c.is_active).map(cat => {
                                const IconComp = (LucideIcons as any)[cat.icon || 'Flower2'] || LucideIcons.Flower2;
                                return (
                                  <Link
                                    key={cat.id}
                                    to={`/shop/samagri?category=${cat.slug}`}
                                    className="flex flex-col items-center justify-center p-4 rounded-xl bg-white dark:bg-gray-800 border border-orange-100 shadow-sm transition-all hover:bg-orange-50 active:scale-95 group"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                                      <IconComp className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 text-center uppercase tracking-tight line-clamp-1">
                                      {t(`categories.${cat.slug}.name`, cat.name)}
                                    </span>
                                  </Link>
                                );
                              })}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </nav>

                    <Button asChild className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg shadow-orange-200 font-bold">
                      <Link to="/booking" className="flex items-center justify-center gap-2">
                        <User className="w-4 h-4" />
                        {t('find_my_pandit', 'Find My Pandit')}
                      </Link>
                    </Button>

                    {token && user ? (
                      <div className="border-t border-orange-100 pt-6 mt-2 space-y-4">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-2">{t('account_portal', 'Account Portal')}</p>
                        <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                          <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                            <AvatarImage src={user.profile_image} />
                            <AvatarFallback className="bg-orange-200 text-orange-700 font-bold">{user.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold truncate text-gray-900">{user.full_name}</span>
                            <span className="text-[10px] text-gray-500 truncate font-medium">{user.email}</span>
                          </div>
                        </div>

                        <div className="grid gap-1">
                          {user.role === 'pandit' && (
                            <Link to="/pandit/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-orange-50 text-gray-700">
                              <LayoutDashboard className="w-4 h-4 text-orange-500" /> Dashboard
                            </Link>
                          )}
                          {(user.role === 'admin' || user.is_superuser) && (
                            <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-purple-600 hover:bg-purple-50">
                              <LayoutDashboard className="w-4 h-4" /> Admin Panel
                            </Link>
                          )}
                          <Link to="/my-bookings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium hover:bg-orange-50 text-gray-700">
                            <BookOpen className="w-4 h-4 text-orange-500" /> My Bookings
                          </Link>
                          <button
                            onClick={() => setLogoutDialogOpen(true)}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 text-left transition-colors"
                          >
                            <LogOut className="w-4 h-4" /> Logout
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-t border-orange-100 pt-6 mt-2 flex flex-col gap-3">
                        <Button asChild variant="outline" className="w-full h-12 rounded-xl border-orange-200 text-orange-700 hover:bg-orange-50 font-bold">
                          <Link to="/login">Sign In</Link>
                        </Button>
                        <Button asChild className="w-full h-12 rounded-xl bg-gray-900 text-white hover:bg-black font-bold shadow-lg">
                          <Link to="/register">Create Account</Link>
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto p-8 text-center text-[10px] text-gray-400 font-medium">
                    PanditYatra v1.0 • Built for Sacred Connection
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;