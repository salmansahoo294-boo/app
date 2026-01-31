import React from "react";
import { PageShell } from "../components/PageShell";
import { EmptyState } from "../components/EmptyState";

export default function RewardCenter() {
  return (
    <PageShell title="Reward Center" subtitle="Your rewards and achievements.">
      <EmptyState title="No rewards available" description="Rewards will appear here once you unlock them." />
    </PageShell>
  );
}
