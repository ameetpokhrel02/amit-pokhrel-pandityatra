import React, { useState } from 'react';
import { Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
    LayoutDashboard,
    User,
    Settings,
    LogOut,
    Menu,
    X,
    Calendar,
    Wallet,
    BookOpen,
    DollarSign,
    Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/images/PanditYatralogo.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogoutConfirmationDialog } from '@/components/common/LogoutConfirmationDialog';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { Bell } from 'lucide-react';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userRole?: 'user' | 'pandit' | 'admin';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole = 'user' }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const { unreadCount } = useNotifications();

    // Define navigation items based on role
    const navItems = {
        user: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
            { icon: Calendar, label: 'My Bookings', path: '/my-bookings' },
            { icon: User, label: 'Profile', path: '/profile' },
            { icon: BookOpen, label: 'Kundali', path: '/dashboard?tab=kundali' },
        ],
        pandit: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/pandit/dashboard' },
            { icon: User, label: 'My Profile', path: '/pandit/profile' },
            { icon: BookOpen, label: 'Services', path: '/pandit/services' },
            { icon: Calendar, label: 'Bookings', path: '/pandit/bookings' },
            { icon: Wallet, label: 'Earnings', path: '/pandit/earnings' },
        ],
        admin: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
            { icon: Users, label: 'Users', path: '/admin/users' },
            { icon: AlertTriangle, label: 'Pandit Verification', path: '/admin/pandits' },
            { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
            { icon: BookOpen, label: 'Services', path: '/admin/services' },
            { icon: Package, label: 'Inventory (Samagri)', path: '/admin/inventory' },
            { icon: Wallet, label: 'Payments', path: '/admin/payments' },
            { icon: DollarSign, label: 'Payouts', path: '/admin/payouts' }, // Added Payouts
            { icon: Settings, label: 'Settings', path: '/admin/settings' },
        ]
    };

    const currentNavItems = navItems[userRole as keyof typeof navItems] || navItems.user;

    const handleLogoutClick = () => {
        setShowLogoutDialog(true);
    };

    const handleLogoutConfirm = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Mobile Sidebar Overlay */}
            <div className="md:hidden">
                {/* Mobile Header */}
                <div className="fixed top-0 left-0 right-0 h-16 bg-background border-b z-30 flex items-center justify-between px-4">
                    <div className="flex items-center gap-2">
                        <img
                            src={logo}
                            alt="PanditYatra"
                            className="h-8 w-auto object-contain"
                        />
                        <span className="font-bold text-lg text-primary">PanditYatra</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="relative mr-1"
                            onClick={() => setIsNotificationOpen(true)}
                        >
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 h-4 w-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                            {isSidebarOpen ? <X /> : <Menu />}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Sidebar */}
            <AnimatePresence>
                {(isSidebarOpen || window.innerWidth >= 768) && (
                    <motion.aside
                        initial={{ x: -250 }}
                        animate={{ x: 0 }}
                        exit={{ x: -250 }}
                        transition={{ duration: 0.2 }}
                        className={`
                    fixed md:sticky top-0 left-0 h-screen w-64 bg-background border-r shadow-sm z-40
                    flex flex-col
                    ${isSidebarOpen ? 'block' : 'hidden md:block'}
                `}
                    >
                        {/* Logo Area - Clickable to Home */}
                        <Link to="/" className="h-16 flex items-center gap-3 px-6 border-b hover:bg-orange-50 transition-colors group">
                            <img
                                src={logo}
                                alt="PanditYatra"
                                className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                            />
                            <span className="text-2xl font-bold text-primary group-hover:text-orange-600 transition-colors">
                                PanditYatra
                            </span>
                        </Link>

                        {/* Navigation Links */}
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {currentNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link
                                        to={item.path}
                                        key={item.path}
                                        onClick={() => {
                                            // Close mobile sidebar after navigation
                                            if (window.innerWidth < 768) {
                                                setIsSidebarOpen(false);
                                            }
                                        }}
                                    >
                                        <div className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                    ${isActive
                                                ? 'bg-orange-50 text-primary font-medium'
                                                : 'text-gray-600 hover:bg-orange-50 hover:text-gray-900'}
                                `}>
                                            <Icon size={20} />
                                            <span>{item.label}</span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Footer Area */}
                        <div className="p-4 border-t bg-orange-50/50">
                            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                                <Avatar className="w-10 h-10 border-2 border-white shadow-sm ring-1 ring-orange-100">
                                    <AvatarImage src={user?.profile_pic} />
                                    <AvatarFallback className="bg-orange-100 text-orange-600 font-bold">
                                        {user?.full_name?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user?.full_name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleLogoutClick}
                            >
                                <LogOut size={20} className="mr-2" />
                                Logout
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 overflow-auto pt-16 md:pt-0 bg-[#FDFCFB]">
                {/* Desktop Top Header (Hidden on sidebars/mobile) */}
                <div className="hidden md:flex sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b px-8 py-3 items-center justify-end gap-4 h-16">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="relative text-gray-500 hover:text-primary transition-colors"
                        onClick={() => setIsNotificationOpen(true)}
                    >
                        <Bell className="h-5 w-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 h-4 w-4 bg-orange-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                    <div className="h-6 w-px bg-gray-200 mx-2" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 capitalize px-2 py-1 bg-gray-100 rounded-md">
                            {userRole} Mode
                        </span>
                    </div>
                </div>

                {/* Mobile Header (repeated for content area if needed, but sticky handled above) */}
                <div className="md:hidden sticky top-0 z-20 bg-background border-b px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <img
                            src={logo}
                            alt="PanditYatra"
                            className="h-6 w-auto object-contain"
                        />
                        <span className="font-bold text-primary">PanditYatra</span>
                    </div>
                    <Link to="/" className="text-sm text-primary hover:underline">
                        ← Home
                    </Link>
                </div>

                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Logout Confirmation Dialog */}
            <LogoutConfirmationDialog
                open={showLogoutDialog}
                onOpenChange={setShowLogoutDialog}
                onConfirm={handleLogoutConfirm}
            />
            {/* Notification Center Sidebar */}
            <NotificationCenter 
                isOpen={isNotificationOpen} 
                onClose={() => setIsNotificationOpen(false)} 
            />
        </div>
    );
};
