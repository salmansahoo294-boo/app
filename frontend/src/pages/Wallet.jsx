import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userAPI, paymentAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell } from '../components/PageShell';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';

const WalletStatusIcon = ({ status }) => {
  switch (status) {
import { wageringAPI } from '../utils/api';

    case 'pending':
      return <Clock className="w-4 h-4 text-warning" />;
    case 'approved':
      return <CheckCircle className="w-4 h-4 text-neon-green" />;
    case 'rejected':
      return <XCircle className="w-4 h-4 text-neon-red" />;
    default:
      return null;
  }
};

export default function Wallet() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'balance';

  const [balance, setBalance] = useState(null);
  const [wagering, setWagering] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [depositForm, setDepositForm] = useState({ amount: '', jazzcash_number: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', jazzcash_number: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [balanceRes, wageringRes, depositsRes, withdrawalsRes] = await Promise.all([
        userAPI.getWalletBalance(),
        wageringAPI.status(),
        paymentAPI.getDeposits({ limit: 20 }),
        paymentAPI.getWithdrawals({ limit: 20 }),
      ]);
      setBalance(balanceRes.data);
      setWagering(wageringRes.data);
      setDeposits(depositsRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast.error('Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await paymentAPI.createDeposit(depositForm);
      toast.success('Deposit initiated successfully.');
      setDepositForm({ amount: '', jazzcash_number: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Deposit request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await paymentAPI.createWithdrawal(withdrawForm);
      toast.success('Withdrawal initiated successfully.');
      setWithdrawForm({ amount: '', jazzcash_number: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Withdrawal request failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageShell title="Wallet" subtitle="PKR is the default currency for all transactions.">
      <Tabs defaultValue={initialTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 rounded-full" data-testid="wallet-tabs">
          <TabsTrigger value="balance" data-testid="tab-balance">Balance</TabsTrigger>
          <TabsTrigger value="deposit" data-testid="tab-deposit">Deposit</TabsTrigger>
          <TabsTrigger value="withdraw" data-testid="tab-withdraw">Withdraw</TabsTrigger>
        </TabsList>

        {/* Balance Tab */}
        <TabsContent value="balance" className="space-y-4 mt-6">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
            <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-gold/15 via-transparent to-transparent" />
            <div className="relative">
              <div className="text-xs uppercase tracking-widest text-white/50">Wallet Balance</div>
              {loading ? (
                <Skeleton className="mt-3 h-10 w-64" />
              ) : (
                <div className="mt-2 font-numbers text-4xl text-white" data-testid="total-balance">
                  Rs {Number(balance?.wallet_balance || 0).toLocaleString()}
                </div>
              )}

              <div className="mt-4 text-sm text-white/55">
                Single wallet view (PKR).
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="font-primary text-white">Recent Deposits</div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : deposits.length === 0 ? (
                <EmptyState title="No deposits yet" description="Your deposits will appear here once processed." />
              ) : (
                deposits.slice(0, 5).map((deposit) => (
                  <div
                    key={deposit.id}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowDownCircle className="w-5 h-5 text-neon-green" />
                      <div>
                        <div className="text-white font-medium font-numbers">PKR {deposit.amount.toLocaleString()}</div>
                        <div className="text-white/50 text-xs">{new Date(deposit.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <WalletStatusIcon status={deposit.status} />
                      <span className="text-xs text-white/60 capitalize">{deposit.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <div className="font-primary text-white">Recent Withdrawals</div>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : withdrawals.length === 0 ? (
                <EmptyState title="No withdrawals yet" description="Your withdrawals will appear here once processed." />
              ) : (
                withdrawals.slice(0, 5).map((withdrawal) => (
                  <div
                    key={withdrawal.id}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <ArrowUpCircle className="w-5 h-5 text-gold" />
                      <div>
                        <div className="text-white font-medium font-numbers">PKR {withdrawal.amount.toLocaleString()}</div>
                        <div className="text-white/50 text-xs">{new Date(withdrawal.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <WalletStatusIcon status={withdrawal.status} />
                      <span className="text-xs text-white/60 capitalize">{withdrawal.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        {/* Deposit Tab */}
        <TabsContent value="deposit" className="mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <h3 className="font-primary text-white text-lg">Deposit</h3>
            <p className="text-sm text-white/60 mt-1">Enter details to top up your wallet (PKR).</p>

            <form onSubmit={handleDeposit} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount" className="text-white">Amount (PKR)</Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  min="100"
                  max="1000000"
                  required
                  value={depositForm.amount}
                  onChange={(e) => setDepositForm({ ...depositForm, amount: e.target.value })}
                  className="bg-black/40 border-white/10 text-white"
                  placeholder="Minimum 100"
                  data-testid="deposit-amount-input"
                />
                <div className="text-xs text-white/45">Min: PKR 100 • Max: PKR 1,000,000</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="deposit-jazzcash" className="text-white">JazzCash Number</Label>
                <Input
                  id="deposit-jazzcash"
                  type="tel"
                  required
                  value={depositForm.jazzcash_number}
                  onChange={(e) => setDepositForm({ ...depositForm, jazzcash_number: e.target.value })}
                  className="bg-black/40 border-white/10 text-white"
                  placeholder="03XX-XXXXXXX"
                  data-testid="deposit-jazzcash-input"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-gradient-to-r from-gold via-gold-400 to-gold-600 text-black font-bold py-6 hover:brightness-110"
                data-testid="submit-deposit-btn"
              >
                {submitting ? 'Submitting…' : 'Deposit Now'}
              </Button>

              <div className="text-xs text-white/45 text-center">
                Secure processing • Status updates will appear in your wallet history.
              </div>
            </form>
          </div>
        </TabsContent>

        {/* Withdraw Tab */}
        <TabsContent value="withdraw" className="mt-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <h3 className="font-primary text-white text-lg">Withdraw</h3>
            <p className="text-sm text-white/60 mt-1">Request withdrawal to your JazzCash account (PKR).</p>

            {wagering?.has_active_wagering ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-xs uppercase tracking-widest text-white/50">Wagering Required</div>
                <div className="mt-2 text-sm text-white/70">
                  Remaining wagering: <span className="font-numbers text-white">Rs {Number(wagering.remaining || 0).toLocaleString()}</span>
                </div>
                <div className="mt-2 text-xs text-white/45">Complete wagering requirements to withdraw.</div>
              </div>
            ) : null}

            <form onSubmit={handleWithdraw} className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount" className="text-white">Amount (PKR)</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  min="300"
                  max="30000"
                  required
                  value={withdrawForm.amount}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                  className="bg-black/40 border-white/10 text-white"
                  placeholder="Minimum 300"
                  data-testid="withdraw-amount-input"
                  disabled={!!wagering?.has_active_wagering}
                />
                <div className="text-xs text-white/45">Min: PKR 500 • Max: PKR 500,000</div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="withdraw-jazzcash" className="text-white">JazzCash Number</Label>
                <Input
                  id="withdraw-jazzcash"
                  type="tel"
                  required
                  value={withdrawForm.jazzcash_number}
                  onChange={(e) => setWithdrawForm({ ...withdrawForm, jazzcash_number: e.target.value })}
                  className="bg-black/40 border-white/10 text-white"
                  placeholder="03XX-XXXXXXX"
                  data-testid="withdraw-jazzcash-input"
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-white/5 border border-white/10 text-white font-bold py-6 hover:bg-white/10"
                data-testid="submit-withdraw-btn"
              >
                {submitting ? 'Submitting…' : 'Withdraw Now'}
              </Button>

              <div className="text-xs text-white/45 text-center">
                Secure processing • Status updates will appear in your wallet history.
              </div>
            </form>
          </div>
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}
