import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Users, DollarSign, Clock, TrendingUp, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, depositsRes, withdrawalsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingDeposits(),
        adminAPI.getPendingWithdrawals(),
      ]);
      setStats(statsRes.data);
      setPendingDeposits(depositsRes.data);
      setPendingWithdrawals(withdrawalsRes.data);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDeposit = async (depositId) => {
    try {
      await adminAPI.approveDeposit(depositId);
      toast.success('Deposit approved successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve deposit');
    }
  };

  const handleRejectDeposit = async (depositId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await adminAPI.rejectDeposit(depositId, reason);
      toast.success('Deposit rejected');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject deposit');
    }
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    try {
      await adminAPI.approveWithdrawal(withdrawalId);
      toast.success('Withdrawal approved successfully');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (withdrawalId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await adminAPI.rejectWithdrawal(withdrawalId, reason);
      toast.success('Withdrawal rejected');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject withdrawal');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-obsidian flex items-center justify-center">
        <div className="text-gold-500 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian pb-20">
      {/* Header */}
      <div className="bg-gradient-to-b from-obsidian to-black border-b border-white/10 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-primary font-bold text-2xl text-white" data-testid="admin-title">Admin Dashboard</h1>
          <p className="text-gray-400 text-sm">Manage WINPKRHUB Platform</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Users className="w-8 h-8 text-gold-500 mb-2" />
            <p className="text-gray-400 text-xs mb-1">Total Users</p>
            <p className="font-numbers font-bold text-white text-2xl" data-testid="total-users">
              {stats?.users?.total || 0}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Clock className="w-8 h-8 text-yellow-500 mb-2" />
            <p className="text-gray-400 text-xs mb-1">Pending Deposits</p>
            <p className="font-numbers font-bold text-white text-2xl" data-testid="pending-deposits">
              {stats?.pending_approvals?.deposits || 0}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <Clock className="w-8 h-8 text-neon-red mb-2" />
            <p className="text-gray-400 text-xs mb-1">Pending Withdrawals</p>
            <p className="font-numbers font-bold text-white text-2xl" data-testid="pending-withdrawals">
              {stats?.pending_approvals?.withdrawals || 0}
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <TrendingUp className="w-8 h-8 text-neon-green mb-2" />
            <p className="text-gray-400 text-xs mb-1">Winning Ratio Today</p>
            <p className="font-numbers font-bold text-white text-2xl" data-testid="winning-ratio">
              {stats?.today?.winning_ratio || 0}%
            </p>
          </div>
        </div>

        {/* Today's Stats */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-primary font-bold text-xl text-white mb-4">Today's Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Deposits</p>
              <p className="font-numbers font-bold text-neon-green text-lg">
                PKR {stats?.today?.deposits?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Withdrawals</p>
              <p className="font-numbers font-bold text-gold-500 text-lg">
                PKR {stats?.today?.withdrawals?.toLocaleString() || '0'}
              </p>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Total Bets</p>
              <p className="font-numbers font-bold text-white text-lg">
                PKR {stats?.today?.total_bets?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        {/* Pending Deposits */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-primary font-bold text-xl text-white mb-4">Pending Deposits</h2>
          {pendingDeposits.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending deposits</p>
          ) : (
            <div className="space-y-3">
              {pendingDeposits.map((deposit) => (
                <div key={deposit.id} className="bg-white/5 border border-white/10 rounded-lg p-4" data-testid={`deposit-${deposit.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-bold">PKR {deposit.amount.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">JazzCash: {deposit.jazzcash_number}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(deposit.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveDeposit(deposit.id)}
                        className="bg-neon-green hover:bg-neon-green/80 text-black"
                        data-testid={`approve-deposit-${deposit.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectDeposit(deposit.id)}
                        data-testid={`reject-deposit-${deposit.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Withdrawals */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="font-primary font-bold text-xl text-white mb-4">Pending Withdrawals</h2>
          {pendingWithdrawals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending withdrawals</p>
          ) : (
            <div className="space-y-3">
              {pendingWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="bg-white/5 border border-white/10 rounded-lg p-4" data-testid={`withdrawal-${withdrawal.id}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-white font-bold">PKR {withdrawal.amount.toLocaleString()}</p>
                      <p className="text-gray-400 text-sm">JazzCash: {withdrawal.jazzcash_number}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveWithdrawal(withdrawal.id)}
                        className="bg-neon-green hover:bg-neon-green/80 text-black"
                        data-testid={`approve-withdrawal-${withdrawal.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectWithdrawal(withdrawal.id)}
                        data-testid={`reject-withdrawal-${withdrawal.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
