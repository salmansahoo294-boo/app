import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Gamepad2, Wallet, User, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Layout = ({ children }) => {
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const userNavItems = [
    { icon: Home, label: 'Home', path: '/home', testId: 'nav-home' },
    { icon: Gamepad2, label: 'Games', path: '/home#games', testId: 'nav-games' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', testId: 'nav-wallet' },
    { icon: User, label: 'Profile', path: '/profile', testId: 'nav-profile' },
  ];

  const adminNavItems = [
    { icon: Shield, label: 'Admin', path: '/admin', testId: 'nav-admin' },
    { icon: Home, label: 'Home', path: '/home', testId: 'nav-home' },
    { icon: Wallet, label: 'Wallet', path: '/wallet', testId: 'nav-wallet' },
    { icon: User, label: 'Profile', path: '/profile', testId: 'nav-profile' },
  ];

  const navItems = isAdmin ? adminNavItems : userNavItems;

  return (
    <div className="min-h-screen bg-obsidian">
      <main className="pb-20">{children}</main>
      
      {/* Bottom Navigation */}
      {user && (
        <nav 
          className="fixed bottom-0 left-0 right-0 bg-obsidian/90 backdrop-blur-xl border-t border-white/10 z-50"
          data-testid="bottom-navigation"
        >
          <div className="flex justify-around items-center h-16 max-w-md mx-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             (item.path.includes('#') && location.pathname === item.path.split('#')[0]);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={item.testId}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                    isActive
                      ? 'text-gold-500'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <item.icon className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
};

export default Layout;
