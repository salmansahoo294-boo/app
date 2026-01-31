import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet";
import { Button } from "./ui/button";
import {
  Menu,
  Home,
  Gift,
  Share2,
  Award,
  LayoutDashboard,
  Wallet,
  Crown,
  HelpCircle,
  Languages,
  FileText,
  LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const SideMenu = ({ trigger }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const items = useMemo(
    () => [
      { label: "Home", to: "/home", icon: Home },
      { label: "Promotion", to: "/promotion", icon: Gift },
      { label: "Share & Earn", to: "/share", icon: Share2 },
      { label: "Reward Center", to: "/rewards", icon: Award },
      { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
      { label: "Deposit", to: "/wallet?tab=deposit", icon: Wallet },
      { label: "Withdraw", to: "/wallet?tab=withdraw", icon: Wallet },
      { label: "VIP Level", to: "/vip", icon: Crown },
      { label: "Help Center", to: "/help", icon: HelpCircle },
      { label: "Language", to: "/language", icon: Languages },
      { label: "T&Cs", to: "/terms", icon: FileText },
    ],
    []
  );

  const defaultTrigger = (
    <Button
      variant="secondary"
      className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
      data-testid="open-side-menu"
    >
      <Menu className="h-4 w-4 text-gold" />
    </Button>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>{trigger || defaultTrigger}</SheetTrigger>
      <SheetContent side="left" className="bg-obsidian-paper border-white/10 w-[300px]">
        <SheetHeader>
          <SheetTitle className="text-white">Menu</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-1">
          {items.map((it) => {
            const active = location.pathname === it.to || (it.to.includes("?") && location.pathname === it.to.split("?")[0]);
            const Icon = it.icon;
            return (
              <Link
                key={it.label}
                to={it.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors ${
                  active ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 text-gold" />
                <span className="text-sm">{it.label}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
          <Button
            onClick={() => logout()}
            variant="destructive"
            className="w-full rounded-xl"
            data-testid="side-logout"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
