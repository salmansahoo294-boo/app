import React from "react";
import { PageShell } from "../components/PageShell";

export default function ShareEarn() {
  return (
    <PageShell title="Share & Earn" subtitle="Invite friends and earn commission.">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="text-xs uppercase tracking-widest text-white/50">Referral Commissions</div>
        <div className="mt-3 space-y-2 text-sm text-white/70">
          <div>• Har dawat pr Rs408</div>
          <div>• Har deposit 1%</div>
          <div>• Bet rebate 0.1%</div>
          <div>• Achievement Reward 44,880,000</div>
        </div>

        <div className="mt-5 text-xs text-white/45">
          Referral eligibility + anti-abuse checks are enforced automatically.
        </div>
      </div>
    </PageShell>
  );
}
