import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { userAPI, paymentAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ArrowDownCircle, ArrowUpCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const Wallet = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'balance';
  
  const [balance, setBalance] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [depositForm, setDepositForm] = useState({ amount: '', jazzcash_number: '' });
  const [withdrawForm, setWithdrawForm] = useState({ amount: '', jazzcash_number: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceRes, depositsRes, withdrawalsRes] = await Promise.all([
        userAPI.getWalletBalance(),
        paymentAPI.getDeposits({ limit: 20 }),
        paymentAPI.getWithdrawals({ limit: 20 }),
      ]);
      setBalance(balanceRes.data);
      setDeposits(depositsRes.data);
      setWithdrawals(withdrawalsRes.data);
    } catch (error) {
      console.error('Error loading wallet data:', error);
      toast.error('Failed to load wallet data');
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await paymentAPI.createDeposit(depositForm);
      toast.success('Deposit request submitted! Admin will review shortly.');
      setDepositForm({ amount: '', jazzcash_number: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Deposit request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await paymentAPI.createWithdrawal(withdrawForm);
      toast.success('Withdrawal request submitted! Admin will review shortly.');
      setWithdrawForm({ amount: '', jazzcash_number: '' });
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Withdrawal request failed');
    } finally {
      setLoading(false);
    }
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-obsidian pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-obsidian to-black border-b border-white/10 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-primary font-bold text-2xl text-white" data-testid="wallet-title">Wallet</h1>
          <p className="text-gray-400 text-sm">Manage your funds</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10" data-testid="wallet-tabs">
            <TabsTrigger value="balance" data-testid="tab-balance">Balance</TabsTrigger>
            <TabsTrigger value="deposit" data-testid="tab-deposit">Deposit</TabsTrigger>
            <TabsTrigger value="withdraw" data-testid="tab-withdraw">Withdraw</TabsTrigger>
          </TabsList>

          {/* Balance Tab */}
          <TabsContent value="balance" className="space-y-4 mt-6">
            <div className="backdrop-blur-xl bg-gradient-to-br from-gold-600 via-gold-500 to-gold-400 rounded-xl p-6">
              <p className="text-black/70 text-sm font-medium mb-2">Total Balance</p>
              <p className="font-numbers font-bold text-4xl text-black" data-testid="total-balance">
                PKR {balance?.total_balance?.toLocaleString() || '0'}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-black/10">
                <div>
                  <p className="text-black/70 text-xs mb-1">Main Wallet</p>
                  <p className="font-numbers font-bold text-black text-xl" data-testid="main-balance">
                    PKR {balance?.wallet_balance?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-black/70 text-xs mb-1">Bonus</p>
                  <p className="font-numbers font-bold text-black text-xl" data-testid="bonus-balance">
                    PKR {balance?.bonus_balance?.toLocaleString() || '0'}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="space-y-3">
              <h3 className="font-primary font-semibold text-white">Recent Deposits</h3>
              {deposits.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No deposits yet</p>
              ) : (
                deposits.slice(0, 5).map((deposit) => (
                  <div key={deposit.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowDownCircle className="w-5 h-5 text-neon-green" />
                      <div>
                        <p className="text-white font-medium">PKR {deposit.amount.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">{new Date(deposit.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={deposit.status} />
                      <span className="text-xs text-gray-400 capitalize">{deposit.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3">
              <h3 className="font-primary font-semibold text-white">Recent Withdrawals</h3>
              {withdrawals.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No withdrawals yet</p>
              ) : (
                withdrawals.slice(0, 5).map((withdrawal) => (
                  <div key={withdrawal.id} className="bg-white/5 border border-white/10 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ArrowUpCircle className="w-5 h-5 text-gold-500" />
                      <div>
                        <p className="text-white font-medium">PKR {withdrawal.amount.toLocaleString()}</p>
                        <p className="text-gray-500 text-xs">{new Date(withdrawal.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusIcon status={withdrawal.status} />
                      <span className="text-xs text-gray-400 capitalize">{withdrawal.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* Deposit Tab */}
          <TabsContent value="deposit" className="mt-6">
            <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="font-primary font-bold text-xl text-white mb-4">Deposit Funds</h3>
              <p className="text-gray-400 text-sm mb-6">
                Submit a deposit request with your JazzCash details. Admin will review and credit your account.
              </p>

              <form onSubmit={handleDeposit} className="space-y-4">
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
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Minimum 100 PKR"
                    data-testid="deposit-amount-input"
                  />
                  <p className="text-xs text-gray-500">Min: PKR 100 | Max: PKR 1,000,000</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deposit-jazzcash" className="text-white">Your JazzCash Number</Label>
                  <Input
                    id="deposit-jazzcash"
                    type="tel"
                    required
                    value={depositForm.jazzcash_number}
                    onChange={(e) => setDepositForm({ ...depositForm, jazzcash_number: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="03XX-XXXXXXX"
                    data-testid="deposit-jazzcash-input"
                  />
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm">
                    <strong>Note:</strong> After submission, admin will review your request and send approval via email. Your wallet will be credited once approved.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-neon-green hover:bg-neon-green/80 text-black font-bold py-6"
                  data-testid="submit-deposit-btn"
                >
                  {loading ? 'Submitting...' : 'Submit Deposit Request'}
                </Button>
              </form>
            </div>
          </TabsContent>

          {/* Withdraw Tab */}
          <TabsContent value="withdraw" className="mt-6">
            <div className="backdrop-blur-xl bg-black/40 border border-white/10 rounded-xl p-6">
              <h3 className="font-primary font-bold text-xl text-white mb-4">Withdraw Funds</h3>
              <p className="text-gray-400 text-sm mb-6">
                Request withdrawal to your JazzCash account. KYC verification is required.
              </p>

              <form onSubmit={handleWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="withdraw-amount" className="text-white">Amount (PKR)</Label>
                  <Input
                    id="withdraw-amount"
                    type="number"
                    min="500"
                    max="500000"
                    required
                    value={withdrawForm.amount}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="Minimum 500 PKR"
                    data-testid="withdraw-amount-input"
                  />
                  <p className="text-xs text-gray-500">Min: PKR 500 | Max: PKR 500,000</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="withdraw-jazzcash" className="text-white">Your JazzCash Number</Label>
                  <Input
                    id="withdraw-jazzcash"
                    type="tel"
                    required
                    value={withdrawForm.jazzcash_number}
                    onChange={(e) => setWithdrawForm({ ...withdrawForm, jazzcash_number: e.target.value })}
                    className="bg-white/5 border-white/10 text-white"
                    placeholder="03XX-XXXXXXX"
                    data-testid="withdraw-jazzcash-input"
                  />
                </div>

                <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-300 text-sm">
                    <strong>KYC Required:</strong> First-time withdrawals require KYC verification. Admin will review and process your request.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-500 hover:bg-gold-400 text-black font-bold py-6"
                  data-testid="submit-withdraw-btn"
                >
                  {loading ? 'Submitting...' : 'Submit Withdrawal Request'}
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Wallet;
