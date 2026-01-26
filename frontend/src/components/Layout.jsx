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
      <main className="pb-28">{children}</main>

      {/* Bottom Navigation */}
      {user && (
        <nav
          className="fixed bottom-4 left-4 right-4 bg-obsidian-paper/90 backdrop-blur-xl border border-white/10 rounded-full p-2 shadow-2xl z-50"
          data-testid="bottom-navigation"
        >
          <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
            {navItems.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path.includes('#') && location.pathname === item.path.split('#')[0]);

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  data-testid={item.testId}
                  className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                    isActive ? 'text-gold' : 'text-white/55 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mb-1" />
                  <span className="text-[11px] font-medium">{item.label}</span>
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
