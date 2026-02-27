import React, { useState } from 'react';
import { auth, isConfigValid } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { motion } from 'motion/react';
import { Dumbbell, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

interface AuthProps {
  onSuccess: () => void;
}

export function Auth({ onSuccess }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [identifier, setIdentifier] = useState(''); // Email or Username
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  if (!isConfigValid) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8 text-center">
          <div className="bg-amber-50 p-4 rounded-2xl mb-6 inline-flex">
            <Lock className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 mb-2">Setup Required</h2>
          <p className="text-zinc-500 text-sm mb-6">
            Firebase configuration is missing. Please add your API keys to the environment variables to enable authentication.
          </p>
          <div className="text-left bg-zinc-50 p-4 rounded-xl text-[10px] font-mono text-zinc-600 space-y-1">
            <p>• VITE_FIREBASE_API_KEY</p>
            <p>• VITE_FIREBASE_AUTH_DOMAIN</p>
            <p>• VITE_FIREBASE_PROJECT_ID</p>
            <p>• VITE_FIREBASE_APP_ID</p>
          </div>
          <p className="text-[10px] text-zinc-400 mt-6">
            Check the <span className="font-bold">README.md</span> for a full list of required keys.
          </p>
        </div>
      </div>
    );
  }

  const formatEmail = (id: string) => {
    if (id.includes('@')) return id;
    return `${id.toLowerCase().trim()}@irontrack.app`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const email = formatEmail(identifier);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      }
      onSuccess();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl shadow-zinc-200/50 border border-zinc-100 p-8"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="bg-zinc-900 p-3 rounded-2xl mb-4">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">IronTrack Weekly</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {isLogin ? 'Welcome back, athlete' : 'Start your journey today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Email or Username</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                placeholder="athlete@example.com or username"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-xs mt-2 ml-1">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white rounded-xl py-3 font-semibold text-sm flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
