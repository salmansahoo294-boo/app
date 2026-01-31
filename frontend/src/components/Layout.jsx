import React from 'react';
import { useAuth } from '../context/AuthContext';
import { BottomNav } from './BottomNav';

const Layout = ({ children }) => {
  const { user, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-obsidian">
      <main className="pb-28">{children}</main>

      {/* Bottom Navigation (user only) */}
      {user && !isAdmin ? <BottomNav /> : null}
    </div>
  );
};

export default Layout;
