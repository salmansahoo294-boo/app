import React, { useEffect, useState } from "react";
import { PageShell } from "../components/PageShell";
import { userAPI } from "../utils/api";
import { Skeleton } from "../components/ui/skeleton";

export default function VipLevel() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const p = await userAPI.getProfile();
        setProfile(p.data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <PageShell title="VIP Level" subtitle="Your current VIP status.">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
        <div className="text-xs uppercase tracking-widest text-white/50">VIP</div>
        {loading ? (
          <Skeleton className="mt-3 h-10 w-32" />
        ) : (
          <div className="mt-2 font-numbers text-3xl text-white">Level {profile?.vip_level || 0}</div>
        )}
      </div>
    </PageShell>
  );
}
