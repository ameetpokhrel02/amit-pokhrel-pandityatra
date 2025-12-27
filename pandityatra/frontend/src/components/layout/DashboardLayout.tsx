import React, { useState } from 'react';
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
    BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userRole?: 'user' | 'pandit' | 'admin';
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole = 'user' }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Define navigation items based on role
    const navItems = {
        user: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
            { icon: Calendar, label: 'My Bookings', path: '/dashboard/bookings' },
            { icon: User, label: 'Profile', path: '/dashboard/profile' },
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
            { icon: User, label: 'Users', path: '/admin/users' },
            { icon: Settings, label: 'Settings', path: '/admin/settings' },
        ]
    };

    const currentNavItems = navItems[userRole as keyof typeof navItems] || navItems.user;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Mobile Sidebar Overlay */}
            <div className="md:hidden">
                {/* Mobile Header */}
                <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b z-30 flex items-center justify-between px-4">
                    <div className="font-bold text-xl text-primary">PanditYatra</div>
                    <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                        {isSidebarOpen ? <X /> : <Menu />}
                    </Button>
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
                    fixed md:sticky top-0 left-0 h-screen w-64 bg-white border-r shadow-sm z-40
                    flex flex-col
                    ${isSidebarOpen ? 'block' : 'hidden md:block'}
                `}
                    >
                        {/* Logo Area */}
                        <div className="h-16 flex items-center px-6 border-b">
                            <span className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                                PanditYatra
                            </span>
                        </div>

                        {/* Navigation Links */}
                        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                            {currentNavItems.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path;
                                return (
                                    <Link to={item.path} key={item.path}>
                                        <div className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                    ${isActive
                                                ? 'bg-orange-50 text-primary font-medium'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
                                `}>
                                            <Icon size={20} />
                                            <span>{item.label}</span>
                                        </div>
                                    </Link>
                                )
                            })}
                        </nav>

                        {/* Footer Area */}
                        <div className="p-4 border-t bg-gray-50">
                            <div className="flex items-center gap-3 px-4 py-3 mb-2">
                                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {user?.full_name?.[0] || 'U'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user?.full_name}</p>
                                    <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleLogout}
                            >
                                <LogOut size={20} className="mr-2" />
                                Logout
                            </Button>
                        </div>
                    </motion.aside>
                )}
            </AnimatePresence>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 overflow-auto pt-16 md:pt-0">
                <div className="p-4 md:p-8 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
};
