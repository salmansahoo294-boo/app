import React from "react";
import { PageShell } from "../components/PageShell";

export default function Language() {
  return (
    <PageShell title="Language" subtitle="Language options.">
      <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 text-sm text-white/70">
        English (default)
      </div>
    </PageShell>
  );
}
