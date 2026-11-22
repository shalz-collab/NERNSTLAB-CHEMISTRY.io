import {
  Activity,
  ArrowRight,
  BookMarked,
  BookmarkPlus,
  Calculator,
  FlaskConical,
  LineChart,
  RotateCcw,
} from 'lucide-react';
import { CellVisualization } from '../components/CellVisualization';
import { InsightsPanel } from '../components/InsightsPanel';
import { VoltageGauge } from '../components/VoltageGauge';
import {
  LabButton,
  LabCard,
  ParameterSlider,
  SegmentedControl,
} from '../components/ui';
import { useSimulation } from '../context/SimulationContext';
import { CELL_PRESETS, type PresetId } from '../lib/nernst';
import { formatNum, formatScientific, formatSigned } from '../lib/utils';

const QUICK_GUIDE_STEPS = [
  {
    num: '01',
    title: 'Choose Any Electrochemical Cell',
    body: 'Click Daniell (Zn–Cu), Iron–Copper, Concentration Cell, or Zinc–Silver above the live cell — or open Cell Simulator to build your own Custom Cell.',
  },
  {
    num: '02',
    title: 'Drag Live Temperature & Concentration Sliders',
    body: 'Move the sliders on the right panel to change Kelvin/Celsius temperature and ion molarities. The animated ions, electron speed, and voltmeter update instantly.',
  },
  {
    num: '03',
    title: 'Click Electrodes, Salt Bridge & Controls',
    body: 'Click directly on the Anode, Cathode, Salt Bridge, or Digital Voltmeter to inspect real half-reactions, or use Play, Step, Slow-Mo, and Reverse Direction.',
  },
  {
    num: '04',
    title: 'Explore Graphs, Experiments & PDF Reports',
    body: 'Switch tabs in the left sidebar to inspect 4 live Recharts graphs, run the 7-step Experiment Lab, compare up to 3 saved runs, or download a PDF lab report.',
  },
];

export function OverviewView() {
  const {
    params,
    result,
    insights,
    selectPreset,
    updateParams,
    switchTemperatureUnit,
    setActivePage,
    resetSimulation,
    saveCurrentSimulation,
    isSimulating,
  } = useSimulation();

  const p = params.precision;
  const presetIds: Array<Exclude<PresetId, 'custom'>> = [
    'daniell',
    'iron-copper',
    'concentration',
    'silver-zinc',
  ];

  return (
    <div className="space-y-6">
      {/* ABOVE-THE-FOLD LIVE INTERACTIVE HOME TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="font-semibold text-[var(--accent)]">Live Interactive Workbench</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{params.notation}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            NernstLab Live Electrochemical Simulator
          </h1>
        </div>

        {/* Instant Preset Selector Strip right at the top */}
        <div className="flex flex-wrap items-center gap-1.5">
          {presetIds.map((id) => {
            const preset = CELL_PRESETS[id];
            const active = params.presetId === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectPreset(id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent font-semibold'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
                }`}
              >
                {preset.shortName}
              </button>
            );
          })}
          <LabButton variant="ghost" size="sm" onClick={resetSimulation} title="Reset to standard state">
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </LabButton>
        </div>
      </div>

      {/* PRIMARY ABOVE-THE-FOLD INTERACTIVE STAGE (CELL ANIMATION + LIVE CONTROLS) */}
      <div className="grid xl:grid-cols-12 gap-6 items-start">
        {/* Left (~67%): Full Interactive Animated Cell + Clickable Component Inspector */}
        <div className="xl:col-span-8">
          <CellVisualization showControls interactiveInspect />
        </div>

        {/* Right (~33%): Live Voltage Gauge + Interactive Sliders */}
        <div className="xl:col-span-4 space-y-4">
          <LabCard className="p-5 space-y-4">
            {/* Compact Gauge + Live Potential Summary */}
            <div className="flex flex-col items-center pb-3 border-b border-[var(--border-hairline)]">
              <VoltageGauge
                voltage={result.cellPotential}
                standardVoltage={result.effectiveStandardPotential}
                precision={p}
                isValid={result.isValid}
                size={196}
              />
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-xs">
                <span
                  className={
                    !result.isValid
                      ? 'text-rose-500 font-semibold'
                      : result.spontaneity === 'spontaneous'
                      ? 'text-emerald-500 font-semibold'
                      : result.spontaneity === 'non-spontaneous'
                      ? 'text-amber-500 font-semibold'
                      : 'text-[var(--text-muted)] font-semibold'
                  }
                >
                  {result.spontaneityLabel}
                </span>
                <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
                <span className="font-mono text-[var(--text-secondary)]">
                  ΔG = {result.isValid ? `${formatNum(result.gibbsFreeEnergyKJ, 1)} kJ/mol` : '—'}
                </span>
              </div>
            </div>

            {/* Live Temperature Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Temperature</span>
                <SegmentedControl
                  value={params.temperatureUnit}
                  onChange={switchTemperatureUnit}
                  options={[
                    { value: 'K', label: 'K' },
                    { value: 'C', label: '°C' },
                  ]}
                />
              </div>
              <ParameterSlider
                label="Solution Temp"
                value={params.temperatureValue}
                min={params.temperatureUnit === 'K' ? 273.15 : 0}
                max={params.temperatureUnit === 'K' ? 373.15 : 100}
                step={1}
                unit={params.temperatureUnit === 'K' ? 'K' : '°C'}
                displayValue={formatNum(params.temperatureValue, 1)}
                onChange={(v) => updateParams({ temperatureValue: v })}
              />
            </div>

            {/* Live Anode Concentration Slider */}
            <div className="pt-2 border-t border-[var(--border-hairline)]">
              <ParameterSlider
                label={`Anode [${params.anodeIonFormula}]`}
                value={params.anodeConc}
                min={0.005}
                max={3.0}
                step={0.01}
                unit="M"
                displayValue={formatNum(params.anodeConc, 3)}
                onChange={(v) =>
                  updateParams({ useManualQ: false, anodeConc: Number(v.toFixed(3)) })
                }
              />
            </div>

            {/* Live Cathode Concentration Slider */}
            <div className="pt-2 border-t border-[var(--border-hairline)]">
              <ParameterSlider
                label={`Cathode [${params.cathodeIonFormula}]`}
                value={params.cathodeConc}
                min={0.005}
                max={3.0}
                step={0.01}
                unit="M"
                displayValue={formatNum(params.cathodeConc, 3)}
                onChange={(v) =>
                  updateParams({ useManualQ: false, cathodeConc: Number(v.toFixed(3)) })
                }
              />
            </div>

            {/* Electron count & Direction quick row */}
            <div className="pt-3 border-t border-[var(--border-hairline)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--text-muted)]">n:</span>
                {[1, 2, 3].map((nVal) => (
                  <button
                    key={nVal}
                    type="button"
                    onClick={() => updateParams({ electronsN: nVal })}
                    className={`w-6 h-6 rounded-md font-mono text-xs font-semibold cursor-pointer ${
                      params.electronsN === nVal
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {nVal}
                  </button>
                ))}
              </div>
              <LabButton
                variant="secondary"
                size="sm"
                onClick={() => saveCurrentSimulation()}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                Save Trial
              </LabButton>
            </div>
          </LabCard>
        </div>
      </div>

      {/* 4-COLUMN LIVE THERMODYNAMIC TELEMETRY STRIP */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <LabCard className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Standard E° & Shift</div>
          <div className="mt-1 font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
            {result.isValid ? `${formatSigned(result.effectiveStandardPotential, p)} V` : '—'}
          </div>
          <div
            className={`mt-1 text-xs font-mono ${
              result.nernstCorrection >= 0 ? 'text-emerald-500' : 'text-amber-500'
            }`}
          >
            Correction: {result.isValid ? `${formatSigned(result.nernstCorrection, p)} V` : '—'}
          </div>
        </LabCard>

        <LabCard className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Temperature</div>
          <div className="mt-1 font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
            {result.isValid ? formatNum(result.temperatureK, 2) : '—'}
            <span className="text-xs font-normal text-[var(--text-muted)] ml-1">K</span>
          </div>
          <div className="mt-1 text-xs font-mono text-[var(--text-muted)]">
            {result.isValid ? `${formatNum(result.temperatureC, 2)} °C` : 'Invalid'}
          </div>
        </LabCard>

        <LabCard className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Reaction Quotient (Q)</div>
          <div className="mt-1 font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
            {result.isValid ? formatScientific(result.effectiveQ, 3) : '—'}
          </div>
          <div className="mt-1 text-xs font-mono text-[var(--text-muted)]">
            ln(Q) = {result.isValid ? formatNum(result.lnQ, 3) : '—'} · n = {params.electronsN}
          </div>
        </LabCard>

        <LabCard className="p-4">
          <div className="text-xs text-[var(--text-muted)]">Simulation Engine</div>
          <div className="mt-1 flex items-center gap-2 text-base font-bold text-[var(--text-primary)]">
            <Activity className="w-4 h-4 text-[var(--accent)]" />
            <span>{isSimulating ? 'Live Running' : 'Paused'}</span>
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)] truncate">
            {result.isAt25C ? '25 °C (0.05916/n) match' : 'General RT/(nF) form'}
          </div>
        </LabCard>
      </div>

      {/* BUILT-IN PROJECT GUIDE: HOW TO USE THIS WEB APP (DIRECTLY ON HOME PAGE) */}
      <LabCard className="p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-hairline)]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent)] flex items-center justify-center shrink-0 mt-0.5">
              <BookMarked className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Project Guide: How to Use NernstLab
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Quick-start walkthrough of this electrochemical simulation platform. Open the full 6-chapter interactive Handbook Book for detailed instructions.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <LabButton variant="primary" size="sm" onClick={() => setActivePage('guide')}>
              <BookMarked className="w-3.5 h-3.5" />
              Open Full Guide Book
              <ArrowRight className="w-3.5 h-3.5" />
            </LabButton>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {QUICK_GUIDE_STEPS.map((step) => (
            <div
              key={step.num}
              className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-1.5"
            >
              <div className="font-mono text-xs font-bold text-[var(--accent)]">Step {step.num}</div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">{step.title}</div>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-2">
          <LabButton variant="secondary" size="sm" onClick={() => setActivePage('simulator')}>
            <Calculator className="w-3.5 h-3.5" />
            Full Nernst Calculator & Custom Cell
          </LabButton>
          <LabButton variant="secondary" size="sm" onClick={() => setActivePage('graphs')}>
            <LineChart className="w-3.5 h-3.5" />
            4 Live Recharts Graphs
          </LabButton>
          <LabButton variant="secondary" size="sm" onClick={() => setActivePage('experiment')}>
            <FlaskConical className="w-3.5 h-3.5" />
            7-Step Guided Experiment Lab
          </LabButton>
        </div>
      </LabCard>

      {/* LIVE RULE-BASED SCIENTIFIC INSIGHTS */}
      <InsightsPanel insights={insights} />
    </div>
  );
}
