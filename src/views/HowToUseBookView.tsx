import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Atom,
  BookMarked,
  BookOpen,
  Calculator,
  ChevronLeft,
  ChevronRight,
  FileText,
  FlaskConical,
  History,
  LineChart,
  Palette,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LabButton, LabCard, SectionHeader } from '../components/ui';
import { type NavSection, useSimulation } from '../context/SimulationContext';

interface BookChapter {
  page: number;
  chapterLabel: string;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  targetPage: NavSection;
  ctaLabel: string;
  steps: Array<{
    heading: string;
    detail: string;
  }>;
  proTip: string;
  quickFormula?: string;
}

const BOOK_CHAPTERS: BookChapter[] = [
  {
    page: 1,
    chapterLabel: 'Chapter 01',
    title: 'Quick Start & Live Interactive Home',
    subtitle: 'Control the live electrochemical cell, drag molarity/temperature sliders, and inspect components directly on the Home Page.',
    icon: Atom,
    targetPage: 'overview',
    ctaLabel: 'Open Live Home',
    steps: [
      {
        heading: '1. Watch Live Electron & Ion Flow',
        detail:
          'The moment you open NernstLab (Live Home), the animated cell shows metal dissolving at the anode, electrons moving through the external wire, cations plating onto the cathode, and K⁺ / NO₃⁻ ions balancing charge inside the salt bridge.',
      },
      {
        heading: '2. Drag Sliders Beside the Cell',
        detail:
          'Adjust Temperature, Anode Concentration, Cathode Concentration, or Electron Count (n) right next to the cell diagram. Watch the digital voltmeter, ion density, bubble agitation, and circular voltage gauge react instantaneously.',
      },
      {
        heading: '3. Click Any Component to Inspect',
        detail:
          'Click the Left Electrode, Right Electrode, Salt Bridge, or Digital Voltmeter directly inside the live diagram to inspect half-reactions, individual Nernst half-cell potentials, and electroneutrality mechanisms.',
      },
      {
        heading: '4. Control Playback & Step Mode',
        detail:
          'Use Play, Pause, Slow-Mo, Speed (0.25×–3.0×), Reverse Direction, or Step to walk through the 4 mechanistic redox stages one frame at a time.',
      },
    ],
    proTip:
      'Electron flow direction is never hardcoded—try selecting Concentration Cell or flipping reaction direction to watch electrons and salt-bridge ions dynamically reverse!',
    quickFormula: 'Spontaneous Flow: E > 0 V  ⇒  Anode (−) → External Wire → Cathode (+)',
  },
  {
    page: 2,
    chapterLabel: 'Chapter 02',
    title: 'Using the Nernst Equation Calculator',
    subtitle: 'Perform exact thermodynamic calculations with full step-by-step substitution and validation.',
    icon: Calculator,
    targetPage: 'simulator',
    ctaLabel: 'Open Cell Simulator',
    steps: [
      {
        heading: '1. Enter Standard Potential & Temperature',
        detail:
          'Edit E° directly or let NernstLab calculate E° = E°(cathode) − E°(anode). Toggle between Kelvin (K) and Celsius (°C) anytime without losing your thermodynamic state.',
      },
      {
        heading: '2. Configure Ion Molarities or Direct Q',
        detail:
          'Switch between "Ion Molarities" (with editable stoichiometric exponents νₐ and ν_c) and "Direct Q" mode to test any reaction quotient directly.',
      },
      {
        heading: '3. Inspect Both Logarithm Forms',
        detail:
          'Review the live step-by-step panel showing both the general natural-log form E = E° − (RT/nF)ln(Q) and the base-10 / 25 °C form E = E° − (0.05916/n)log₁₀(Q).',
      },
      {
        heading: '4. Adjust Precision & Copy Work',
        detail:
          'Choose 2 to 5 decimal places, read real-time validation warnings if you enter invalid values (such as 0 M concentration or boiling temperatures), and click Copy Calculation for lab notes.',
      },
    ],
    proTip:
      'Use the Forward / Reverse toggle in the simulator header to flip the cell reaction—NernstLab automatically negates E°, inverts Q to 1/Q, and updates ΔG.',
    quickFormula: 'E = E° − (RT / nF) ln(Q)   |   ΔG = −nFE',
  },
  {
    page: 3,
    chapterLabel: 'Chapter 03',
    title: 'Preset Cells & Custom Cell Builder',
    subtitle: 'Switch between classic laboratory cells or engineer your own electrochemical couple.',
    icon: Palette,
    targetPage: 'simulator',
    ctaLabel: 'Build a Custom Cell',
    steps: [
      {
        heading: '1. Instant Reference Presets',
        detail:
          'Select Daniell Cell (Zn–Cu, +1.103 V), Iron–Copper (+0.787 V), Copper Concentration Cell (E° = 0 V), or Zinc–Silver (+1.563 V, asymmetric stoichiometry) with a single click.',
      },
      {
        heading: '2. Explore Concentration Cells',
        detail:
          'Choose the Concentration Cell preset to see how two identical copper electrodes still produce voltage purely from a molarity difference (0.01 M vs 1.00 M).',
      },
      {
        heading: '3. Design Your Own Custom Cell',
        detail:
          'Click "Custom Cell" in the Cell Simulator to enter your own anode/cathode metals, chemical symbols, oxidation/reduction half-reactions, and standard reduction potentials E°_red.',
      },
    ],
    proTip:
      'Every preset or custom cell you configure automatically synchronizes across the main animation, all four Recharts graphs, and PDF reports.',
    quickFormula: 'E°_cell = E°_red(Cathode) − E°_red(Anode)',
  },
  {
    page: 4,
    chapterLabel: 'Chapter 04',
    title: 'Exploring & Exporting Live Graphs',
    subtitle: 'Visualize voltage sensitivity across temperature, molarity, and reaction quotient.',
    icon: LineChart,
    targetPage: 'graphs',
    ctaLabel: 'Open Graph Explorer',
    steps: [
      {
        heading: '1. Four Synchronized Scientific Plots',
        detail:
          'Inspect E vs Temperature, E vs Ion Concentration (Cathode or Anode sweep), E vs Reaction Quotient Q, and a comparative bar breakdown of E°, Nernst Correction, and Actual E.',
      },
      {
        heading: '2. Toggle Linear vs Logarithmic Axes',
        detail:
          'Switch Concentration and Q charts to log₁₀ scale to reveal the straight-line Nernst slope (−59.16 mV / n per decade at 25 °C).',
      },
      {
        heading: '3. Scrub, Zoom & Filter Series',
        detail:
          'Drag the sliders beneath each chart to watch the live marker dot glide along the curve. Toggle Actual E and Standard E° curves on/off or use Zoom In / Zoom Out / Reset Zoom.',
      },
      {
        heading: '4. Export High-Resolution PNG & CSV',
        detail:
          'Click the download icon on any chart to save a clean PNG image for lab assignments, or export the exact plotted coordinates as a CSV spreadsheet.',
      },
    ],
    proTip:
      'When Q = 1.00, the E vs Temperature line is completely horizontal because ln(1) = 0. Change either ion concentration slightly to see the linear thermal slope tilt!',
  },
  {
    page: 5,
    chapterLabel: 'Chapter 05',
    title: 'Guided Experiment & Prediction Labs',
    subtitle: 'Run a 7-step hypothesis workflow or isolate temperature and concentration variables.',
    icon: FlaskConical,
    targetPage: 'experiment',
    ctaLabel: 'Open Experiment Lab',
    steps: [
      {
        heading: '1. Complete the 7-Step Guided Lab',
        detail:
          'Pick a cell, set initial conditions, select a scientific hypothesis, record a baseline voltage, modify one variable, inspect the before-vs-after bar chart, and review an automated conclusion.',
      },
      {
        heading: '2. Animate Thermal Ramps (Temperature Lab)',
        detail:
          'Enter a target temperature to calculate predicted voltage shift (ΔE and %) and press "Animate Heating / Cooling" to watch solution ions accelerate in the kinetic box.',
      },
      {
        heading: '3. Test Molarity Ratios (Concentration Lab)',
        detail:
          'Click quick ratios (1:100, 1:10, 1:1, 10:1, 100:1) to visually compare particle densities inside dual anode and cathode beakers alongside real-time Q and E readouts.',
      },
    ],
    proTip:
      'Use the Learning Center ("Learn Nernst") alongside the Guided Lab to click individual symbols in E = E° − (RT/nF)ln(Q) and verify how each term drives your result.',
  },
  {
    page: 6,
    chapterLabel: 'Chapter 06',
    title: 'History, Comparisons, Themes & Reports',
    subtitle: 'Archive experiments locally, compare up to 3 trials, switch themes, and print reports.',
    icon: History,
    targetPage: 'history',
    ctaLabel: 'Open Simulation History',
    steps: [
      {
        heading: '1. Save, Rename & Reload Trials',
        detail:
          'Click "Save Snapshot" or "Save Run" anytime to store your parameters in browser storage (no login required). Rename labels inline or reload any saved trial back into the live simulator.',
      },
      {
        heading: '2. Compare Up to 3 Simulations',
        detail:
          'Check up to three rows in Simulation History to view a side-by-side comparison table, largest potential/temperature spread highlights, and a comparative grouped bar chart.',
      },
      {
        heading: '3. Export PDF, CSV & Printable Reports',
        detail:
          'Click "Export Report" in the top bar to download a formatted PDF technical report, export CSV parameters, copy plain-text notes, or print cleanly.',
      },
      {
        heading: '4. Customize Theme & Motion Accessibility',
        detail:
          'Switch seamlessly between Carbon Amber (dark graphite), Ivory Paper (clean light), and Forest Lab (emerald dark) themes in the top bar or sidebar, and choose Reduced, Normal, or Enhanced animation speeds.',
      },
    ],
    proTip:
      'Use your Left and Right keyboard arrow keys while reading this handbook to flip pages effortlessly!',
  },
];

export function HowToUseBookView() {
  const { setActivePage, motionMode, setReportModalOpen } = useSimulation();
  const [pageIndex, setPageIndex] = useState(0);

  const chapter = BOOK_CHAPTERS[pageIndex];
  const ChapterIcon = chapter.icon;

  // Keyboard arrow flipping support
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        setPageIndex((i) => Math.min(i + 1, BOOK_CHAPTERS.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setPageIndex((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Project Guide — How to Use NernstLab"
        subtitle="Complete project documentation and interactive 6-chapter handbook explaining the purpose of NernstLab and how to use every simulator tool, live animation, chart, and report."
        action={
          <div className="flex items-center gap-2">
            <LabButton
              variant="secondary"
              size="sm"
              disabled={pageIndex === 0}
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
              Prev Page
            </LabButton>
            <span className="font-mono text-xs text-[var(--text-muted)] px-1">
              Page {pageIndex + 1} / {BOOK_CHAPTERS.length}
            </span>
            <LabButton
              variant="primary"
              size="sm"
              disabled={pageIndex === BOOK_CHAPTERS.length - 1}
              onClick={() => setPageIndex((i) => Math.min(BOOK_CHAPTERS.length - 1, i + 1))}
            >
              Next Page
              <ChevronRight className="w-4 h-4" />
            </LabButton>
          </div>
        }
      />

      {/* Project Overview Card: What this web app is & Recommended Workflow */}
      <LabCard className="p-5 sm:p-6">
        <div className="grid lg:grid-cols-12 gap-5 items-center">
          <div className="lg:col-span-5 space-y-2">
            <div className="text-[11px] font-mono font-semibold text-[var(--accent)]">
              ABOUT THIS PROJECT
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
              What is NernstLab?
            </h2>
            <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
              NernstLab is an interactive electrochemical simulation and learning web application built around the{' '}
              <strong className="text-[var(--text-primary)]">Nernst Equation</strong>. Instead of solving repetitive logarithmic calculations by hand, you can manipulate ion concentrations, temperature, stoichiometry, and electrode couples in real time and immediately see voltage, electron flow, and thermodynamic graphs respond.
            </p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-1">
              <div className="font-mono text-[11px] font-semibold text-[var(--accent)]">WORKFLOW 01</div>
              <div className="font-semibold text-[var(--text-primary)]">Simulate on Live Home</div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Pick a preset cell and drag Temperature or Molarity sliders right next to the animated cell.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-1">
              <div className="font-mono text-[11px] font-semibold text-[var(--accent)]">WORKFLOW 02</div>
              <div className="font-semibold text-[var(--text-primary)]">Analyze & Experiment</div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Check step-by-step math in Cell Simulator, plot trends in Graph Explorer, or run the 7-Step Lab.
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-1">
              <div className="font-mono text-[11px] font-semibold text-[var(--accent)]">WORKFLOW 03</div>
              <div className="font-semibold text-[var(--text-primary)]">Save & Export Reports</div>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                Save runs locally, compare up to 3 trials side-by-side, and export PDF, CSV, or PNG charts.
              </p>
            </div>
          </div>
        </div>
      </LabCard>

      {/* Open Laboratory Book Spread */}
      <div className="rounded-2xl border border-[var(--border-strong)] bg-[var(--book-paper)] shadow-[0_12px_36px_rgba(0,0,0,0.22)] overflow-hidden">
        <div className="grid lg:grid-cols-12 min-h-[560px]">
          {/* LEFT PAGE: Book Cover / Table of Contents & Quick Reference */}
          <div className="lg:col-span-4 p-6 lg:p-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[var(--border-hairline)] bg-[var(--bg-surface)] relative">
            {/* Subtle Spine Shadow on Desktop */}
            <div
              aria-hidden="true"
              className="hidden lg:block pointer-events-none absolute top-0 right-0 bottom-0 w-5 bg-gradient-to-l from-[var(--book-spine)]/60 to-transparent"
            />

            <div className="space-y-5 relative z-10">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--border-hairline)]">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent)] flex items-center justify-center shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-[var(--accent)] font-semibold">
                    LABORATORY FIELD MANUAL
                  </div>
                  <h2 className="text-base font-bold text-[var(--text-primary)]">
                    How to Use NernstLab
                  </h2>
                </div>
              </div>

              {/* Chapter Index */}
              <div className="space-y-1.5">
                <div className="text-xs font-semibold text-[var(--text-muted)] px-2 pb-1">
                  Table of Contents
                </div>
                {BOOK_CHAPTERS.map((ch, idx) => {
                  const Icon = ch.icon;
                  const active = idx === pageIndex;
                  return (
                    <button
                      key={ch.page}
                      type="button"
                      onClick={() => setPageIndex(idx)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all cursor-pointer ${
                        active
                          ? 'bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--text-primary)]'
                          : 'border border-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                      }`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-semibold truncate">{ch.title}</div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)]">
                          {ch.chapterLabel} · p. {ch.page}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Book Quick Legend Footer */}
            <div className="mt-6 pt-4 border-t border-[var(--border-hairline)] space-y-2 text-xs relative z-10">
              <div className="flex items-center gap-2 font-semibold text-[var(--text-primary)]">
                <BookMarked className="w-3.5 h-3.5 text-[var(--accent)]" />
                <span>Quick Visual Legend</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-[var(--text-secondary)] font-mono">
                <span>e⁻ glow: Electron flow</span>
                <span>K⁺ / NO₃⁻: Salt bridge</span>
                <span>E &gt; 0 V: Spontaneous</span>
                <span>E = 0 V: Equilibrium</span>
              </div>
            </div>
          </div>

          {/* RIGHT PAGE: Active Chapter Spread */}
          <div className="lg:col-span-8 p-6 lg:p-8 flex flex-col justify-between bg-[var(--book-paper)] relative">
            {/* Subtle Left Spine Shadow */}
            <div
              aria-hidden="true"
              className="hidden lg:block pointer-events-none absolute top-0 left-0 bottom-0 w-5 bg-gradient-to-r from-[var(--book-spine)]/50 to-transparent"
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={chapter.page}
                initial={motionMode === 'reduced' ? false : { opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                exit={motionMode === 'reduced' ? { opacity: 0 } : { opacity: 0, x: -14 }}
                transition={{ duration: motionMode === 'reduced' ? 0 : 0.2 }}
                className="space-y-6 relative z-10"
              >
                {/* Chapter Heading */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent)] font-semibold">
                      <ChapterIcon className="w-4 h-4" />
                      <span>{chapter.chapterLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>Page {chapter.page} of {BOOK_CHAPTERS.length}</span>
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
                      {chapter.title}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
                      {chapter.subtitle}
                    </p>
                  </div>
                </div>

                {/* Numbered Steps */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {chapter.steps.map((s) => (
                    <div
                      key={s.heading}
                      className="p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-hairline)] space-y-1.5"
                    >
                      <div className="text-sm font-bold text-[var(--text-primary)]">{s.heading}</div>
                      <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                        {s.detail}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Formula Reference Strip if present */}
                {chapter.quickFormula && (
                  <div className="px-4 py-3 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-hairline)] font-mono text-xs text-[var(--text-primary)] text-center">
                    {chapter.quickFormula}
                  </div>
                )}

                {/* Lab Tip Callout */}
                <div className="p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-xs leading-relaxed text-[var(--text-primary)]">
                  <strong className="font-semibold text-[var(--accent)]">Laboratory Tip: </strong>
                  {chapter.proTip}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Right Page Footer Navigation */}
            <div className="mt-8 pt-4 border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3 relative z-10">
              <div className="flex items-center gap-2">
                <LabButton
                  variant="primary"
                  size="sm"
                  onClick={() => setActivePage(chapter.targetPage)}
                >
                  {chapter.ctaLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </LabButton>
                {chapter.page === 6 && (
                  <LabButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Preview Report Modal
                  </LabButton>
                )}
              </div>

              {/* Page Dots & Arrows */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={pageIndex === 0}
                  onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                  className="p-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-35 cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1.5">
                  {BOOK_CHAPTERS.map((ch, idx) => (
                    <button
                      key={ch.page}
                      type="button"
                      onClick={() => setPageIndex(idx)}
                      aria-label={`Go to page ${ch.page}`}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === pageIndex
                          ? 'w-6 bg-[var(--accent)]'
                          : 'w-2 bg-[var(--border-strong)] hover:bg-[var(--text-muted)]'
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  disabled={pageIndex === BOOK_CHAPTERS.length - 1}
                  onClick={() => setPageIndex((i) => Math.min(BOOK_CHAPTERS.length - 1, i + 1))}
                  className="p-1.5 rounded-lg border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-35 cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Quick-Reference Cheat Sheet */}
      <LabCard className="p-5">
        <div className="grid sm:grid-cols-3 gap-5 text-xs">
          <div className="space-y-1">
            <div className="font-semibold text-[var(--text-primary)]">Physical Constants Used</div>
            <div className="font-mono text-[var(--text-secondary)]">R = 8.31446 J·mol⁻¹·K⁻¹</div>
            <div className="font-mono text-[var(--text-secondary)]">F = 96,485.33 C·mol⁻¹</div>
            <div className="font-mono text-[var(--text-secondary)]">2.3026·RT/F (25 °C) = 0.05916 V</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-[var(--text-primary)]">Spontaneity Sign Rules</div>
            <div className="text-[var(--text-secondary)]">E &gt; 0 V and ΔG &lt; 0 → Spontaneous galvanic cell</div>
            <div className="text-[var(--text-secondary)]">E = 0 V and ΔG = 0 → Dynamic equilibrium (Q = K)</div>
            <div className="text-[var(--text-secondary)]">E &lt; 0 V and ΔG &gt; 0 → Reverse reaction favored</div>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-[var(--text-primary)]">Keyboard & Accessibility</div>
            <div className="text-[var(--text-secondary)]">Use ← / → arrows inside this book to turn pages</div>
            <div className="text-[var(--text-secondary)]">Use Theme Switcher for Carbon Amber, Ivory Paper, or Forest Lab</div>
            <div className="text-[var(--text-secondary)]">Set Reduced Motion in sidebar for static accessibility mode</div>
          </div>
        </div>
      </LabCard>
    </div>
  );
}
