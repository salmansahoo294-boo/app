import React, { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { gamesAPI } from "../utils/api";
import { toast } from "sonner";

const NumberField = ({ id, label, value, onChange, hint }) => {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-white">{label}</Label>
      <Input
        id={id}
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-black/40 border-white/10 text-white"
      />
      {hint ? <div className="text-xs text-white/45">{hint}</div> : null}
    </div>
  );
};

export const AdminSettingsDialog = ({ open, onOpenChange, onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [raw, setRaw] = useState(null);

  const [depositMin, setDepositMin] = useState("300");
  const [depositMax, setDepositMax] = useState("50000");
  const [withdrawMin, setWithdrawMin] = useState("300");
  const [withdrawMax, setWithdrawMax] = useState("30000");
  const [dailyBetLimit, setDailyBetLimit] = useState("100000");
  const [crashEnabled, setCrashEnabled] = useState(true);
  const [crashMinBet, setCrashMinBet] = useState("50");
  const [crashMaxBet, setCrashMaxBet] = useState("50000");
  const [crashHouseEdgePct, setCrashHouseEdgePct] = useState("3");

  const dirty = useMemo(() => {
    if (!raw) return false;
    const next = {
      deposit_min: Number(depositMin),
      deposit_max: Number(depositMax),
      withdraw_min: Number(withdrawMin),
      withdraw_max: Number(withdrawMax),
      daily_bet_limit: Number(dailyBetLimit),
      crash_enabled: !!crashEnabled,
      crash_min_bet: Number(crashMinBet),
      crash_max_bet: Number(crashMaxBet),
      crash_house_edge: Number(crashHouseEdgePct) / 100,
    };

    return Object.keys(next).some((k) => String(next[k]) !== String(raw[k]));
  }, [raw, depositMin, depositMax, withdrawMin, withdrawMax, dailyBetLimit, crashEnabled, crashMinBet, crashMaxBet, crashHouseEdgePct]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await gamesAPI.getAdminSettings();
      setRaw(res.data);

      setDepositMin(String(res.data.deposit_min ?? 300));
      setDepositMax(String(res.data.deposit_max ?? 50000));
      setWithdrawMin(String(res.data.withdraw_min ?? 300));
      setWithdrawMax(String(res.data.withdraw_max ?? 30000));
      setDailyBetLimit(String(res.data.daily_bet_limit ?? 100000));
      setCrashEnabled(!!res.data.crash_enabled);
      setCrashMinBet(String(res.data.crash_min_bet ?? 50));
      setCrashMaxBet(String(res.data.crash_max_bet ?? 50000));
      setCrashHouseEdgePct(String(Math.round((Number(res.data.crash_house_edge ?? 0.03) * 100 + Number.EPSILON) * 100) / 100));
    } catch (e) {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        deposit_min: Number(depositMin),
        deposit_max: Number(depositMax),
        withdraw_min: Number(withdrawMin),
        withdraw_max: Number(withdrawMax),
        daily_bet_limit: Number(dailyBetLimit),
        crash_enabled: !!crashEnabled,
        crash_min_bet: Number(crashMinBet),
        crash_max_bet: Number(crashMaxBet),
        crash_house_edge: Number(crashHouseEdgePct) / 100,
      };
      await gamesAPI.updateAdminSettings(payload);
      toast.success("Settings updated");
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-obsidian-paper border border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Platform Settings</DialogTitle>
          <DialogDescription className="text-white/60">
            PKR defaults, transaction limits, and Crash game controls.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-sm text-white/60">Loading…</div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="text-xs uppercase tracking-widest text-white/50">Wallet limits (PKR)</div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField id="depositMin" label="Deposit min" value={depositMin} onChange={setDepositMin} />
                <NumberField id="depositMax" label="Deposit max" value={depositMax} onChange={setDepositMax} />
                <NumberField id="withdrawMin" label="Withdraw min" value={withdrawMin} onChange={setWithdrawMin} />
                <NumberField id="withdrawMax" label="Withdraw max" value={withdrawMax} onChange={setWithdrawMax} />
                <NumberField
                  id="dailyBetLimit"
                  label="Daily betting limit (per user)"
                  value={dailyBetLimit}
                  onChange={setDailyBetLimit}
                  hint="Safeguard to prevent abuse"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-widest text-white/50">Crash game</div>
                  <div className="text-sm text-white/60 mt-1">Enable/disable and tune edge/limits</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/60">Enabled</span>
                  <Switch checked={crashEnabled} onCheckedChange={setCrashEnabled} />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberField id="crashMinBet" label="Crash min bet" value={crashMinBet} onChange={setCrashMinBet} />
                <NumberField id="crashMaxBet" label="Crash max bet" value={crashMaxBet} onChange={setCrashMaxBet} />
                <NumberField
                  id="crashHouseEdge"
                  label="House edge (%)"
                  value={crashHouseEdgePct}
                  onChange={setCrashHouseEdgePct}
                  hint="Default 3%. Higher edge increases long-term profitability."
                />
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="secondary"
            className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
          <Button
            onClick={save}
            disabled={loading || saving || !dirty}
            className="rounded-full bg-gradient-to-r from-gold via-gold-400 to-gold-600 text-black font-bold hover:brightness-110"
            data-testid="admin-save-settings"
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
