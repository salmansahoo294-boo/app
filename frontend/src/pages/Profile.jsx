import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../utils/api';
import { Button } from '../components/ui/button';
import { LogOut, User as UserIcon, Mail, Phone, Shield, Award } from 'lucide-react';
import { toast } from 'sonner';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
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
        <div className="max-w-4xl mx-auto">
          <h1 className="font-primary font-bold text-2xl text-white" data-testid="profile-title">Profile</h1>
          <p className="text-gray-400 text-sm">Manage your account</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Profile Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
              <UserIcon className="w-8 h-8 text-black" />
            </div>
            <div>
              <h2 className="font-primary font-bold text-xl text-white" data-testid="profile-name">
                {profile?.full_name || 'User'}
              </h2>
              <p className="text-gray-400 text-sm" data-testid="profile-email">{profile?.email}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Mail className="w-5 h-5 text-gold-500" />
              <div>
                <p className="text-gray-400 text-xs">Email</p>
                <p className="text-white">{profile?.email}</p>
              </div>
            </div>

            {profile?.phone && (
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Phone className="w-5 h-5 text-gold-500" />
                <div>
                  <p className="text-gray-400 text-xs">Phone</p>
                  <p className="text-white">{profile.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Shield className="w-5 h-5 text-gold-500" />
              <div>
                <p className="text-gray-400 text-xs">KYC Status</p>
                <p className={`font-medium capitalize ${
                  profile?.kyc_status === 'approved' ? 'text-neon-green' :
                  profile?.kyc_status === 'pending' ? 'text-yellow-500' :
                  'text-gray-400'
                }`}>
                  {profile?.kyc_status?.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
              <Award className="w-5 h-5 text-gold-500" />
              <div>
                <p className="text-gray-400 text-xs">VIP Level</p>
                <p className="text-white font-numbers font-bold">{profile?.vip_level || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Card */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="font-primary font-bold text-lg text-white mb-4">Statistics</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Total Deposits</p>
              <p className="font-numbers font-bold text-white text-lg" data-testid="total-deposits">
                PKR {stats?.total_deposits?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Total Withdrawals</p>
              <p className="font-numbers font-bold text-white text-lg" data-testid="total-withdrawals">
                PKR {stats?.total_withdrawals?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Total Bets</p>
              <p className="font-numbers font-bold text-white text-lg" data-testid="total-bets-stat">
                PKR {stats?.total_bets?.toLocaleString() || '0'}
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Total Wins</p>
              <p className="font-numbers font-bold text-neon-green text-lg" data-testid="total-wins-stat">
                PKR {stats?.total_wins?.toLocaleString() || '0'}
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 bg-gradient-to-r from-gold-500/10 to-neon-green/10 border border-gold-500/30 rounded-lg">
            <p className="text-gray-400 text-xs mb-1">Profit / Loss</p>
            <p className={`font-numbers font-bold text-2xl ${
              stats?.profit_loss >= 0 ? 'text-neon-green' : 'text-neon-red'
            }`} data-testid="profit-loss-stat">
              {stats?.profit_loss >= 0 ? '+' : ''} PKR {stats?.profit_loss?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        {/* Referral Card */}
        {profile?.referral_code && (
          <div className="backdrop-blur-xl bg-gradient-to-br from-neon-green/20 to-gold-500/20 border border-neon-green/30 rounded-xl p-6">
            <h3 className="font-primary font-bold text-lg text-white mb-2">Refer & Earn</h3>
            <p className="text-gray-300 text-sm mb-4">Share your referral code and earn bonuses when friends join WINPKRHUB!</p>
            
            <div className="bg-black/30 border border-white/20 rounded-lg p-4">
              <p className="text-gray-400 text-xs mb-1">Your Referral Code</p>
              <p className="font-numbers font-bold text-2xl text-gold-500" data-testid="referral-code">
                {profile.referral_code}
              </p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full py-6 font-bold"
          data-testid="logout-btn"
        >
          <LogOut className="w-5 h-5 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
