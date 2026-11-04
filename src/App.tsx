import React, { useState, useEffect } from 'react';
import { 
  Trophy, 
  Play, 
  Cpu, 
  Activity, 
  Copy, 
  Check, 
  Layers, 
  Sparkles, 
  Cloud, 
  LogIn, 
  LogOut, 
  Swords, 
  Gem,
  Award,
  Terminal,
  FileText
} from 'lucide-react';
import { PlayVsEngine } from './PlayVsEngine';
import { BerserkerCcrlArena } from './BerserkerCcrlArena';
import { BerserkerNnueInspector } from './BerserkerNnueInspector';
import { CloudGamesModal } from './CloudGamesModal';
import { loginWithGoogle, logoutUser, subscribeAuth } from './firebaseService';
import type { User } from 'firebase/auth';

export default function App() {
  const [activeTab, setActiveTab] = useState<'play' | 'ccrl' | 'nnue'>('play');
  const [showCloudGamesModal, setShowCloudGamesModal] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(false);

  useEffect(() => {
    const unsub = subscribeAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      console.warn('Google sign-in action notice:', e);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (e) {
      console.warn('Sign out action notice:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-purple-500 selection:text-white">
      {/* Top Header Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30">
            <Gem className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Berserker 18</span>
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase">
                CCRL Edition
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold hidden sm:inline-block">
                3642 Elo (40/15)
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              High-Performance Neural Chess Engine • Authentic HalfKP-Dual NNUE & Full WASM Acceleration
            </p>
          </div>
        </div>

        {/* Tab Navigation: Purely Berserker & CCRL */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('play')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'play'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Play className="w-3.5 h-3.5 text-purple-300" />
            <span>Play vs Berserker 18</span>
          </button>

          <button
            onClick={() => setActiveTab('ccrl')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'ccrl'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>CCRL Rating & Arena</span>
          </button>

          <button
            onClick={() => setActiveTab('nnue')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeTab === 'nnue'
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-pink-400" />
            <span>NNUE Weights & Architecture</span>
          </button>
        </div>

        {/* Cloud Archive & Auth Widget */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCloudGamesModal(true)}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700 shadow-sm"
            title="Browse Community Cloud Games"
          >
            <Cloud className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Cloud Archive</span>
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700/60">
              <span className="text-[11px] font-mono font-medium text-slate-300 truncate max-w-[100px] hidden sm:inline">
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </span>
              <button
                onClick={handleSignOut}
                className="text-[11px] text-slate-400 hover:text-rose-400 transition"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleGoogleSignIn}
              disabled={isAuthLoading}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs transition flex items-center gap-1.5 shadow"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isAuthLoading ? '...' : 'Sign in'}</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 max-w-7xl mx-auto w-full">
        {/* Tab 1: Play vs Berserker 18 (Full 3640+ Elo WASM Neural Acceleration) */}
        {activeTab === 'play' && (
          <PlayVsEngine maxThreads={4} hashSizeMb={1024} />
        )}

        {/* Tab 2: CCRL Rating List & Cutechess-CLI Package */}
        {activeTab === 'ccrl' && (
          <BerserkerCcrlArena />
        )}

        {/* Tab 3: Berserker NNUE Architecture & Weight Inspector */}
        {activeTab === 'nnue' && (
          <BerserkerNnueInspector />
        )}
      </main>

      {/* Cloud Games Archive Modal */}
      <CloudGamesModal
        isOpen={showCloudGamesModal}
        onClose={() => setShowCloudGamesModal(false)}
      />

      {/* Clean Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 px-4 lg:px-8 py-3 text-center text-xs text-slate-500">
        Berserker 18 CCRL Edition • Authentic HalfKP-Dual-1536 SCReLU NNUE • Grandmaster 3642+ CCRL Elo
      </footer>
    </div>
  );
}
