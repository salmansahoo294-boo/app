import React, { useMemo, useState } from "react";
import { PageShell } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";

const PROMOS = [
  {
    key: "first_deposit_108",
    title: "First Deposit Bonus 108%",
    subtitle: "Lifetime first deposit bonus",
    hero: "Rs 108+ bonus on first deposit",
    highlight: ["Applies only on your first deposit", "Bonus wagering: 35x"],
    details: [
      "This bonus applies ONLY on the first deposit (lifetime).",
      "Bonus amount depends on your deposit range.",
      "Wagering requirement applies before withdrawals.",
    ],
  },
  {
    key: "share_earn",
    title: "Share & Earn",
    subtitle: "Referral commissions",
    hero: "Earn with referrals",
    highlight: [
      "Har dawat pr Rs408",
      "Har deposit 1%",
      "3 lvl bet commission (0.1% rebate)",
      "Achievement Reward 44,880,000",
    ],
    details: [
      "Referral rewards are credited automatically after eligibility conditions are met.",
      "Rewards follow the same wagering rules as other bonuses.",
    ],
  },
  {
    key: "app_download",
    title: "App Download Bonus",
    subtitle: "Lucky Red Packet",
    hero: "APP DOWNLOAD LUCKY RED PACKET Rs 4,999",
    highlight: ["System auto bonus Rs33–Rs43", "One-time per real user/device"],
    details: [
      "Eligible only for first-time users on a device.",
      "System auto-credits a random amount between Rs33 and Rs43.",
    ],
  },
  {
    key: "daily_first_deposit_8",
    title: "Daily 8% First Deposit Bonus",
    subtitle: "Once per day",
    hero: "8% bonus on your first deposit of the day",
    highlight: ["Optional on first deposit", "Bonus wagering: 35x"],
    details: [
      "Only ONE bonus per user per calendar day (Pakistan time).",
      "Applies only on the first deposit of the day.",
    ],
  },
];

const PromoCard = ({ promo, onOpen }) => {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
      <div className="text-xs uppercase tracking-widest text-white/50">Promotion</div>
      <div className="mt-2 font-primary text-white text-lg">{promo.title}</div>
      <div className="text-sm text-white/60 mt-1">{promo.subtitle}</div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="text-white font-medium">{promo.hero}</div>
        <div className="mt-3 space-y-1 text-sm text-white/70">
          {promo.highlight.map((h) => (
            <div key={h}>• {h}</div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button
          onClick={() => onOpen(promo)}
          className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
          data-testid={`promo-more-${promo.key}`}
        >
          More info
        </Button>
      </div>
    </div>
  );
};

export default function Promotion() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(null);

  const list = useMemo(() => PROMOS, []);

  const onOpen = (p) => {
    setActive(p);
    setOpen(true);
  };

  return (
    <PageShell title="Promotion" subtitle="Latest offers and bonuses.">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {list.map((p) => (
          <PromoCard key={p.key} promo={p} onOpen={onOpen} />
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-obsidian-paper border border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">{active?.title}</DialogTitle>
            <DialogDescription className="text-white/60">{active?.subtitle}</DialogDescription>
          </DialogHeader>

          <div className="space-y-2 text-sm text-white/70">
            {(active?.details || []).map((d) => (
              <div key={d}>• {d}</div>
            ))}
          </div>

          {active?.key === "share_earn" ? (
            <div className="mt-4 text-xs text-white/45">
              Referral logic and detailed terms will be enforced server-side.
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
