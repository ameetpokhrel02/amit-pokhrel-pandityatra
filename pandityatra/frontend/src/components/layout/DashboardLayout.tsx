import React, { useState, useEffect } from 'react';
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
    Package,
    MessageCircle,
    Megaphone,
    Bell,
    Heart,
    ShoppingCart,
    ClipboardList,
    ChevronDown,
    Store,
    Receipt,
    Star,
    MessageSquareHeart,
    Crown,
    FileText,
    Shield,
    Bot,
    PlayCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import logo from '@/assets/images/PanditYatralogo.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogoutConfirmationDialog } from '@/components/common/LogoutConfirmationDialog';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useToast } from '@/hooks/use-toast';
import { fetchUnreadChatCount } from '@/lib/api';

interface DashboardLayoutProps {
    children: React.ReactNode;
    userRole?: 'user' | 'pandit' | 'admin' | 'vendor';
}

interface NavItem {
    icon: any;
    label: string;
    path: string;
    children?: NavItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, userRole = 'user' }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [showLogoutDialog, setShowLogoutDialog] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [expandedItems, setExpandedItems] = useState<string[]>(() => {
        const expanded: string[] = [];
        // Auto-expand Marketplace if we're on a marketplace sub-tab
        if (location.search.includes('tab=marketplace')) expanded.push('Marketplace');
        if (location.search.includes('tab=purchases')) expanded.push('My Purchases');
        // Auto-expand admin sidebar items based on path
        if (location.pathname.includes('/admin/pandits') || location.pathname.includes('/admin/pandits-list')) expanded.push('Pandits');
        if (location.pathname.includes('/admin/vendors') || location.pathname.includes('/admin/vendors-list')) expanded.push('Vendors');
        if (location.pathname.includes('/admin/inventory') || location.pathname.includes('/admin/services')) expanded.push('Inventory');
        return expanded;
    });

    const toggleExpanded = (label: string) => {
        setExpandedItems(prev =>
            prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
        );
    };

    // Chat unread count polling
    useEffect(() => {
        if (!user) return;
        
        const loadUnreadCount = async () => {
            try {
                const count = await fetchUnreadChatCount();
                setUnreadCount(count);
            } catch (err) {
                // Silently ignore poll errors
            }
        };

        loadUnreadCount();
        const intervalId = setInterval(loadUnreadCount, 30000); // 30s
        return () => clearInterval(intervalId);
    }, [user]);

    // Real-time WebSocket for Admin Bug Report notifications
    useEffect(() => {
        if (!user || (user.role !== 'admin' && !user.is_superuser)) return;

        const token = localStorage.getItem('access_token');
        if (!token) return;

        const wsProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsHost = import.meta.env.VITE_API_URL 
            ? new URL(import.meta.env.VITE_API_URL).host 
            : window.location.host;
        const wsUrl = `${wsProtocol}://${wsHost}/ws/admin/notifications/?token=${token}`;

        let ws: WebSocket;
        try {
            ws = new WebSocket(wsUrl);
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'NEW_BUG_REPORT') {
                    toast({
                        title: '🐛 New Bug Report',
                        description: data.payload?.message || 'A new bug has been reported.',
                        className: 'bg-red-600 text-white border-none shadow-2xl',
                    });
                }
            };
            ws.onerror = () => { /* silently fail */ };
        } catch {
            // WebSocket connection failed silently
        }

        return () => {
            if (ws) ws.close();
        };
    }, [user]);

    // Auto-expand when URL changes
    useEffect(() => {
        if (location.search.includes('tab=marketplace') && !expandedItems.includes('Marketplace')) {
            setExpandedItems(prev => [...prev, 'Marketplace']);
        }
        if (location.search.includes('tab=purchases') && !expandedItems.includes('My Purchases')) {
            setExpandedItems(prev => [...prev, 'My Purchases']);
        }
        if ((location.pathname.includes('/admin/pandits') || location.pathname.includes('/admin/pandits-list')) && !expandedItems.includes('Pandits')) {
            setExpandedItems(prev => [...prev, 'Pandits']);
        }
        if ((location.pathname.includes('/admin/vendors') || location.pathname.includes('/admin/vendors-list')) && !expandedItems.includes('Vendors')) {
            setExpandedItems(prev => [...prev, 'Vendors']);
        }
        if ((location.pathname.includes('/admin/inventory') || location.pathname.includes('/admin/services')) && !expandedItems.includes('Inventory')) {
            setExpandedItems(prev => [...prev, 'Inventory']);
        }
    }, [location.pathname, location.search]);

    // Define navigation items based on role
    const navItems = {
        user: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
            { icon: Calendar, label: 'My Bookings', path: '/my-bookings' },
            { icon: PlayCircle, label: 'My Recordings', path: '/my-bookings?tab=recordings' },
            { icon: Store, label: 'Marketplace', path: '/dashboard?tab=marketplace', children: [
                { icon: ShoppingCart, label: 'My Cart', path: '/dashboard?tab=marketplace&sub=cart' },
                { icon: Heart, label: 'My Favorites', path: '/dashboard?tab=marketplace&sub=favorites' },
                { icon: ClipboardList, label: 'My Orders', path: '/dashboard?tab=marketplace&sub=orders' },
            ]},
            { icon: Receipt, label: 'My Purchases', path: '/dashboard?tab=purchases', children: [
                { icon: Calendar, label: 'Booking History', path: '/dashboard?tab=purchases&sub=bookings' },
                { icon: Package, label: 'Shop Orders', path: '/dashboard?tab=purchases&sub=shop-orders' },
            ]},
            { icon: MessageCircle, label: 'Messages', path: '/messages' },
            { icon: User, label: 'Profile', path: '/profile' },
            { icon: Bot, label: 'AI Preferences', path: '/profile?tab=ai-preferences' },
            { icon: BookOpen, label: 'Kundali', path: '/dashboard?tab=kundali' },
            { icon: AlertTriangle, label: 'Report Bug', path: '/report-bug' },
        ],
        pandit: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/pandit/dashboard' },
            { icon: User, label: 'My Profile', path: '/pandit/profile' },
            { icon: BookOpen, label: 'My Services', path: '/pandit/services' },
            { icon: Calendar, label: 'Calendar', path: '/pandit/calendar' },
            { icon: ClipboardList, label: 'Bookings', path: '/pandit/bookings' },
            { icon: Package, label: 'Shop Orders', path: '/pandit/dashboard?tab=orders' },
            { icon: MessageCircle, label: 'Messages', path: '/pandit/messages' },
            { icon: Wallet, label: 'Earnings', path: '/pandit/earnings' },
            { icon: Star, label: 'Reviews', path: '/pandit/reviews' },
            { icon: MessageSquareHeart, label: 'App Feedback', path: '/pandit/app-feedback' },
            { icon: AlertTriangle, label: 'Report Bug', path: '/pandit/report-bug' },
        ],
        admin: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
            { icon: Users, label: 'Users', path: '/admin/users' },
            { icon: User, label: 'Pandits', path: '/admin/pandits-list', children: [
                { icon: Users, label: 'All Pandits', path: '/admin/pandits-list' },
                { icon: AlertTriangle, label: 'Verification', path: '/admin/pandits' },
            ]},
            { icon: Store, label: 'Vendors', path: '/admin/vendors-list', children: [
                { icon: Users, label: 'All Vendors', path: '/admin/vendors-list' },
                { icon: Shield, label: 'Verification', path: '/admin/vendors-verification' },
            ]},
            { icon: Calendar, label: 'Bookings', path: '/admin/bookings' },
            { icon: Package, label: 'Inventory', path: '/admin/inventory', children: [
                { icon: Package, label: 'Samagri', path: '/admin/inventory' },
                { icon: BookOpen, label: 'Services', path: '/admin/services' },
            ]},
            { icon: Wallet, label: 'Payments', path: '/admin/payments' },
            { icon: DollarSign, label: 'Payouts', path: '/admin/payouts' },
            { icon: Star, label: 'Reviews', path: '/admin/reviews' },
            { icon: FileText, label: 'Site Content', path: '/admin/site-content' },
            { icon: Megaphone, label: 'Banners', path: '/admin/banners' },
            { icon: MessageCircle, label: 'Support Enquiries', path: '/admin/support' },
            { icon: AlertTriangle, label: 'Error Logs', path: '/admin/error-logs' },
            { icon: Menu, label: 'Activity Logs', path: '/admin/activity-logs' },
            // Manage Admins — only visible if superadmin (injected below)
            { icon: Settings, label: 'Settings', path: '/admin/settings' },
            { icon: User, label: 'My Profile', path: '/admin/profile' },
            { icon: AlertTriangle, label: 'Bug Reports', path: '/admin/bugs' },
        ],
        vendor: [
            { icon: LayoutDashboard, label: 'Dashboard', path: '/vendor/dashboard' },
            { icon: Package, label: 'My Products', path: '/vendor/products' },
            { icon: ClipboardList, label: 'Shop Orders', path: '/vendor/orders' },
            { icon: Wallet, label: 'Earnings', path: '/vendor/payouts' },
            { icon: User, label: 'Shop Profile', path: '/vendor/profile' },
            { icon: MessageCircle, label: 'Messages', path: '/vendor/messages' },
            { icon: Settings, label: 'Settings', path: '/vendor/settings' },
            { icon: AlertTriangle, label: 'Report Bug', path: '/vendor/report-bug' },
        ]
    };

    // Inject "Manage Admins" for superadmin only
    const actualRole = user?.role;
    let currentNavItems: NavItem[] = navItems[userRole as keyof typeof navItems] || navItems.user;
    if (userRole === 'admin' && actualRole === 'superadmin') {
        // Insert "Manage Admins" before Settings
        const settingsIdx = currentNavItems.findIndex(item => item.label === 'Settings');
        const manageAdminsItem: NavItem = { icon: Crown, label: 'Manage Admins', path: '/admin/manage-admins' };
        if (settingsIdx !== -1) {
            currentNavItems = [...currentNavItems];
            currentNavItems.splice(settingsIdx, 0, manageAdminsItem);
        } else {
            currentNavItems = [...currentNavItems, manageAdminsItem];
        }
    }

    const handleLogoutClick = () => {
        setShowLogoutDialog(true);
    };

    const handleLogoutConfirm = () => {
        const userName = user?.full_name?.split(' ')[0] || 'there';
        const roleLabel = userRole === 'pandit' ? 'Pandit' : userRole === 'vendor' ? 'Vendor' : userRole === 'admin' ? 'Admin' : 'User';
        logout();
        toast({
            title: `Goodbye, ${userName}! 🙏`,
            description: `You've been logged out of your ${roleLabel} account. See you soon!`,
            variant: 'default',
        });
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
                        <NotificationDropdown />
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
                        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                            {currentNavItems.map((item: NavItem) => {
                                const Icon = item.icon;
                                const hasChildren = item.children && item.children.length > 0;
                                const isExpanded = expandedItems.includes(item.label);
                                // Extract the tab param from the item path for matching
                                const itemTabParam = new URLSearchParams(item.path.split('?')[1] || '').get('tab');
                                const currentTabParam = new URLSearchParams(location.search).get('tab');
                                const isParentActive = item.path.includes('?')
                                    ? itemTabParam === currentTabParam
                                    : location.pathname === item.path;
                                const isDirectActive = item.path.includes('?')
                                    ? location.pathname + location.search === item.path
                                    : location.pathname === item.path;

                                return (
                                    <div key={item.path}>
                                        {/* Parent item */}
                                        {hasChildren ? (
                                            <button
                                                className={`
                                                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                                    ${isParentActive
                                                        ? 'bg-orange-50 text-primary font-medium'
                                                        : 'text-gray-600 hover:bg-orange-50 hover:text-gray-900'}
                                                `}
                                                onClick={() => {
                                                    toggleExpanded(item.label);
                                                    if (!isExpanded) {
                                                        navigate(item.path);
                                                    }
                                                }}
                                            >
                                                <Icon size={20} />
                                                <span className="flex-1 text-left">{item.label}</span>
                                                <ChevronDown
                                                    size={16}
                                                    className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                />
                                            </button>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                onClick={() => {
                                                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                                                }}
                                            >
                                                <div className={`
                                                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                                                    ${isDirectActive
                                                        ? 'bg-orange-50 text-primary font-medium'
                                                        : 'text-gray-600 hover:bg-orange-50 hover:text-gray-900'}
                                                `}>
                                                    <Icon size={20} />
                                                    <span>{item.label}</span>
                                                    {item.label === 'Messages' && unreadCount > 0 && (
                                                        <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-in zoom-in">
                                                            {unreadCount > 99 ? '99+' : unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>
                                        )}

                                        {/* Children with tree-style lines */}
                                        {hasChildren && (
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="ml-5 pl-4 border-l-2 border-orange-200 mt-1 space-y-0.5">
                                                            {item.children!.map((child: NavItem, idx: number) => {
                                                                const ChildIcon = child.icon;
                                                                const isChildActive = location.pathname + location.search === child.path;
                                                                const isLast = idx === item.children!.length - 1;
                                                                return (
                                                                    <Link
                                                                        to={child.path}
                                                                        key={child.path}
                                                                        onClick={() => {
                                                                            if (window.innerWidth < 768) setIsSidebarOpen(false);
                                                                        }}
                                                                    >
                                                                        <div className={`
                                                                            relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm
                                                                            ${isChildActive
                                                                                ? 'bg-orange-50 text-primary font-medium'
                                                                                : 'text-gray-500 hover:bg-orange-50/60 hover:text-gray-800'}
                                                                        `}>
                                                                            {/* Tree branch line */}
                                                                            <div className="absolute -left-4 top-1/2 w-3 h-px bg-orange-200" />
                                                                            <ChildIcon size={16} />
                                                                            <span>{child.label}</span>
                                                                        </div>
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        )}
                                    </div>
                                );
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
                                    <p className="text-xs text-gray-500 capitalize">{actualRole === 'superadmin' ? 'Super Admin' : userRole}</p>
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
            <main 
                id="dashboard-main-content" 
                className={cn(
                    "flex-1 min-w-0 pt-16 md:pt-0 bg-[#FDFCFB]",
                    location.pathname.includes('/messages') ? "overflow-hidden h-screen" : "overflow-auto"
                )}
            >
                {/* Desktop Top Header (Hidden on sidebars/mobile) */}
                <div className="hidden md:flex sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b px-8 py-3 items-center justify-end gap-4 h-16">
                    <NotificationDropdown />
                    <div className="h-6 w-px bg-gray-200 mx-2" />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 capitalize px-2 py-1 bg-gray-100 rounded-md">
                            {actualRole === 'superadmin' ? 'Super Admin' : userRole} Mode
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
        </div>
    );
};
