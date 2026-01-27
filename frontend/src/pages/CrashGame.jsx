import React, { useEffect, useMemo, useState } from "react";
import { PageShell } from "../components/PageShell";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Slider } from "../components/ui/slider";
import { toast } from "sonner";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function CrashGame() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("200");
  const [cashout, setCashout] = useState(150); // 1.50x
  const [placing, setPlacing] = useState(false);
  const [balance, setBalance] = useState(null);
  const [lastRound, setLastRound] = useState(null);

  const cashoutMultiplier = useMemo(() => Number(cashout) / 100, [cashout]);

  const loadBalance = async () => {
    const res = await api.get("/user/wallet/balance");
    setBalance(res.data);
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const placeBet = async () => {
    const a = Number(amount);
    if (!a || a <= 0) {
      toast.error("Enter a valid bet amount");
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        amount: a,
        cashout_multiplier: cashoutMultiplier,
        client_seed: `u-${Date.now()}`,
        nonce: 1,
      };
      const res = await api.post("/games/crash/bet", payload);
      setLastRound(res.data);
      toast.success(res.data.status === "won" ? `You won PKR ${res.data.payout}` : "You lost this round");
      await loadBalance();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to place bet");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <PageShell
      title="Crash"
      subtitle="Provably fair (Phase 2): each round shows a server seed hash and reveal."
      rightSlot={
        <Button
          variant="secondary"
          className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
          onClick={() => navigate("/home")}
        >
          Back to Lobby
        </Button>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">Live Round</div>
              <div className="font-primary text-white text-lg mt-1">Instant settlement (Phase 2)</div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1">
              <ShieldCheck className="h-4 w-4 text-gold" />
              <span className="text-xs text-white/60">Secure Processing</span>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/30 p-8 text-center">
            <div className="text-white/60 text-sm">Last crash point</div>
            <div className="font-numbers text-5xl text-white mt-2">
              {lastRound ? `${lastRound.crash_point.toFixed(2)}x` : "—"}
            </div>
            <div className="mt-4 text-xs text-white/45">
              This is the Phase 2 placeholder UI. In Phase 3 we can add animated realtime flight.
            </div>
          </div>

          {lastRound ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-white/50">Provably Fair Proof</div>
              <div className="mt-2 grid grid-cols-1 gap-2 text-xs text-white/70 break-all">
                <div>
                  <span className="text-white/45">Server seed hash:</span> {lastRound.provably_fair.server_seed_hash}
                </div>
                <div>
                  <span className="text-white/45">Server seed (revealed):</span> {lastRound.provably_fair.server_seed}
                </div>
                <div>
                  <span className="text-white/45">Verify URL:</span> {lastRound.provably_fair.verify}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <div className="text-xs uppercase tracking-widest text-white/50">Balance</div>
            <div className="mt-2 font-numbers text-2xl text-white">PKR {Number(balance?.available_balance || 0).toLocaleString()}</div>
            <div className="mt-2 text-sm text-white/55">Pending: PKR {Number(balance?.locked_balance || 0).toLocaleString()}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <div className="font-primary text-white text-lg">Place Bet</div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-sm text-white/70">Bet amount (PKR)</div>
                <Input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min={50}
                  className="mt-2 bg-black/40 border-white/10 text-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-white/70">Auto cashout</div>
                  <div className="font-numbers text-white">{cashoutMultiplier.toFixed(2)}x</div>
                </div>
                <div className="mt-3">
                  <Slider
                    value={[cashout]}
                    onValueChange={(v) => setCashout(v[0])}
                    min={101}
                    max={500}
                    step={1}
                  />
                  <div className="mt-2 flex justify-between text-xs text-white/45">
                    <span>1.01x</span>
                    <span>5.00x</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={placeBet}
                disabled={placing}
                className="w-full rounded-full bg-gradient-to-r from-gold via-gold-400 to-gold-600 text-black font-bold py-6 hover:brightness-110"
                data-testid="crash-bet-btn"
              >
                {placing ? "Placing…" : "Place Bet"}
              </Button>

              <div className="text-xs text-white/45 text-center">
                Bets are settled instantly in Phase 2. Full realtime mode comes later.
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
