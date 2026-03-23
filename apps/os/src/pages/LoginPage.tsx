import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Welcome back');
      navigate('/');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/3 blur-3xl animate-pulse-orb" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-chart-2/3 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 shadow-gold-glow">
            <span className="text-primary text-2xl font-bold font-display">A</span>
          </div>
          <h1 className="text-foreground text-2xl font-bold font-display">Ardeno OS</h1>
          <p className="text-muted-foreground text-sm mt-1">Studio Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="ardeno-panel rounded-2xl border border-border p-8 shadow-glass">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="h-4 w-4 text-primary" />
            <p className="text-foreground text-sm font-medium">Sign in to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ardeno.studio"
                required
                className="w-full rounded-xl bg-card-3 border border-border text-sm text-foreground px-4 py-3 outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-muted-foreground text-xs">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-card-3 border border-border text-sm text-foreground px-4 py-3 pr-10 outline-none placeholder:text-muted-foreground/50 focus:border-primary/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium bg-primary text-background hover:bg-primary/80 transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center text-muted-foreground text-xs mt-6">
          Ardeno Studio © 2026 · Internal Platform
        </p>
      </div>
    </div>
  );
}
