import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Dices, Wallet, Headphones } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../components/ui/button';

import { BrandMark } from '../components/BrandMark';

const StatPill = ({ label, value }) => {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-xl">
      <div className="text-[11px] uppercase tracking-widest text-white/50">{label}</div>
      <div className="font-numbers text-sm text-white">{value}</div>
    </div>
  );
};

const BentoCard = ({ icon: Icon, title, desc, img }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      {img ? (
        <div
          className="absolute inset-0 opacity-35"
          style={{
            backgroundImage: `url('${img}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : null}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-black/70 to-black/90" />
      <div className="relative p-6">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-gold" />
          </div>
          <div>
            <div className="font-primary text-lg text-white">{title}</div>
            <div className="text-sm text-white/70 mt-1">{desc}</div>
          </div>
        </div>
        <div className="mt-6 h-px w-full bg-gradient-to-r from-gold/30 via-white/10 to-transparent" />
        <div className="mt-4 text-xs text-white/55">
          Inspired by leading platforms — built for speed, clarity, and premium experience.
        </div>
      </div>
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
};

export default function Landing() {
  const navigate = useNavigate();

  const heroBg = "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop";
  const chipsBg = "https://images.unsplash.com/photo-1626200492328-cb7f48fe6adc?q=80&w=2070&auto=format&fit=crop";
  const coinsBg = "https://images.unsplash.com/photo-1624365169106-1f1f4cd65c91?q=80&w=2070&auto=format&fit=crop";
  const shieldBg = "https://images.unsplash.com/photo-1696013910376-c56f76dd8178?q=80&w=2070&auto=format&fit=crop";

  return (
    <div className="min-h-screen bg-obsidian">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-obsidian/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-4 flex items-center justify-between">
          <BrandMark />
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              onClick={() => navigate('/auth?mode=login')}
              className="text-white/80 hover:text-white"
              data-testid="login-btn"
            >
              Login
            </Button>
            <Button
              onClick={() => navigate('/auth')}
              className="rounded-full bg-gradient-to-r from-gold via-gold-light to-gold-dark text-black font-bold shadow-[0_0_15px_rgba(212,175,55,0.25)] hover:brightness-110"
              data-testid="get-started-btn"
            >
              Create Account
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section
        className="relative pt-28 md:pt-32"
        style={{
          backgroundImage: `linear-gradient(rgba(5,5,5,0.75), rgba(5,5,5,0.92)), url('${heroBg}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-obsidian/40 to-obsidian" />

        <div className="relative mx-auto max-w-6xl px-4 md:px-8 pb-14 md:pb-20">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-3xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/5 px-4 py-2 backdrop-blur-xl">
              <span className="h-2 w-2 rounded-full bg-gold" />
              <span className="text-xs uppercase tracking-widest text-white/70">Premium Casino Experience • Pakistan</span>
            </div>

            <h1
              className="mt-6 font-primary font-bold tracking-tight leading-[1.05] text-4xl sm:text-5xl lg:text-6xl"
              data-testid="landing-title"
            >
              <span className="text-white">High‑stakes games.</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold-dark">
                Premium feel.
              </span>
            </h1>

            <p className="mt-5 text-sm md:text-base text-white/70 max-w-2xl">
              Inspired by the best — built for a clean, user‑friendly experience with a premium dark casino UI.
              Deposit via JazzCash and start playing.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => navigate('/auth')}
                className="rounded-full bg-gradient-to-r from-gold via-gold-light to-gold-dark text-black font-bold shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:brightness-110"
              >
                Start Now
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/auth?mode=login')}
                className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
              >
                I already have an account
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <StatPill label="Payout" value="Fast manual processing" />
              <StatPill label="Security" value="Encrypted sessions" />
              <StatPill label="Support" value="24/7 (Phase 3 chatbot)" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bento features */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          <div className="flex items-end justify-between gap-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-white/50">Why WINPKR HUB</div>
              <h2 className="mt-2 font-primary text-lg md:text-xl text-white">
                Premium UI. Simple flows. Built for players and admins.
              </h2>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
            <div className="md:col-span-7">
              <BentoCard
                icon={Dices}
                title="WinPKR‑style game lobby"
                desc="Lottery, Popular, Casino, Cards, Sports and more — starting with premium placeholders." 
                img={chipsBg}
              />
            </div>
            <div className="md:col-span-5">
              <BentoCard
                icon={ShieldCheck}
                title="Trust & safety"
                desc="Clean UI, clear records, and admin control — no confusing clutter." 
                img={shieldBg}
              />
            </div>
            <div className="md:col-span-5">
              <BentoCard
                icon={Wallet}
                title="JazzCash deposits (Phase 2)"
                desc="For now: manual approval. Next: smarter requests + admin alerts." 
                img={coinsBg}
              />
            </div>
            <div className="md:col-span-7">
              <BentoCard
                icon={Headphones}
                title="Computerized support (Phase 3)"
                desc="A 24/7 chatbot to answer common questions and guide users." 
              />
            </div>
          </div>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="font-primary text-lg text-white">Ready to join WINPKR HUB?</div>
                <div className="text-sm text-white/70 mt-1">Create an account and access the lobby instantly.</div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => navigate('/auth')}
                  className="rounded-full bg-gradient-to-r from-gold via-gold-light to-gold-dark text-black font-bold hover:brightness-110"
                >
                  Create Account
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => navigate('/auth?mode=login')}
                  className="rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10"
                >
                  Login
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Responsible play */}
      <footer className="border-t border-white/10 bg-obsidian-paper">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <BrandMark />
            <div className="flex items-center gap-2 text-white/60 text-sm">
              <Zap className="h-4 w-4 text-gold" />
              <span>Play responsibly.</span>
              <span className="text-white/30">•</span>
              <span className="text-red-300">18+ only</span>
            </div>
          </div>
          <div className="mt-4 text-xs text-white/45">
            Gambling can be addictive. If you need help, stop playing and seek support.
          </div>
        </div>
      </footer>
    </div>
  );
}
