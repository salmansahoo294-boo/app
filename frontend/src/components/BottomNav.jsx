import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Gift, Share2, Award, LayoutDashboard } from "lucide-react";

const items = [
  { icon: Home, label: "Home", path: "/home", testId: "nav-home" },
  { icon: Gift, label: "Promotion", path: "/promotion", testId: "nav-promotion" },
  { icon: Share2, label: "Share", path: "/share", testId: "nav-share" },
  { icon: Award, label: "Rewards", path: "/rewards", testId: "nav-rewards" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard", testId: "nav-dashboard" },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-4 left-4 right-4 bg-obsidian-paper/90 backdrop-blur-xl border border-white/10 rounded-full p-2 shadow-2xl z-50"
      data-testid="bottom-navigation"
    >
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              data-testid={item.testId}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                isActive ? "text-gold" : "text-white/55 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-[11px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
