import React from 'react';
import { LayoutDashboard, Scale, CalendarDays, Users, BookOpen, BarChart3, Settings, LogOut, Globe, Flame, Database } from 'lucide-react';
import { Language, t } from '../i18n';
import { AdminUser, BusinessSettings } from '../types';
import { Logo } from './Logo';
import { isFirebaseConnected } from '../firebase';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang?: Language;
  setLang?: (lang: Language) => void;
  user: AdminUser | null;
  onLogout: () => void;
  settings?: BusinessSettings | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  user,
  onLogout,
  settings,
}) => {
  const isFb = isFirebaseConnected();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'new-bill', label: 'Weigh Bags', icon: Scale },
    { id: 'daily-bills', label: 'Daily Bills', icon: CalendarDays },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with SRC LEMONS Emblem */}
          <div
            className="flex items-center cursor-pointer select-none"
            onClick={() => setActiveTab('dashboard')}
          >
            <Logo size="md" showText={true} />
          </div>

          {/* Desktop Navigation Links - Clean, Professional & Subtle */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-charcoal-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right utility items: Database Badge & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Database indicator */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isFb
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
              }`}
              title={isFb ? 'Connected to Firebase Firestore Cloud' : 'Using Local Storage'}
            >
              {isFb ? <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" /> : <Database className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isFb ? 'Firebase' : 'Local DB'}</span>
            </div>

            {/* User profile / Logout */}
            {user && (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-200">
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-700">
                  {user.name || user.username}
                </span>
                <button
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
