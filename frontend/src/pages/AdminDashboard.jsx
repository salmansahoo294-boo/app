import React, { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { Users, Clock, TrendingUp, CheckCircle, XCircle, Settings, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell } from '../components/PageShell';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';
import { AdminSettingsDialog } from '../components/AdminSettingsDialog';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingDeposits, setPendingDeposits] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, depositsRes, withdrawalsRes, usersRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getPendingDeposits(),
        adminAPI.getPendingWithdrawals(),
        adminAPI.getUsers({ limit: 20 }),
      ]);
      setStats(statsRes.data);
      setPendingDeposits(depositsRes.data);
      setPendingWithdrawals(withdrawalsRes.data);
      setUsers(usersRes.data);
      setUsersLoading(false);
    } catch (error) {
      console.error('Error loading admin data:', error);
      toast.error('Failed to load admin data');
      setUsersLoading(false);
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

  const handleFreezeToggle = async (u) => {
    try {
      if (u.is_frozen) {
        await adminAPI.unfreezeUser(u.id);
        toast.success('User unfrozen');
      } else {
        const reason = prompt('Freeze reason (optional):') || 'Frozen by admin';
        await adminAPI.freezeUser(u.id, reason);
        toast.success('User frozen');
      }
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update user');
    }
  };

      await adminAPI.rejectWithdrawal(withdrawalId, reason);
      toast.success('Withdrawal rejected');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to reject withdrawal');
    }
  };

  return (
    <PageShell
      title="Admin Dashboard"
      subtitle="Monitor players, approvals, and platform settings."
      rightSlot={
        <Button
          onClick={() => setSettingsOpen(true)}
          className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
          data-testid="admin-open-settings"
        >
          <Settings className="h-4 w-4 mr-2 text-gold" />
          Settings
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <Users className="w-5 h-5 text-gold" />
            <div className="mt-3 text-[11px] uppercase tracking-widest text-white/50">Total Users</div>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <div className="font-numbers text-white text-2xl" data-testid="total-users">{stats?.users?.total || 0}</div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <Clock className="w-5 h-5 text-warning" />
            <div className="mt-3 text-[11px] uppercase tracking-widest text-white/50">Pending Deposits</div>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <div className="font-numbers text-white text-2xl" data-testid="pending-deposits">{stats?.pending_approvals?.deposits || 0}</div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <Clock className="w-5 h-5 text-neon-red" />
            <div className="mt-3 text-[11px] uppercase tracking-widest text-white/50">Pending Withdrawals</div>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <div className="font-numbers text-white text-2xl" data-testid="pending-withdrawals">{stats?.pending_approvals?.withdrawals || 0}</div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <TrendingUp className="w-5 h-5 text-neon-green" />
            <div className="mt-3 text-[11px] uppercase tracking-widest text-white/50">Winning Ratio Today</div>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <div className="font-numbers text-white text-2xl" data-testid="winning-ratio">{stats?.today?.winning_ratio || 0}%</div>
            )}
          </div>
        </div>

        {/* Today's Summary */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="font-primary text-white text-lg">Today&apos;s Summary</div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { label: 'Deposits', value: stats?.today?.deposits, color: 'text-neon-green' },
              { label: 'Withdrawals', value: stats?.today?.withdrawals, color: 'text-gold' },
              { label: 'Total Bets', value: stats?.today?.total_bets, color: 'text-white' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-widest text-white/50">{s.label}</div>
                {loading ? (
                  <Skeleton className="mt-2 h-6 w-28" />
                ) : (
                  <div className={`mt-1 font-numbers ${s.color}`}>PKR {Number(s.value || 0).toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pending Deposits */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="font-primary text-white text-lg">Pending Deposits</div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : pendingDeposits.length === 0 ? (
              <EmptyState title="No pending deposits" description="All caught up." />
            ) : (
              pendingDeposits.map((deposit) => (
                <div
                  key={deposit.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  data-testid={`deposit-${deposit.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="text-white font-numbers text-lg">PKR {deposit.amount.toLocaleString()}</div>
                      <div className="text-white/60 text-sm">JazzCash: {deposit.jazzcash_number}</div>
                      <div className="text-white/45 text-xs mt-1">{new Date(deposit.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveDeposit(deposit.id)}
                        className="rounded-full bg-gradient-to-r from-gold via-gold-400 to-gold-600 text-black font-bold hover:brightness-110"
                        data-testid={`approve-deposit-${deposit.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => handleRejectDeposit(deposit.id)}
                        data-testid={`reject-deposit-${deposit.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Withdrawals */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
          <div className="font-primary text-white text-lg">Pending Withdrawals</div>
          <div className="mt-4 space-y-3">
            {loading ? (
              <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </>
            ) : pendingWithdrawals.length === 0 ? (
              <EmptyState title="No pending withdrawals" description="All caught up." />
            ) : (
              pendingWithdrawals.map((withdrawal) => (
                <div
                  key={withdrawal.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                  data-testid={`withdrawal-${withdrawal.id}`}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="text-white font-numbers text-lg">PKR {withdrawal.amount.toLocaleString()}</div>
                      <div className="text-white/60 text-sm">JazzCash: {withdrawal.jazzcash_number}</div>
                      <div className="text-white/45 text-xs mt-1">{new Date(withdrawal.created_at).toLocaleString()}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleApproveWithdrawal(withdrawal.id)}
                        className="rounded-full bg-gradient-to-r from-gold via-gold-400 to-gold-600 text-black font-bold hover:brightness-110"
                        data-testid={`approve-withdrawal-${withdrawal.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="rounded-full"
                        onClick={() => handleRejectWithdrawal(withdrawal.id)}
                        data-testid={`reject-withdrawal-${withdrawal.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
