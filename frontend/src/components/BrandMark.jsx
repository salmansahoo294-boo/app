import React from "react";

export const BrandMark = ({ className = "" }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`} aria-label="WINPKRHUB">
      <div className="relative">
        <div className="font-primary font-bold tracking-tight uppercase leading-none">
          <span className="text-white">WIN</span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-400 to-gold-600">PKR</span>
        </div>
        <div className="font-primary font-semibold uppercase tracking-[0.35em] text-[10px] text-gold/80 mt-1 ml-[2px]">
          HUB
        </div>
      </div>
    </div>
  );
};
