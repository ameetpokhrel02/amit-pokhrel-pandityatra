import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
import { Search, Menu, ShoppingCart, User, LogOut, LayoutDashboard, Wallet, BookOpen, Home } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

const Navbar: React.FC = () => {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const { items: cartItems, openDrawer: openCartDrawer } = useCart();
  const cartItemCount = cartItems.length;
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

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
    { name: 'Home', path: '/', icon: <Home className="w-4 h-4" /> },
    { name: 'Offline Kundali', path: '/kundali', icon: <BookOpen className="w-4 h-4" /> },
    { name: 'Shop', path: '/shop/samagri', icon: <ShoppingBagIcon /> },
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
          <div className="hidden md:flex flex-1 max-w-md mx-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search pandits or occasions..."
              className="pl-10 h-10 bg-gray-50/50 border-orange-200/50 focus-visible:ring-orange-500 rounded-full"
            />
          </div>

          {/* Right: Actions */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Common Text Links */}
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-full transition-colors ${isActive(item.path)
                  ? 'text-orange-600 bg-orange-50'
                  : 'text-gray-600 hover:text-orange-600 hover:bg-orange-50/50'
                  }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}

            <Button asChild className="bg-orange-600 hover:bg-orange-700 text-white rounded-full px-6 shadow-md hover:shadow-lg transition-all">
              <Link to="/booking">Find Pandit</Link>
            </Button>

            <LanguageSelector />

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
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
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
                      <User className="w-4 h-4" /> Profile
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-orange-100" />

                  <DropdownMenuItem
                    onClick={() => setLogoutDialogOpen(true)}
                    className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer gap-2"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild className="hover:text-orange-600 hover:bg-orange-50">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="bg-gray-900 text-white hover:bg-gray-800 rounded-lg">
                  <Link to="/register">Sign Up</Link>
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
                <Button variant="ghost" size="icon">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[350px]">
                <SheetHeader className="text-left border-b pb-4 mb-4">
                  <SheetTitle className="flex items-center gap-2 font-playfair text-orange-600">
                    <img src={logo} alt="Logo" className="w-8 h-8" />
                    PanditYatra
                  </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-4">
                  {/* Mobile Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input placeholder="Search..." className="pl-10 bg-gray-50" />
                  </div>

                  <div className="flex flex-col gap-2">
                    {navItems.map(item => (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive(item.path) ? 'bg-orange-50 text-orange-600' : 'hover:bg-gray-50'
                          }`}
                      >
                        {item.icon}
                        {item.name}
                      </Link>
                    ))}
                    <Link
                      to="/booking"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium bg-orange-600 text-white shadow-sm mt-2"
                    >
                      <User className="w-4 h-4" />
                      Find Pandit
                    </Link>
                  </div>

                  {token && user ? (
                    <div className="border-t pt-4 mt-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase px-4 mb-2">Account</p>
                      <div className="flex items-center gap-3 px-4 mb-4">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.profile_image} />
                          <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.full_name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </div>

                      {user.role === 'pandit' && (
                        <Link to="/pandit/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                      )}
                      {user.role === 'user' && (
                        <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50">
                          <LayoutDashboard className="w-4 h-4" /> Dashboard
                        </Link>
                      )}
                      {(user.role === 'admin' || user.is_superuser) && (
                        <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-purple-600 hover:bg-purple-50">
                          <LayoutDashboard className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <Link to="/my-bookings" className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium hover:bg-gray-50">
                        <BookOpen className="w-4 h-4" /> My Bookings
                      </Link>
                      <button
                        onClick={() => setLogoutDialogOpen(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 text-left"
                      >
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  ) : (
                    <div className="border-t pt-4 mt-2 flex flex-col gap-2">
                      <Button asChild variant="outline" className="w-full justify-start">
                        <Link to="/login">Login</Link>
                      </Button>
                      <Button asChild className="w-full justify-start bg-orange-600 hover:bg-orange-700">
                        <Link to="/register">Sign Up</Link>
                      </Button>
                    </div>
                  )}
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