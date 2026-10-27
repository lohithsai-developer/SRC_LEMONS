import React, { useState } from 'react';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { login } from '../api';
import { AdminUser } from '../types';
import { Language, t } from '../i18n';
import { Logo } from '../components/Logo';

interface LoginPageProps {
  onLoginSuccess: (user: AdminUser) => void;
  lang: Language;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, lang }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('lemon123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await login(username, password);
      onLoginSuccess(res.admin);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = () => {
    setUsername('admin');
    setPassword('lemon123');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-lemon-50 via-slate-50 to-fresh-50">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 shadow-2xl overflow-hidden p-8 sm:p-10">
        {/* Brand Icon & Title with custom Logo */}
        <div className="flex flex-col items-center text-center">
          <Logo size="xl" />
          <h1 className="text-2xl sm:text-3xl font-black text-charcoal-900 tracking-tight mt-3">
            SRC LEMONS
          </h1>
          <p className="text-sm font-semibold text-fresh-700 mt-1">
            Purchase, Pricing & Daily Billing App
          </p>
        </div>

        {/* Demo Credentials Pill */}
        <div
          onClick={handleQuickDemo}
          className="mt-6 p-3 rounded-2xl bg-lemon-100/70 border border-lemon-300/80 flex items-center justify-between cursor-pointer hover:bg-lemon-100 transition text-xs"
        >
          <div className="flex items-center space-x-2 text-amber-950 font-medium">
            <ShieldCheck className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>Default Login: <strong>admin</strong> / <strong>lemon123</strong></span>
          </div>
          <span className="text-[11px] font-bold text-amber-900 underline">Auto-fill</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block mb-1">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lemon-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-charcoal-800 block mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-lemon-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-2xl bg-lemon-400 hover:bg-lemon-500 text-charcoal-900 font-black text-sm shadow-md border border-lemon-500/30 transition transform active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-8 text-center text-xs text-slate-400">
          Mobile-First • Firebase Cloud & Offline Database
        </div>
      </div>
    </div>
  );
};
