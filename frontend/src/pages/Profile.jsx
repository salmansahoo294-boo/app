import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { LogOut, User as UserIcon, Mail, Phone, Shield, Award } from 'lucide-react';
import { toast } from 'sonner';
import { PageShell } from '../components/PageShell';
import { Skeleton } from '../components/ui/skeleton';
import { EmptyState } from '../components/EmptyState';

export default function Profile() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profileRes, statsRes] = await Promise.all([
        userAPI.getProfile(),
        userAPI.getStats(),
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <PageShell title="Profile" subtitle="Account security and records.">
      <div className="space-y-6">
        {/* Profile Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold to-gold-600 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="font-primary text-white text-lg" data-testid="profile-name">
                {loading ? <Skeleton className="h-6 w-40" /> : (profile?.full_name || 'User')}
              </h2>
              <p className="text-white/60 text-sm" data-testid="profile-email">
                {loading ? <Skeleton className="mt-2 h-4 w-56" /> : profile?.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-black/20">
              <Mail className="w-5 h-5 text-gold" />
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest">Email</p>
                <p className="text-white text-sm">{loading ? '—' : profile?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-black/20">
              <Phone className="w-5 h-5 text-gold" />
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest">Phone</p>
                <p className="text-white text-sm">{loading ? '—' : (profile?.phone || 'Not added')}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-black/20">
              <Shield className="w-5 h-5 text-gold" />
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest">KYC Status</p>
                <p className={`text-sm capitalize ${
                  profile?.kyc_status === 'approved' ? 'text-neon-green' :
                  profile?.kyc_status === 'pending' ? 'text-warning' :
                  'text-white/60'
                }`}>
                  {loading ? 'Loading…' : (profile?.kyc_status?.replace('_', ' ') || 'not verified')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl border border-white/10 bg-black/20">
              <Award className="w-5 h-5 text-gold" />
              <div>
                <p className="text-white/50 text-xs uppercase tracking-widest">VIP Level</p>
                <p className="text-white font-numbers">{loading ? '—' : (profile?.vip_level || 0)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
          <div className="font-primary text-white text-lg">Statistics</div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Total Deposits', value: stats?.total_deposits, color: 'text-white' },
              { label: 'Total Withdrawals', value: stats?.total_withdrawals, color: 'text-white' },
              { label: 'Total Bets', value: stats?.total_bets, color: 'text-white' },
              { label: 'Total Wins', value: stats?.total_wins, color: 'text-neon-green' },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[11px] uppercase tracking-widest text-white/50">{s.label}</div>
                {loading ? (
                  <Skeleton className="mt-2 h-6 w-24" />
                ) : (
                  <div className={`mt-1 font-numbers ${s.color}`}>PKR {Number(s.value || 0).toLocaleString()}</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-r from-gold/10 to-neon-green/10 p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/50">Profit / Loss</div>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-32" />
            ) : (
              <div
                className={`mt-1 font-numbers text-2xl ${stats?.profit_loss >= 0 ? 'text-neon-green' : 'text-neon-red'}`}
                data-testid="profit-loss-stat"
              >
                {stats?.profit_loss >= 0 ? '+' : ''} PKR {Number(stats?.profit_loss || 0).toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Referral */}
        {loading ? null : profile?.referral_code ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.35)]">
            <div className="font-primary text-white text-lg">Refer & Earn</div>
            <div className="text-sm text-white/60 mt-1">Share your referral code and earn bonuses.</div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="text-[11px] uppercase tracking-widest text-white/50">Your Referral Code</div>
              <div className="mt-2 font-numbers text-2xl text-gold" data-testid="referral-code">
                {profile.referral_code}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No referral code"
            description="Referral bonuses will appear here once enabled."
          />
        )}

        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full rounded-full py-6 font-bold"
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </PageShell>
  );
}
