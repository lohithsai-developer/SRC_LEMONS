import React from 'react';
import { LayoutDashboard, CalendarDays, Users, BookOpen, Scale } from 'lucide-react';
import { Language } from '../i18n';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang?: Language;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-safe">
      <div className="grid grid-cols-4 items-center h-16 max-w-md mx-auto px-1">
        {/* Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'dashboard' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1">Dashboard</span>
        </button>

        {/* Lots & Bills */}
        <button
          onClick={() => setActiveTab('daily-bills')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'daily-bills' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CalendarDays className={`w-5 h-5 ${activeTab === 'daily-bills' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1">Daily Bills</span>
        </button>

        {/* Floating Center Action: + WEIGH BAGS */}
        <div className="flex flex-col items-center justify-center -mt-5">
          <button
            onClick={() => setActiveTab('new-bill')}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 border-white transition transform active:scale-95 ${
              activeTab === 'new-bill'
                ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-100'
                : 'bg-amber-400 text-slate-950 hover:bg-amber-500'
            }`}
            aria-label="Weigh Bags"
          >
            <Scale className="w-6 h-6 stroke-[2.5]" />
          </button>
          <span className="text-[10px] font-extrabold text-slate-900 mt-0.5">
            + Weigh
          </span>
        </div>

        {/* Customers */}
        <button
          onClick={() => setActiveTab('customers')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'customers' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className={`w-5 h-5 ${activeTab === 'customers' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] font-bold mt-1">Customers</span>
        </button>
      </div>
    </nav>
  );
};
