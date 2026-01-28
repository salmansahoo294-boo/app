import React, { useEffect, useState } from "react";
import { PageShell } from "../components/PageShell";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/EmptyState";
import api from "../utils/api";

const typeLabel = (t) => {
  switch (t) {
    case "deposit":
      return "Deposit";
    case "withdrawal":
      return "Withdrawal";
    case "bet":
      return "Bet";
    case "win":
      return "Win";
    default:
      return t;
  }
};

export default function Transactions() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/user/transactions", { params: { limit: 50 } });
      setRows(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <PageShell title="Transactions" subtitle="Your wallet activity (PKR).">
      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : rows.length === 0 ? (
        <EmptyState title="No activity yet" description="Your deposits, withdrawals, bets and wins will show here." />
      ) : (
        <div className="space-y-3">
          {rows.map((t) => (
            <div key={t.id} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-white font-medium">{typeLabel(t.type)}</div>
                  <div className="text-xs text-white/45 mt-1">{new Date(t.created_at).toLocaleString()}</div>
                  {t.description ? <div className="text-sm text-white/60 mt-2">{t.description}</div> : null}
                </div>
                <div className="text-right">
                  <div className="font-numbers text-white">PKR {Number(t.amount || 0).toLocaleString()}</div>
                  <div className="text-xs text-white/50 capitalize mt-1">{t.status}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
