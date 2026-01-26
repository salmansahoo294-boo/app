import React from "react";

export const EmptyState = ({ title, description, action }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-center">
      <div className="font-primary text-lg text-white">{title}</div>
      {description ? <div className="mt-2 text-sm text-white/60">{description}</div> : null}
      {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
    </div>
  );
};
