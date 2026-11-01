import React from 'react';
import {
  Home,
  Calendar,
  CheckSquare,
  FolderGit2,
  TrendingUp,
  Sparkles,
  CloudSun,
  Settings,
  User,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenScheduleModal: () => void;
  onOpenWhatsAppModal: () => void;
  onOpenCalendarModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenScheduleModal,
  onOpenWhatsAppModal,
  onOpenCalendarModal
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, action: () => setActiveTab('dashboard') },
    { id: 'calendar', label: 'Calendar', icon: Calendar, action: onOpenCalendarModal },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, action: onOpenScheduleModal },
    { id: 'projects', label: 'Projects', icon: FolderGit2, action: () => setActiveTab('projects') },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, action: () => setActiveTab('analytics') },
    { id: 'ai', label: 'AI Assistant', icon: Sparkles, action: () => setActiveTab('ai') },
    { id: 'weather', label: 'Weather', icon: CloudSun, action: () => setActiveTab('weather') },
    { id: 'settings', label: 'Settings', icon: Settings, action: onOpenWhatsAppModal },
    { id: 'profile', label: 'Profile', icon: User, action: () => setActiveTab('profile') }
  ];

  return (
    <aside className="w-64 h-full flex flex-col justify-between py-6 px-4 bg-[#0a0f20]/75 backdrop-blur-xl border-r border-[#d4af37]/25 shadow-2xl z-20 select-none">
      {/* Brand Header */}
      <div>
        <div className="flex items-center space-x-3 px-2 mb-8 cursor-pointer group">
          {/* Feather Quill Logo */}
          <div className="relative w-10 h-10 flex items-center justify-center">
            <svg
              className="w-10 h-10 drop-shadow-[0_0_8px_#ffd700]"
              viewBox="0 0 64 64"
              fill="none"
            >
              <path
                d="M56 8 C40 12 24 28 16 48 C20 44 26 42 32 40 C38 38 48 26 56 8 Z"
                fill="url(#featherGoldSidebar)"
              />
              <path d="M16 48 C14 52 10 58 6 62 C10 58 14 54 16 48 Z" fill="#ffd700" />
              <path
                d="M28 36 C34 30 42 20 48 14"
                stroke="#fff"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              <defs>
                <linearGradient id="featherGoldSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fff8db" />
                  <stop offset="50%" stopColor="#ffd700" />
                  <stop offset="100%" stopColor="#b8860b" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="font-cinzel text-2xl font-bold tracking-wider gold-gradient-text leading-none">
              Leviosa
            </h1>
            <span className="text-[10px] tracking-widest text-[#d4af37]/80 uppercase">
              Elevate Your Life.
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 relative group text-left ${
                  isActive
                    ? 'text-[#ffd700] bg-gradient-to-r from-[#ffd700]/20 via-[#ffd700]/10 to-transparent border border-[#ffd700]/50 shadow-[0_0_15px_rgba(255,215,0,0.18)]'
                    : 'text-slate-300 hover:text-[#ffd700] hover:bg-white/[0.04]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-[#ffd700]' : 'text-slate-400 group-hover:text-[#ffd700]'
                  }`}
                />
                <span className="tracking-wide">{item.label}</span>

                {isActive && (
                  <span className="absolute right-3 w-1.5 h-1.5 rounded-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]" />
                )}
              </button>
            );
          })}

          {/* Logout */}
          <button
            onClick={() => alert('Sesi tersimpan dengan aman.')}
            className="w-full flex items-center space-x-3.5 px-4 py-2.5 rounded-xl font-medium text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-colors duration-200 mt-2 text-left"
          >
            <LogOut className="w-4 h-4" />
            <span className="tracking-wide">Logout</span>
          </button>
        </nav>
      </div>

      {/* Hogwarts Shield & Motto */}
      <div className="pt-4 border-t border-[#d4af37]/20 flex flex-col items-center text-center">
        <div className="w-16 h-16 mb-2 relative group cursor-pointer">
          <svg className="w-full h-full drop-shadow-[0_0_10px_rgba(212,175,55,0.4)]" viewBox="0 0 100 100" fill="none">
            {/* Shield Outline */}
            <path
              d="M50 5 L88 22 C88 58 72 82 50 95 C28 82 12 58 12 22 Z"
              fill="#0e1529"
              stroke="url(#crestGoldSidebar)"
              strokeWidth="2.5"
            />
            <path
              d="M50 12 L80 26 C80 54 67 74 50 85 C33 74 20 54 20 26 Z"
              fill="rgba(212, 175, 55, 0.08)"
              stroke="#d4af37"
              strokeWidth="1"
            />
            {/* Letter H */}
            <text
              x="50"
              y="58"
              fontFamily="'Cinzel Decorative', serif"
              fontSize="34"
              fontWeight="900"
              fill="url(#crestGoldSidebar)"
              textAnchor="middle"
            >
              H
            </text>
            <circle
              cx="50"
              cy="50"
              r="30"
              stroke="rgba(255, 215, 0, 0.25)"
              strokeDasharray="3 3"
              fill="none"
            />
            <defs>
              <linearGradient id="crestGoldSidebar" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff0b3" />
                <stop offset="50%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#996515" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <p className="text-[11px] font-parchment leading-relaxed text-[#d4af37]/70 italic max-w-[200px]">
          "You don't need more time.<br />
          You need a smarter way to live it."
        </p>
      </div>
    </aside>
  );
};
