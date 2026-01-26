import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userAPI } from '../utils/api';
import { Wallet, TrendingUp, Trophy, Gamepad2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { PageShell } from '../components/PageShell';
import { EmptyState } from '../components/EmptyState';

const GAME_CATEGORIES = [
  { id: 'lottery', name: 'Lottery', games: ['Win Go 1 Min', 'Win Go 3 Min', 'Win Go 5 Min', 'Dice'] },
  { id: 'popular', name: 'Popular', games: ['Aviator', 'Crash', 'Plinko', 'Mines', 'Spin Wheel'] },
  { id: 'casino', name: 'Casino', games: ['Slots', 'Roulette'] },
  { id: 'cards', name: 'Cards', games: ['Teen Patti'] },
];

export default function Home() {
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

  return (
    <PageShell
      title={`Welcome, ${user?.full_name || user?.email?.split('@')[0] || 'Player'}`}
      subtitle="Your lobby is ready. Choose a category and start playing."
      rightSlot={
        <Button
          onClick={() => navigate('/wallet?tab=deposit')}
          className="rounded-full bg-gradient-to-r from-gold via-gold-400 to-gold-600 text-black font-bold hover:brightness-110"
          data-testid="deposit-btn"
        >
          Deposit
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Wallet Preview */}
        <div
          className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer"
          onClick={() => navigate('/wallet')}
          data-testid="wallet-card"
        >
          <div className="absolute inset-0 opacity-60 bg-gradient-to-br from-gold/15 via-transparent to-transparent" />
          <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-gold" />
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-white/50">Total Balance</div>
                {loading ? (
                  <Skeleton className="mt-2 h-9 w-56" />
                ) : (
                  <div className="font-numbers text-3xl text-white">PKR {balance?.total_balance?.toLocaleString() || '0'}</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-white/50">Main Wallet</div>
                {loading ? (
                  <Skeleton className="mt-2 h-6 w-28" />
                ) : (
                  <div className="font-numbers text-white">PKR {balance?.wallet_balance?.toLocaleString() || '0'}</div>
                )}
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[11px] uppercase tracking-widest text-white/50">Bonus</div>
                {loading ? (
                  <Skeleton className="mt-2 h-6 w-24" />
                ) : (
                  <div className="font-numbers text-white">PKR {balance?.bonus_balance?.toLocaleString() || '0'}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => navigate('/wallet?tab=deposit')}
            className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 py-6"
            data-testid="quick-deposit"
          >
            <TrendingUp className="w-5 h-5 mr-2 text-gold" />
            Deposit
          </Button>
          <Button
            onClick={() => navigate('/wallet?tab=withdraw')}
            className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 py-6"
            data-testid="quick-withdraw"
          >
            <Wallet className="w-5 h-5 mr-2 text-gold" />
            Withdraw
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/50">Total Bets</div>
            {loading ? <Skeleton className="mt-2 h-7 w-32" /> : <div className="font-numbers text-white text-xl">PKR {stats?.total_bets?.toLocaleString() || '0'}</div>}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/50">Total Wins</div>
            {loading ? <Skeleton className="mt-2 h-7 w-32" /> : <div className="font-numbers text-neon-green text-xl">PKR {stats?.total_wins?.toLocaleString() || '0'}</div>}
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4">
            <div className="text-[11px] uppercase tracking-widest text-white/50">P/L</div>
            {loading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <div className={`font-numbers text-xl ${stats?.profit_loss >= 0 ? 'text-neon-green' : 'text-neon-red'}`}>
                {stats?.profit_loss >= 0 ? '+' : ''}{stats?.profit_loss?.toLocaleString() || '0'}
              </div>
            )}
          </div>
        </div>

        {/* Game Lobby */}
        <div id="games" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-primary text-lg md:text-xl text-white flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-gold" />
              Game Lobby
            </h2>
            <div className="text-xs text-white/50">All games show PKR by default</div>
          </div>

          {GAME_CATEGORIES.length === 0 ? (
            <EmptyState
              title="No games yet"
              description="Categories will appear here once games are enabled by admin."
            />
          ) : (
            GAME_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-primary text-white">{category.name}</h3>
                  <div className="text-xs text-white/45">{category.games.length} games</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {category.games.map((game) => (
                    <button
                      key={game}
                      onClick={() => toast.info('Game launching soon!')}
                      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.35)] hover:border-gold/40"
                      data-testid={`game-${game.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-gold/15 to-transparent" />
                      <Trophy className="w-8 h-8 text-gold mb-3 relative" />
                      <div className="font-primary text-white text-sm relative">{game}</div>
                      <div className="text-xs text-white/55 relative">Tap to open</div>
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
