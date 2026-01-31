import React from "react";
import { BrandMark } from "./BrandMark";
import { WalletHeader } from "./WalletHeader";
import { SideMenu } from "./SideMenu";
import { useAuth } from "../context/AuthContext";

export const PageShell = ({ title, subtitle, children, rightSlot }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-obsidian pb-28">
      <header className="sticky top-0 z-40 border-b border-white/5 bg-obsidian/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {user ? <SideMenu /> : null}
              <BrandMark />
            </div>

            <div className="flex items-center gap-2">
              {user ? <WalletHeader /> : null}
              {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
            </div>
          </div>

          {(title || subtitle) && (
            <div className="mt-5">
              {title ? (
                <h1 className="font-primary text-lg md:text-xl text-white">{title}</h1>
              ) : null}
              {subtitle ? (
                <p className="text-sm text-white/60 mt-1">{subtitle}</p>
              ) : null}
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 md:px-8 py-6">{children}</main>
    </div>
  );
};
