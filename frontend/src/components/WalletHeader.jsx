import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { userAPI } from "../utils/api";

export const WalletHeader = () => {
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await userAPI.getWalletBalance();
        setBalance(res.data);
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-2">
        <Wallet className="h-4 w-4 text-gold" />
        <span className="font-numbers text-sm text-white" data-testid="wallet-top-balance">
          Rs {Number(balance?.wallet_balance || 0).toLocaleString()}
        </span>
      </div>

      <Button
        onClick={() => navigate("/wallet?tab=deposit")}
        className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
        data-testid="wallet-top-deposit"
        title="Deposit"
      >
        <ArrowDownCircle className="h-4 w-4 text-gold" />
      </Button>
      <Button
        onClick={() => navigate("/wallet?tab=withdraw")}
        className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
        data-testid="wallet-top-withdraw"
        title="Withdraw"
      >
        <ArrowUpCircle className="h-4 w-4 text-gold" />
      </Button>
    </div>
  );
};
