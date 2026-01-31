import React, { useEffect, useState } from "react";
import { PageShell } from "../components/PageShell";
import { Skeleton } from "../components/ui/skeleton";
import { userAPI, wageringAPI } from "../utils/api";

export default function UserDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [wagering, setWagering] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [s, w] = await Promise.all([userAPI.getStats(), wageringAPI.status()]);
        setStats(s.data);
        setWagering(w.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PageShell title="Dashboard" subtitle="Account overview (PKR).">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="text-xs uppercase tracking-widest text-white/50">Wagering</div>
          {loading ? (
            <Skeleton className="mt-3 h-10 w-48" />
          ) : (
            <div className="mt-2 text-sm text-white/70">
              Remaining: <span className="font-numbers text-white">Rs {Number(wagering?.remaining || 0).toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="text-xs uppercase tracking-widest text-white/50">Today</div>
          {loading ? (
            <Skeleton className="mt-3 h-10 w-48" />
          ) : (
            <div className="mt-3 space-y-1 text-sm text-white/70">
              <div>Total Bets: Rs {Number(stats?.total_bets || 0).toLocaleString()}</div>
              <div>Total Wins: Rs {Number(stats?.total_wins || 0).toLocaleString()}</div>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
