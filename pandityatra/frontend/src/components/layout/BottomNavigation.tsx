import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Users, Calendar, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const spanVariants = {
  initial: { width: 0, opacity: 0 },
  animate: {
    width: "auto",
    opacity: 1,
    transition: { delay: 0.05, duration: 0.2, ease: "easeOut" as const },
  },
  exit: {
    width: 0,
    opacity: 0,
    transition: { duration: 0.1, ease: "easeIn" as const },
  },
};

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { token, user } = useAuth();

  const navItems = [
    {
      title: 'Home',
      icon: Home,
      path: '/',
    },
    {
      title: 'Pandits',
      icon: Users,
      path: '/pandits',
    },
    {
      title: 'Bookings',
      icon: Calendar,
      path: token ? '/my-bookings' : '/login',
    },
    {
      title: 'Shop',
      icon: ShoppingBag,
      path: '/shop/samagri',
    },
    {
      title: 'Profile',
      icon: User,
      path: token ? (user?.role === 'pandit' ? '/pandit/profile' : '/profile') : '/login',
    },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-3 pb-6 pt-2 md:hidden pointer-events-none">
      <div className="mx-auto w-full max-w-md bg-white/70 dark:bg-black/70 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-lg rounded-full px-1 py-1.5 flex items-center justify-around pointer-events-auto">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "relative z-10 flex items-center rounded-full transition-all duration-300 focus:outline-none",
                active ? "px-3 py-2 text-orange-600 dark:text-orange-400" : "px-2.5 py-2 text-slate-600 dark:text-slate-300"
              )}
            >
              {active && (
                <motion.div
                  layoutId="pill"
                  className="absolute inset-0 z-0 rounded-full bg-orange-500/15 dark:bg-orange-500/25 backdrop-blur-sm border border-orange-400/40 shadow-sm"
                  transition={{ type: "spring", stiffness: 500, damping: 40 }}
                />
              )}

              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-300", active && "scale-105")} />
                <AnimatePresence initial={false}>
                  {active && (
                    <motion.span
                      variants={spanVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="overflow-hidden whitespace-nowrap text-[11px] font-bold tracking-tight"
                    >
                      {item.title}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
