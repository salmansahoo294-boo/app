import React from "react";
import { BrandMark } from "./BrandMark";

export const LoadingScreen = ({ label = "Loading…" }) => {
  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
        <div className="flex justify-center">
          <BrandMark />
        </div>
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div className="h-full w-1/2 shimmer" />
        </div>
        <div className="mt-4 text-sm text-white/60">{label}</div>
      </div>
    </div>
  );
};
