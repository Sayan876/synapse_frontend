
import React, { useState, useRef, useEffect } from 'react';
import {
  Brain,
  MessageSquare,
  Search,
  Layers,
  Upload,
  PanelLeft,
  FileText,
  ChevronRight,
  LogOut,
  Shield,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDocumentStore } from '../store/documentStore';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';

interface NavbarProps {
  onUploadClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onUploadClick }) => {
  const {
    activeTab,
    setActiveTab,
    isSidebarOpen,
    setIsSidebarOpen,
    documents,
    selectedDocumentId,
  } = useDocumentStore();

  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const tabs: {
    id: 'chat' | 'search' | 'chunks';
    label: string;
    icon: React.FC<{ className?: string }>;
  }[] = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'chunks', label: 'Chunks', icon: Layers },
  ];

  const selectedDoc = documents.find(
    (document) => document.id === selectedDocumentId
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
    navigate('/login', { replace: true });
  };

  const getInitials = (name?: string) => {
    if (!name?.trim()) return 'U';

    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center border-b border-white/[0.07] bg-[#101012]/95 px-3 backdrop-blur-xl sm:px-5 lg:px-6">
      {/* Subtle top accent */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/30 to-transparent" />

      {/* Left: Sidebar + Brand */}
      <div className="flex w-auto shrink-0 items-center gap-2.5 sm:gap-3 lg:w-[260px]">
        <button
          type="button"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          aria-pressed={isSidebarOpen}
          title={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          className={clsx(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all duration-200',
            isSidebarOpen
              ? 'border-white/[0.06] text-zinc-400 hover:border-white/[0.12] hover:bg-white/[0.04] hover:text-white'
              : 'border-rose-500/20 bg-rose-500/[0.07] text-rose-400 hover:bg-rose-500/[0.12]'
          )}
        >
          <PanelLeft className="h-[17px] w-[17px]" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          aria-label="Synapse home"
          className="group flex min-w-0 items-center gap-2.5 rounded-lg text-left"
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-500/25 bg-gradient-to-br from-rose-500/[0.18] to-rose-950/20 shadow-[0_0_18px_rgba(225,29,72,0.08)] transition-shadow group-hover:shadow-[0_0_22px_rgba(225,29,72,0.18)]">
            <Brain className="h-[19px] w-[19px] text-rose-400" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-[#101012] bg-rose-500" />
          </div>

          <div className="min-w-0">
            <span className="block text-[15px] font-bold tracking-tight text-white">
              Synapse
            </span>
            <span className="hidden text-[9px] font-medium uppercase tracking-[0.16em] text-zinc-600 sm:block">
              Knowledge workspace
            </span>
          </div>
        </button>
      </div>

      {/* Center: Navigation */}
      <nav
        aria-label="Main navigation"
        className="flex min-w-0 flex-1 items-center justify-center"
      >
        <div className="flex items-center gap-0.5 rounded-xl border border-white/[0.07] bg-[#171719] p-1">
          {tabs.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={label}
                title={label}
                className={clsx(
                  'relative flex h-9 items-center justify-center gap-2 rounded-lg px-2.5 text-xs font-medium transition-all duration-200 sm:px-4 sm:text-sm',
                  isActive
                    ? 'border border-rose-500/20 bg-rose-500/[0.10] text-rose-300 shadow-sm'
                    : 'border border-transparent text-zinc-500 hover:bg-white/[0.04] hover:text-zinc-200'
                )}
              >
                <Icon
                  className={clsx(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-rose-400' : ''
                  )}
                />

                {/* Hide labels on mobile; show them from sm (640px) upward */}
                <span className="hidden sm:inline">{label}</span>

                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-rose-500" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Right: Document context + Upload + Account */}
      <div className="flex shrink-0 items-center justify-end gap-2 sm:gap-3 lg:w-[260px]">
        {/* Selected document */}
        {selectedDoc && (
          <div
            title={selectedDoc.filename}
            className="hidden max-w-[170px] items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-2.5 py-2 xl:flex"
          >
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-500/[0.08]">
              <FileText className="h-3.5 w-3.5 text-rose-400" />
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-medium uppercase tracking-wider text-zinc-600">
                Active document
              </p>
              <p className="max-w-[115px] truncate text-[11px] font-medium text-zinc-300">
                {selectedDoc.filename}
              </p>
            </div>

            <ChevronRight className="h-3 w-3 shrink-0 text-zinc-600" />
          </div>
        )}

        {/* Upload */}
        <button
          type="button"
          onClick={onUploadClick}
          className="group inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white shadow-[0_3px_14px_rgba(225,29,72,0.13)] transition-all duration-200 hover:bg-rose-500 hover:shadow-[0_3px_18px_rgba(225,29,72,0.22)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#101012] sm:px-3.5 sm:text-sm"
        >
          <Upload className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5" />
          <span className="hidden sm:inline">Upload</span>
        </button>

        {/* User menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-haspopup="menu"
            aria-label="Open account menu"
            className={clsx(
              'flex h-10 items-center gap-2 rounded-xl border p-1.5 pr-2 transition-all duration-200',
              isMenuOpen
                ? 'border-rose-500/25 bg-rose-500/[0.06]'
                : 'border-white/[0.07] bg-white/[0.025] hover:border-white/[0.13] hover:bg-white/[0.045]'
            )}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-rose-500/20 bg-gradient-to-br from-rose-500/20 to-rose-950/30 text-[10px] font-bold text-rose-300">
              {getInitials(user?.username)}
            </div>

            <span className="hidden max-w-[90px] truncate text-xs font-medium text-zinc-300 md:block">
              {user?.username || 'Account'}
            </span>

            <ChevronDown
              className={clsx(
                'hidden h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 sm:block',
                isMenuOpen && 'rotate-180 text-rose-400'
              )}
            />
          </button>

          {isMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2.5 w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-2xl border border-white/[0.09] bg-[#151517] shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
            >
              {/* Account header */}
              <div className="border-b border-white/[0.07] bg-gradient-to-br from-rose-500/[0.06] to-transparent p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-500/20 bg-rose-500/[0.09] text-xs font-bold text-rose-300">
                    {getInitials(user?.username)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {user?.username || 'User'}
                    </p>

                    <p className="mt-1 truncate text-xs text-zinc-500">
                      {user?.email || 'Signed-in account'}
                    </p>
                  </div>
                </div>

                {user?.role && (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-rose-500/15 bg-rose-500/[0.06] px-2 py-1">
                    <Shield className="h-3 w-3 text-rose-400" />
                    <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-rose-300">
                      {user.role}
                    </span>
                  </div>
                )}
              </div>

              {/* Menu options */}
              <div className="p-2">
                <div className="mb-1 flex items-center gap-2 px-3 py-2">
                  <Sparkles className="h-3.5 w-3.5 text-zinc-600" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                    Workspace account
                  </span>
                </div>

                <div className="mx-2 mb-2 border-t border-white/[0.05]" />

                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-rose-500/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.035] transition group-hover:border-rose-500/20 group-hover:bg-rose-500/[0.08]">
                    <LogOut className="h-4 w-4 text-zinc-400 transition group-hover:text-rose-400" />
                  </div>

                  <div className="flex-1">
                    <p className="text-xs font-medium text-zinc-200 transition group-hover:text-rose-300">
                      Sign out
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-600">
                      End your current session
                    </p>
                  </div>

                  <ChevronRight className="h-3.5 w-3.5 text-zinc-600 transition group-hover:translate-x-0.5 group-hover:text-rose-400" />
                </button>
              </div>

              {/* Dropdown footer */}
              <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
                <span className="text-[10px] font-semibold tracking-tight text-zinc-500">
                  Synapse
                </span>
                <span className="text-[9px] text-zinc-600">
                  Knowledge workspace
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
