import React from "react";
import { PageShell } from "../components/PageShell";

export default function Terms() {
  return (
    <PageShell title="T&Cs" subtitle="Terms & conditions.">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-sm text-white/70 space-y-2">
        <div>• 18+ only. Play responsibly.</div>
        <div>• Deposits, withdrawals and bonuses are subject to secure processing.</div>
        <div>• Wagering requirements apply before withdrawals.</div>
      </div>
    </PageShell>
  );
}
