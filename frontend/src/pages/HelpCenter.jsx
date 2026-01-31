import React from "react";
import { PageShell } from "../components/PageShell";

export default function HelpCenter() {
  return (
    <PageShell title="Help Center" subtitle="Support and common questions.">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-3 text-sm text-white/70">
        <div className="font-primary text-white">FAQs</div>
        <div>• Deposits and withdrawals are shown as Secure Processing.</div>
        <div>• Withdrawals are blocked until wagering requirements are completed.</div>
        <div>• If your account is frozen, contact support.</div>
      </div>
    </PageShell>
  );
}
