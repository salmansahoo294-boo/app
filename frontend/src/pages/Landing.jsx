import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Trophy, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/button';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Hero Section */}
      <div 
        className="relative h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(5,5,5,0.85), rgba(5,5,5,0.95)), url('https://images.unsplash.com/photo-1561212001-d400282c6144?crop=entropy&cs=srgb&fm=jpg&q=85')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-obsidian" />
        
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="relative inline-block mb-4">
            <h1 
              className="font-primary font-bold text-5xl md:text-7xl tracking-tighter uppercase text-white"
              style={{ textShadow: '0 0 20px rgba(255,215,0,0.5)' }}
              data-testid="landing-title"
            >
              WIN<span className="text-gold-500 relative">
                PKR
                <span className="absolute -bottom-4 right-0 text-base md:text-xl font-medium tracking-wider">HUB</span>
              </span>
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 font-secondary mt-6">
            Pakistan's Premier Online Gambling Platform
          </p>
          
          <p className="text-base text-gray-400 mb-12 max-w-2xl mx-auto">
            Experience the thrill of casino games, sports betting, and exclusive card games. 
            Win real money with JazzCash deposits and instant withdrawals.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/auth')}
              data-testid="get-started-btn"
              className="bg-gold-500 hover:bg-gold-400 text-black font-bold uppercase tracking-wider px-8 py-6 text-lg rounded-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]"
              style={{ transform: 'skewX(-10deg)' }}
            >
              <span style={{ transform: 'skewX(10deg)', display: 'block' }}>
                Get Started
              </span>
            </Button>
            
            <Button
              onClick={() => navigate('/auth?mode=login')}
              data-testid="login-btn"
              className="bg-transparent border border-gold-500/50 text-gold-500 hover:bg-gold-500/10 hover:border-gold-500 font-bold uppercase tracking-wider px-8 py-6 text-lg rounded-sm transition-all duration-300"
            >
              Login
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-primary font-bold text-3xl md:text-4xl text-center text-white mb-12">
            Why Choose WinPKR?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-gold-500/50 transition-all duration-300 p-6">
              <Sparkles className="w-12 h-12 text-gold-500 mb-4" />
              <h3 className="font-primary font-semibold text-xl text-white mb-2">Multiple Games</h3>
              <p className="text-gray-400 text-sm">Win Go, Aviator, Crash, Plinko, Slots, Teen Patti, and more</p>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-gold-500/50 transition-all duration-300 p-6">
              <Zap className="w-12 h-12 text-neon-green mb-4" />
              <h3 className="font-primary font-semibold text-xl text-white mb-2">Fast Deposits</h3>
              <p className="text-gray-400 text-sm">Instant JazzCash deposits with quick admin approval</p>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-gold-500/50 transition-all duration-300 p-6">
              <Trophy className="w-12 h-12 text-gold-500 mb-4" />
              <h3 className="font-primary font-semibold text-xl text-white mb-2">Real Money Wins</h3>
              <p className="text-gray-400 text-sm">Win real PKR and withdraw directly to your JazzCash</p>
            </div>
            
            <div className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm hover:border-gold-500/50 transition-all duration-300 p-6">
              <Shield className="w-12 h-12 text-neon-green mb-4" />
              <h3 className="font-primary font-semibold text-xl text-white mb-2">Secure & Fair</h3>
              <p className="text-gray-400 text-sm">KYC verified, secure transactions, and fair gameplay</p>
            </div>
          </div>
        </div>
      </div>

      {/* Age Warning */}
      <div className="bg-red-900/20 border-t border-red-500/30 py-4 px-4">
        <p className="text-center text-red-300 text-sm">
          <strong>18+ Only</strong> | Gambling can be addictive. Play responsibly.
        </p>
      </div>
    </div>
  );
};

export default Landing;
