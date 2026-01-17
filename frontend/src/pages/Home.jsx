import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import { Wallet, TrendingUp, Trophy, Gamepad2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

const GAME_CATEGORIES = [
  { id: 'lottery', name: 'Lottery', games: ['Win Go 1 Min', 'Win Go 3 Min', 'Win Go 5 Min', 'Dice'] },
  { id: 'popular', name: 'Popular', games: ['Aviator', 'Crash', 'Plinko', 'Mines', 'Spin Wheel'] },
  { id: 'casino', name: 'Casino', games: ['Slots', 'Roulette'] },
  { id: 'cards', name: 'Cards', games: ['Teen Patti'] },
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [balanceRes, statsRes] = await Promise.all([
        userAPI.getWalletBalance(),
        userAPI.getStats(),
      ]);
      setBalance(balanceRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
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
        <div className="max-w-4xl mx-auto">
          <h1 className="font-primary font-bold text-2xl text-white mb-1" data-testid="welcome-message">
            Welcome, {user?.full_name || user?.email?.split('@')[0] || 'Player'}
          </h1>
          <p className="text-gray-400 text-sm">Your luck starts here</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
        {/* Wallet Card */}
        <div 
          className="backdrop-blur-xl bg-gradient-to-br from-gold-600 via-gold-500 to-gold-400 rounded-xl p-6 cursor-pointer hover:scale-[1.02] transition-transform"
          onClick={() => navigate('/wallet')}
          data-testid="wallet-card"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-black/20 flex items-center justify-center">
                <Wallet className="w-6 h-6 text-black" />
              </div>
              <div>
                <p className="text-black/70 text-sm font-medium">Total Balance</p>
                <p className="font-numbers font-bold text-3xl text-black">
                  PKR {balance?.total_balance?.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-black/10">
            <div>
              <p className="text-black/70 text-xs">Main Wallet</p>
              <p className="font-numbers font-semibold text-black">PKR {balance?.wallet_balance?.toLocaleString() || '0'}</p>
            </div>
            <div>
              <p className="text-black/70 text-xs">Bonus</p>
              <p className="font-numbers font-semibold text-black">PKR {balance?.bonus_balance?.toLocaleString() || '0'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => navigate('/wallet?tab=deposit')}
            className="bg-neon-green hover:bg-neon-green/80 text-black font-bold py-6"
            data-testid="deposit-btn"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Deposit
          </Button>
          <Button
            onClick={() => navigate('/wallet?tab=withdraw')}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold py-6"
            data-testid="withdraw-btn"
          >
            <Wallet className="w-5 h-5 mr-2" />
            Withdraw
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-obsidian border border-white/10 p-4 rounded-lg">
            <p className="text-gray-500 text-xs mb-1">Total Bets</p>
            <p className="font-numbers font-bold text-white text-lg">PKR {stats?.total_bets?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-obsidian border border-white/10 p-4 rounded-lg">
            <p className="text-gray-500 text-xs mb-1">Total Wins</p>
            <p className="font-numbers font-bold text-neon-green text-lg">PKR {stats?.total_wins?.toLocaleString() || '0'}</p>
          </div>
          <div className="bg-obsidian border border-white/10 p-4 rounded-lg">
            <p className="text-gray-500 text-xs mb-1">P/L</p>
            <p className={`font-numbers font-bold text-lg ${
              stats?.profit_loss >= 0 ? 'text-neon-green' : 'text-neon-red'
            }`}>
              {stats?.profit_loss >= 0 ? '+' : ''}{stats?.profit_loss?.toLocaleString() || '0'}
            </p>
          </div>
        </div>

        {/* Game Categories */}
        <div id="games" className="space-y-6">
          <h2 className="font-primary font-bold text-2xl text-white flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-gold-500" />
            Games
          </h2>

          {GAME_CATEGORIES.map((category) => (
            <div key={category.id}>
              <h3 className="font-primary font-semibold text-lg text-white mb-3">{category.name}</h3>
              <div className="grid grid-cols-2 gap-3">
                {category.games.map((game) => (
                  <button
                    key={game}
                    onClick={() => toast.info('Game launching soon!')}
                    className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-gold-500/50 transition-all duration-300 p-4 text-left"
                    data-testid={`game-${game.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Trophy className="w-8 h-8 text-gold-500 mb-2" />
                    <p className="font-primary font-semibold text-white text-sm relative z-10">{game}</p>
                    <p className="text-gray-500 text-xs relative z-10">Play Now</p>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Coming Soon Badge */}
        <div className="bg-gradient-to-r from-neon-red/20 to-gold-500/20 border border-neon-red/30 rounded-lg p-4 text-center">
          <p className="text-white font-semibold">🎮 More Games Coming Soon!</p>
          <p className="text-gray-400 text-sm mt-1">Stay tuned for Sports Betting, Live Casino & More</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
