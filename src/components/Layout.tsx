import React, { useState } from 'react';
import {
  Atom,
  BookMarked,
  BookOpen,
  Calculator,
  FileText,
  FlaskConical,
  History,
  Leaf,
  LineChart,
  Menu,
  Moon,
  Sun,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  type LabTheme,
  type MotionMode,
  type NavSection,
  useSimulation,
} from '../context/SimulationContext';
import { formatSigned } from '../lib/utils';
import { LabButton } from './ui';
import { ReportModal } from './ReportModal';

interface NavItem {
  id: NavSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Live Home', icon: Atom },
  { id: 'simulator', label: 'Cell Simulator', icon: Calculator },
  { id: 'animation', label: 'Full Cell Stage', icon: FlaskConical },
  { id: 'graphs', label: 'Graph Explorer', icon: LineChart },
  { id: 'experiment', label: 'Experiment Lab', icon: FlaskConical },
  { id: 'learn', label: 'Learn Nernst', icon: BookOpen },
  { id: 'guide', label: 'Project Guide', icon: BookMarked },
  { id: 'history', label: 'Simulation History', icon: History },
];

const THEME_OPTIONS: Array<{
  id: LabTheme;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'carbon', label: 'Carbon', icon: Moon },
  { id: 'ivory', label: 'Ivory', icon: Sun },
  { id: 'forest', label: 'Forest', icon: Leaf },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const {
    activePage,
    setActivePage,
    params,
    result,
    motionMode,
    setMotionMode,
    theme,
    setTheme,
    setReportModalOpen,
    toastMessage,
  } = useSimulation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSelectNav = (id: NavSection) => {
    setActivePage(id);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: motionMode === 'reduced' ? 'auto' : 'smooth' });
  };

  const SidebarContent = (
    <div className="flex flex-col h-full bg-[var(--bg-surface)] border-r border-[var(--border-hairline)] transition-colors duration-200">
      {/* Brand Lockup */}
      <div className="px-5 h-16 flex items-center justify-between border-b border-[var(--border-hairline)]">
        <button
          type="button"
          onClick={() => handleSelectNav('overview')}
          className="flex items-center gap-2.5 text-left cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] flex items-center justify-center shrink-0">
            <Atom className="w-4.5 h-4.5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-[var(--text-primary)] whitespace-nowrap">
            NernstLab
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelectNav(item.id)}
              aria-current={active ? 'page' : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="sidebar-active-indicator"
                  transition={
                    motionMode === 'reduced'
                      ? { duration: 0 }
                      : { type: 'spring', stiffness: 360, damping: 30 }
                  }
                  className="absolute inset-0 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-soft)] -z-0"
                />
              )}
              <Icon
                className={`w-4 h-4 relative z-10 shrink-0 ${
                  active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                }`}
              />
              <span className="relative z-10">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Readout, Theme Switcher & Motion Accessibility */}
      <div className="p-4 border-t border-[var(--border-hairline)] space-y-4 bg-[var(--bg-surface-elevated)]">
        <div className="space-y-1">
          <div className="text-[11px] font-medium text-[var(--text-muted)]">Active Potential (E)</div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
              {result.isValid ? `${formatSigned(result.cellPotential, 3)} V` : 'Invalid'}
            </span>
            <span className="font-mono text-[11px] text-[var(--accent)]">
              {result.isValid ? `${result.temperatureK.toFixed(1)} K` : '—'}
            </span>
          </div>
          <div className="text-[11px] text-[var(--text-muted)] truncate">{params.cellName}</div>
        </div>

        {/* Non-Blue Theme Switcher */}
        <div className="space-y-1.5 pt-3 border-t border-[var(--border-hairline)]">
          <div className="text-[11px] font-medium text-[var(--text-muted)]">Lab Theme</div>
          <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
            {THEME_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className={`py-1.5 px-1 text-[11px] font-medium rounded-md flex items-center justify-center gap-1 transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-3 h-3 shrink-0" />
                  <span>{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Motion Setting */}
        <div className="space-y-1.5 pt-3 border-t border-[var(--border-hairline)]">
          <div className="text-[11px] font-medium text-[var(--text-muted)]">Animation Motion</div>
          <div className="grid grid-cols-3 gap-1 p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-hairline)]">
            {(['reduced', 'normal', 'enhanced'] as MotionMode[]).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setMotionMode(mode)}
                className={`py-1 text-[11px] font-medium rounded-md capitalize transition-colors cursor-pointer ${
                  motionMode === mode
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block w-[256px] shrink-0 sticky top-0 h-screen no-print">
        {SidebarContent}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden no-print">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/55 backdrop-blur-[1px]"
            />
            <motion.aside
              initial={{ x: -268 }}
              animate={{ x: 0 }}
              exit={{ x: -268 }}
              transition={{ duration: motionMode === 'reduced' ? 0 : 0.22 }}
              className="fixed inset-y-0 left-0 w-[268px] z-10 shadow-xl"
            >
              {SidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Scientific Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[var(--bg-surface)]/92 backdrop-blur-md border-b border-[var(--border-hairline)] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 no-print transition-colors duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-xs sm:text-sm min-w-0">
              <span className="font-semibold text-[var(--text-primary)] truncate">
                {params.cellName}
              </span>
              <span className="hidden sm:inline text-[var(--text-muted)]" aria-hidden="true">
                /
              </span>
              <span className="hidden sm:inline font-mono text-xs text-[var(--text-secondary)] truncate">
                {params.notation}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden xl:flex items-center gap-3 text-xs font-mono text-[var(--text-secondary)] mr-1">
              <span>
                E ={' '}
                <strong className="text-[var(--accent)]">
                  {result.isValid
                    ? `${formatSigned(result.cellPotential, params.precision)} V`
                    : 'ERR'}
                </strong>
              </span>
              <span className="text-[var(--border-strong)]" aria-hidden="true">
                ·
              </span>
              <span>
                T ={' '}
                <strong className="text-[var(--text-primary)]">
                  {result.isValid ? `${result.temperatureK.toFixed(1)} K` : '—'}
                </strong>
              </span>
            </div>

            <LabButton
              variant="secondary"
              size="sm"
              onClick={() => handleSelectNav('guide')}
            >
              <BookMarked className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">How to Use</span>
            </LabButton>

            <LabButton
              variant="secondary"
              size="sm"
              onClick={() =>
                setTheme(theme === 'carbon' ? 'ivory' : theme === 'ivory' ? 'forest' : 'carbon')
              }
              title="Switch Theme (Carbon Amber, Ivory Paper, Forest Emerald)"
            >
              {theme === 'ivory' ? (
                <Sun className="w-3.5 h-3.5" />
              ) : theme === 'forest' ? (
                <Leaf className="w-3.5 h-3.5" />
              ) : (
                <Moon className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">
                {theme === 'carbon' ? 'Carbon' : theme === 'ivory' ? 'Ivory' : 'Forest'}
              </span>
            </LabButton>

            <LabButton variant="primary" size="sm" onClick={() => setReportModalOpen(true)}>
              <FileText className="w-3.5 h-3.5" />
              Export Report
            </LabButton>
          </div>
        </header>

        {/* Main View Content */}
        <main className="flex-1 w-full max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={motionMode === 'reduced' ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={motionMode === 'reduced' ? { opacity: 0 } : { opacity: 0, y: -6 }}
              transition={{ duration: motionMode === 'reduced' ? 0 : 0.18 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Scientific Report Modal */}
      <ReportModal />

      {/* Subtle Toast Confirmation */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18 }}
            role="status"
            aria-live="polite"
            className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-xl bg-[var(--bg-surface)] text-[var(--text-primary)] text-xs font-medium shadow-xl border border-[var(--accent-border)] no-print"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
