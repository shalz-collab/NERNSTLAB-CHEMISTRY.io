import { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Droplets,
  FlaskConical,
  Pause,
  Play,
  RotateCcw,
  Thermometer,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CellVisualization } from '../components/CellVisualization';
import {
  LabButton,
  LabCard,
  ParameterSlider,
  SectionHeader,
  SegmentedControl,
} from '../components/ui';
import { useSimulation } from '../context/SimulationContext';
import { CELL_PRESETS, calculateNernst, type PresetId } from '../lib/nernst';
import { formatNum, formatScientific, formatSigned } from '../lib/utils';

type LabMode = 'guided' | 'temperature' | 'concentration';

const HYPOTHESIS_OPTIONS = [
  {
    id: 'increase',
    label: 'Cell potential E will increase because Q decreases and ln(Q) becomes more negative.',
  },
  {
    id: 'decrease',
    label: 'Cell potential E will decrease because extra ions block electron transfer.',
  },
  {
    id: 'unchanged',
    label: 'Cell potential E will remain identical to E° regardless of cathode concentration.',
  },
];

const GUIDED_STEPS = [
  'Select Cell',
  'Initial Conditions',
  'Form Hypothesis',
  'Run Simulation',
  'Modify Parameter',
  'Observe Results',
  'Conclusion',
];

function ThermalKineticCanvas({
  temperatureK,
  reduced,
  theme,
}: {
  temperatureK: number;
  reduced: boolean;
  theme: 'carbon' | 'ivory' | 'forest';
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = (canvas.width = canvas.offsetWidth * 2);
    const h = (canvas.height = canvas.offsetHeight * 2);
    ctx.scale(2, 2);
    const cw = w / 2;
    const ch = h / 2;

    const particles = Array.from({ length: 34 }, (_, i) => ({
      x: 16 + ((i * 53) % Math.max(cw - 32, 40)),
      y: 16 + ((i * 37) % Math.max(ch - 32, 40)),
      vx: ((i % 7) - 3) * 0.55 || 0.7,
      vy: (((i + 3) % 7) - 3) * 0.55 || -0.6,
      r: i % 2 === 0 ? 4.2 : 3.4,
      cation: i % 2 === 0,
    }));

    let rafId = 0;
    const speedScale = Math.min(Math.max(Math.pow(temperatureK / 298.15, 1.8), 0.35), 3.4);

    const draw = () => {
      ctx.clearRect(0, 0, cw, ch);

      const heatNorm = Math.min(Math.max((temperatureK - 273.15) / 100, 0), 1);
      const grad = ctx.createLinearGradient(0, 0, cw, ch);
      if (theme === 'carbon') {
        grad.addColorStop(
          0,
          `rgba(${Math.round(28 + heatNorm * 46)}, ${Math.round(26 + heatNorm * 14)}, ${Math.round(24 - heatNorm * 6)}, 0.96)`
        );
        grad.addColorStop(1, 'rgba(18, 18, 21, 0.98)');
      } else if (theme === 'forest') {
        grad.addColorStop(
          0,
          `rgba(${Math.round(18 + heatNorm * 38)}, ${Math.round(32 + heatNorm * 12)}, ${Math.round(24 - heatNorm * 6)}, 0.96)`
        );
        grad.addColorStop(1, 'rgba(12, 19, 16, 0.98)');
      } else {
        grad.addColorStop(
          0,
          `rgba(${Math.round(246 + heatNorm * 8)}, ${Math.round(243 - heatNorm * 14)}, ${Math.round(234 - heatNorm * 24)}, 0.85)`
        );
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.96)');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, cw, ch);

      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx * speedScale;
          p.y += p.vy * speedScale;
          if (p.x < p.r + 4 || p.x > cw - p.r - 4) p.vx *= -1;
          if (p.y < p.r + 4 || p.y > ch - p.r - 4) p.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.cation
          ? heatNorm > 0.65
            ? 'rgba(234, 88, 12, 0.9)'
            : 'rgba(245, 158, 11, 0.88)'
          : 'rgba(16, 185, 129, 0.82)';
        ctx.fill();
      }

      if (!reduced) {
        rafId = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [temperatureK, reduced, theme]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-44 rounded-xl border border-[var(--border-hairline)]"
      aria-label="Thermal molecular motion visualization"
    />
  );
}

function IonBeakerPreview({
  title,
  ionFormula,
  concentration,
  accent,
  isDark,
}: {
  title: string;
  ionFormula: string;
  concentration: number;
  accent: string;
  isDark: boolean;
}) {
  const count = Math.round(
    Math.min(Math.max(6 + Math.log10(Math.max(concentration, 0.001)) * 10 + 24, 4), 48)
  );
  const dots = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const s1 = Math.sin((i + 1) * 19.19) * 43758.5453;
      const fx = s1 - Math.floor(s1);
      const s2 = Math.sin((i + 17) * 91.73) * 43758.5453;
      const fy = s2 - Math.floor(s2);
      return {
        id: i,
        cx: 18 + fx * 184,
        cy: 22 + fy * 106,
      };
    });
  }, [count]);

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-[var(--text-primary)]">{title}</span>
        <span className="font-mono text-xs font-bold text-[var(--accent)]">
          [{ionFormula}] = {formatNum(concentration, 3)} M
        </span>
      </div>
      <svg
        viewBox="0 0 220 140"
        className="w-full h-36 rounded-lg border border-[var(--border-hairline)]"
        style={{ backgroundColor: isDark ? '#141418' : '#FFFFFF' }}
      >
        <rect
          x="0"
          y="10"
          width="220"
          height="130"
          fill={accent}
          fillOpacity={Math.min(0.08 + concentration * 0.09, 0.34)}
        />
        {dots.map((d) => (
          <g key={d.id} transform={`translate(${d.cx.toFixed(1)}, ${d.cy.toFixed(1)})`}>
            <circle r="7" fill={accent} fillOpacity="0.25" stroke={accent} strokeWidth="1" />
            <text
              textAnchor="middle"
              dy="2.5"
              fill={isDark ? '#F5F5F4' : '#18181B'}
              className="font-mono text-[6px] font-bold"
            >
              {ionFormula}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
        <span>Visual particle density: {count} ions</span>
        <span>Relative activity: {formatNum(concentration, 3)}</span>
      </div>
    </div>
  );
}

export function ExperimentLabView() {
  const {
    params,
    result,
    updateParams,
    selectPreset,
    switchTemperatureUnit,
    motionMode,
    saveCurrentSimulation,
    theme,
    isDarkTheme,
  } = useSimulation();

  const [labMode, setLabMode] = useState<LabMode>('guided');
  const [step, setStep] = useState(0);
  const [hypothesis, setHypothesis] = useState<string>('increase');
  const [baselineSnapshot, setBaselineSnapshot] = useState<{
    cathodeConc: number;
    anodeConc: number;
    tempK: number;
    voltage: number;
    q: number;
  } | null>(null);

  const captureBaseline = () => {
    if (!result.isValid) return;
    setBaselineSnapshot({
      cathodeConc: params.cathodeConc,
      anodeConc: params.anodeConc,
      tempK: result.temperatureK,
      voltage: result.cellPotential,
      q: result.effectiveQ,
    });
  };

  const [tempAnimating, setTempAnimating] = useState(false);
  const [tempAnimDir, setTempAnimDir] = useState<1 | -1>(1);
  const [tempMinK, setTempMinK] = useState(273.15);
  const [tempMaxK, setTempMaxK] = useState(373.15);
  const [targetPredictK, setTargetPredictK] = useState(338.15);

  useEffect(() => {
    if (!tempAnimating) return;
    const id = window.setInterval(() => {
      const currentK = result.temperatureK;
      let nextK = currentK + tempAnimDir * 2.5;
      if (nextK >= tempMaxK) {
        nextK = tempMaxK;
        setTempAnimDir(-1);
      } else if (nextK <= tempMinK) {
        nextK = tempMinK;
        setTempAnimDir(1);
      }
      updateParams({
        temperatureValue:
          params.temperatureUnit === 'K'
            ? Number(nextK.toFixed(1))
            : Number((nextK - 273.15).toFixed(1)),
      });
    }, 180);
    return () => window.clearInterval(id);
  }, [tempAnimating, tempAnimDir, tempMinK, tempMaxK, result.temperatureK, params.temperatureUnit, updateParams]);

  const predictedTempResult = useMemo(() => {
    return calculateNernst({
      ...params,
      temperatureValue: targetPredictK,
      temperatureUnit: 'K',
    });
  }, [params, targetPredictK]);

  const tempVoltageDelta =
    result.isValid && predictedTempResult.isValid
      ? predictedTempResult.cellPotential - result.cellPotential
      : 0;
  const tempPctDelta =
    result.isValid && Math.abs(result.cellPotential) > 1e-6
      ? (tempVoltageDelta / Math.abs(result.cellPotential)) * 100
      : 0;

  const applyConcRatio = (anodeM: number, cathodeM: number) => {
    updateParams({ useManualQ: false, anodeConc: anodeM, cathodeConc: cathodeM });
  };

  const experimentComparisonData = useMemo(() => {
    if (!baselineSnapshot || !result.isValid) return [];
    return [
      { label: 'Baseline Trial (Step 4)', potential: Number(baselineSnapshot.voltage.toFixed(4)), fill: '#71717A' },
      {
        label: 'Modified Trial (Step 5)',
        potential: Number(result.cellPotential.toFixed(4)),
        fill: theme === 'forest' ? '#34D399' : theme === 'ivory' ? '#D97706' : '#F59E0B',
      },
    ];
  }, [baselineSnapshot, result, theme]);

  const guidedDeltaE = baselineSnapshot && result.isValid ? result.cellPotential - baselineSnapshot.voltage : 0;

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Experiment Lab"
        subtitle="Conduct structured 7-step inquiry experiments or isolate thermal and concentration variables in dedicated prediction laboratories."
        action={
          <SegmentedControl
            value={labMode}
            onChange={setLabMode}
            options={[
              { value: 'guided', label: 'Guided 7-Step Lab' },
              { value: 'temperature', label: 'Temperature Lab' },
              { value: 'concentration', label: 'Concentration Lab' },
            ]}
          />
        }
      />

      {labMode === 'guided' && (
        <div className="space-y-6">
          <LabCard className="p-4">
            <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
              {GUIDED_STEPS.map((label, idx) => {
                const done = idx < step;
                const current = idx === step;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (idx >= 4 && !baselineSnapshot) captureBaseline();
                      setStep(idx);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      current
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)] font-semibold'
                        : done
                        ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <span className="font-mono">{idx + 1}.</span>
                    )}
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </LabCard>

          <LabCard className="p-6 space-y-6">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono font-semibold text-[var(--accent)]">STEP 1 OF 7</div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                    Select an Electrochemical Cell
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Choose a reference galvanic cell to establish your standard reduction couples.
                  </p>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(['daniell', 'iron-copper', 'concentration', 'silver-zinc'] as Array<Exclude<PresetId, 'custom'>>).map(
                    (id) => {
                      const preset = CELL_PRESETS[id];
                      const active = params.presetId === id;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => selectPreset(id)}
                          className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                            active
                              ? 'bg-[var(--accent-soft)] border-[var(--accent-border)]'
                              : 'bg-[var(--bg-surface-elevated)] border-[var(--border-hairline)] hover:border-[var(--border-strong)]'
                          }`}
                        >
                          <div className="text-sm font-semibold text-[var(--text-primary)]">{preset.shortName}</div>
                          <div className="font-mono text-xs text-[var(--accent)] mt-1">{preset.notation}</div>
                          <p className="text-xs text-[var(--text-secondary)] mt-1.5">{preset.description}</p>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-mono font-semibold text-[var(--accent)]">STEP 2 OF 7</div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">Set Initial Conditions</h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Configure your starting baseline temperature, ion concentrations, and electron count (n).
                  </p>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <ParameterSlider
                    label="Initial Temperature"
                    value={result.temperatureK}
                    min={273.15}
                    max={360}
                    step={0.5}
                    unit="K"
                    displayValue={formatNum(result.temperatureK, 2)}
                    onChange={(v) => updateParams({ temperatureUnit: 'K', temperatureValue: v })}
                  />
                  <ParameterSlider
                    label="Electrons Transferred (n)"
                    value={params.electronsN}
                    min={1}
                    max={4}
                    step={1}
                    unit="mol e⁻"
                    onChange={(v) => updateParams({ electronsN: v })}
                  />
                  <ParameterSlider
                    label={`Initial Anode [${params.anodeIonFormula}]`}
                    value={params.anodeConc}
                    min={0.05}
                    max={2.0}
                    step={0.05}
                    unit="M"
                    displayValue={formatNum(params.anodeConc, 2)}
                    onChange={(v) => updateParams({ useManualQ: false, anodeConc: v })}
                  />
                  <ParameterSlider
                    label={`Initial Cathode [${params.cathodeIonFormula}]`}
                    value={params.cathodeConc}
                    min={0.05}
                    max={2.0}
                    step={0.05}
                    unit="M"
                    displayValue={formatNum(params.cathodeConc, 2)}
                    onChange={(v) => updateParams({ useManualQ: false, cathodeConc: v })}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <div className="text-xs font-mono font-semibold text-[var(--accent)]">STEP 3 OF 7</div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">Form Your Hypothesis</h2>
                  <p className="text-sm text-[var(--text-primary)] font-medium mt-2">
                    What do you expect will happen to the cell potential (E) if the concentration of the cathode ion [{params.cathodeIonFormula}] increases?
                  </p>
                </div>
                <div className="space-y-2.5">
                  {HYPOTHESIS_OPTIONS.map((opt) => {
                    const selected = hypothesis === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setHypothesis(opt.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          selected
                            ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)]'
                            : 'bg-[var(--bg-surface-elevated)] border-[var(--border-hairline)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${
                            selected ? 'border-[var(--accent)] bg-[var(--accent)]' : 'border-[var(--border-strong)]'
                          }`}
                        />
                        <span className="text-sm">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-mono font-semibold text-[var(--accent)]">STEP 4 OF 7</div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                      Run Baseline Simulation & Record Reference Potential
                    </h2>
                  </div>
                  <LabButton variant="primary" size="sm" onClick={captureBaseline}>
                    <FlaskConical className="w-3.5 h-3.5" />
                    {baselineSnapshot ? 'Update Baseline Reading' : 'Record Baseline Reading'}
                  </LabButton>
                </div>
                {baselineSnapshot && (
                  <div className="p-3.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] flex flex-wrap items-center gap-6 text-xs font-mono text-[var(--text-primary)]">
                    <span>Baseline E = <strong>{formatSigned(baselineSnapshot.voltage, 4)} V</strong></span>
                    <span>[{params.cathodeIonFormula}]₀ = {baselineSnapshot.cathodeConc} M</span>
                    <span>T₀ = {baselineSnapshot.tempK.toFixed(2)} K</span>
                    <span>Q₀ = {formatScientific(baselineSnapshot.q, 3)}</span>
                  </div>
                )}
                <CellVisualization compact interactiveInspect={false} />
              </div>
            )}

            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-mono font-semibold text-[var(--accent)]">STEP 5 OF 7</div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                    Modify One Variable to Test Your Hypothesis
                  </h2>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Increase [{params.cathodeIonFormula}] (or test another single variable) and compare against your recorded baseline.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6 items-center">
                  <div className="space-y-4">
                    <ParameterSlider
                      label={`Cathode [${params.cathodeIonFormula}] (Primary Test Variable)`}
                      value={params.cathodeConc}
                      min={0.01}
                      max={4.0}
                      step={0.05}
                      unit="M"
                      displayValue={formatNum(params.cathodeConc, 2)}
                      onChange={(v) => updateParams({ useManualQ: false, cathodeConc: v })}
                    />
                    <ParameterSlider
                      label={`Anode [${params.anodeIonFormula}]`}
                      value={params.anodeConc}
                      min={0.01}
                      max={4.0}
                      step={0.05}
                      unit="M"
                      displayValue={formatNum(params.anodeConc, 2)}
                      onChange={(v) => updateParams({ useManualQ: false, anodeConc: v })}
                    />
                    <ParameterSlider
                      label="Temperature"
                      value={result.temperatureK}
                      min={273.15}
                      max={373.15}
                      step={1}
                      unit="K"
                      displayValue={formatNum(result.temperatureK, 1)}
                      onChange={(v) => updateParams({ temperatureUnit: 'K', temperatureValue: v })}
                    />
                  </div>

                  <div className="p-5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-3">
                    <div className="text-xs font-semibold text-[var(--text-primary)]">Live Experimental Delta</div>
                    <div className="grid grid-cols-2 gap-4 font-mono">
                      <div>
                        <div className="text-[11px] text-[var(--text-muted)]">Baseline E₀</div>
                        <div className="text-lg font-bold text-[var(--text-secondary)]">
                          {baselineSnapshot ? `${formatSigned(baselineSnapshot.voltage, 4)} V` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-[var(--text-muted)]">Current E</div>
                        <div className="text-lg font-bold text-[var(--accent)]">
                          {result.isValid ? `${formatSigned(result.cellPotential, 4)} V` : '—'}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-[var(--border-hairline)] font-mono text-sm font-semibold text-[var(--text-primary)]">
                      Measured ΔE = {formatSigned(guidedDeltaE, 4)} V ({formatSigned(guidedDeltaE * 1000, 2)} mV)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <div className="text-xs font-mono font-semibold text-[var(--accent)]">STEP 6 OF 7</div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">Observe Experimental Results</h2>
                </div>
                <div className="grid lg:grid-cols-2 gap-6 items-center">
                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={experimentComparisonData} margin={{ top: 12, right: 16, left: 4, bottom: 8 }}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke={theme === 'forest' ? '#20332A' : isDarkTheme ? '#2A2A31' : '#E6E1D6'}
                          vertical={false}
                        />
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDarkTheme ? '#A1A1AA' : '#57534E' }} />
                        <YAxis tick={{ fontSize: 11, fill: isDarkTheme ? '#A1A1AA' : '#57534E', fontFamily: 'IBM Plex Mono' }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: theme === 'forest' ? '#131D18' : isDarkTheme ? '#18181B' : '#FFFFFF',
                            borderColor: theme === 'forest' ? '#2A4538' : isDarkTheme ? '#3F3F46' : '#D6D0C4',
                            color: isDarkTheme ? '#F5F5F4' : '#18181B',
                            borderRadius: '10px',
                          }}
                          formatter={(val: unknown) => [`${formatSigned(Number(val), 4)} V`, 'Cell Potential']}
                        />
                        <Bar dataKey="potential" radius={[6, 6, 0, 0]} maxBarSize={76}>
                          {experimentComparisonData.map((entry, idx) => (
                            <Cell key={idx} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2.5 text-xs font-mono bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] rounded-xl p-4 text-[var(--text-primary)]">
                    <div className="font-sans text-sm font-semibold mb-2">
                      Before vs After Measurement Table
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--border-hairline)]">
                      <span className="text-[var(--text-muted)]">[{params.cathodeIonFormula}] Cathode</span>
                      <span>
                        {baselineSnapshot?.cathodeConc ?? '—'} M → <strong>{params.cathodeConc} M</strong>
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--border-hairline)]">
                      <span className="text-[var(--text-muted)]">Reaction Quotient Q</span>
                      <span>
                        {baselineSnapshot ? formatScientific(baselineSnapshot.q, 3) : '—'} →{' '}
                        <strong>{formatScientific(result.effectiveQ, 3)}</strong>
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[var(--border-hairline)]">
                      <span className="text-[var(--text-muted)]">Temperature</span>
                      <span>
                        {baselineSnapshot?.tempK.toFixed(1) ?? '—'} K → <strong>{result.temperatureK.toFixed(1)} K</strong>
                      </span>
                    </div>
                    <div className="flex justify-between py-1 text-sm font-bold text-[var(--accent)]">
                      <span>Net Voltage Shift (ΔE)</span>
                      <span>{formatSigned(guidedDeltaE, 4)} V</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 6 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-xs font-mono font-semibold text-teal-500">STEP 7 OF 7 · EXPERIMENT COMPLETE</div>
                    <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                      Data-Driven Scientific Conclusion
                    </h2>
                  </div>
                  <LabButton
                    variant="primary"
                    size="sm"
                    onClick={() => saveCurrentSimulation(`Experiment: ${params.cellName} (ΔE ${formatSigned(guidedDeltaE, 3)} V)`)}
                  >
                    Save Experiment to History
                  </LabButton>
                </div>

                <div className="p-5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] space-y-3 text-sm text-[var(--text-primary)] leading-relaxed">
                  <p>
                    In the <strong>{params.cellName}</strong> experiment, modifying parameters shifted the reaction quotient from{' '}
                    <span className="font-mono font-semibold">
                      Q₀ = {baselineSnapshot ? formatScientific(baselineSnapshot.q, 3) : '1.00'}
                    </span>{' '}
                    to <span className="font-mono font-semibold">Q = {formatScientific(result.effectiveQ, 3)}</span>. Consequently, the measured cell potential changed from{' '}
                    <span className="font-mono font-semibold">
                      {baselineSnapshot ? formatSigned(baselineSnapshot.voltage, 4) : formatSigned(result.effectiveStandardPotential, 4)} V
                    </span>{' '}
                    to <span className="font-mono font-semibold">{formatSigned(result.cellPotential, 4)} V</span> (a net change of{' '}
                    <span className="font-mono font-bold text-[var(--accent)]">{formatSigned(guidedDeltaE, 4)} V</span>).
                  </p>
                  <p className="text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Hypothesis Verification:</strong> You predicted that increasing [{params.cathodeIonFormula}] would{' '}
                    {hypothesis === 'increase'
                      ? 'increase E — this aligns accurately with the Nernst equation! Increasing reactant concentration in the cathode lowers Q, makes ln(Q) more negative, and adds a positive correction −(RT/nF)ln(Q) to E°.'
                      : hypothesis === 'decrease'
                      ? 'decrease E — however, per the Nernst equation, increasing cathode reactant concentration reduces Q (since cathode ions sit in the denominator of Q), which actually raises E.'
                      : 'leave E unchanged — however, E equals E° only when Q = 1. Deviating from standard 1 M concentrations creates a measurable Nernst shift.'}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between">
              <LabButton
                variant="secondary"
                size="sm"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Step
              </LabButton>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Step {step + 1} / {GUIDED_STEPS.length}
              </span>
              {step < GUIDED_STEPS.length - 1 ? (
                <LabButton
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (step === 3 && !baselineSnapshot) captureBaseline();
                    setStep((s) => Math.min(GUIDED_STEPS.length - 1, s + 1));
                  }}
                >
                  Next Step
                  <ChevronRight className="w-4 h-4" />
                </LabButton>
              ) : (
                <LabButton
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setStep(0);
                    setBaselineSnapshot(null);
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Restart Experiment
                </LabButton>
              )}
            </div>
          </LabCard>
        </div>
      )}

      {labMode === 'temperature' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <LabCard className="lg:col-span-5 p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--text-primary)]">Temperature Controls</h2>
              </div>
              <SegmentedControl
                value={params.temperatureUnit}
                onChange={switchTemperatureUnit}
                options={[
                  { value: 'K', label: 'Kelvin (K)' },
                  { value: 'C', label: 'Celsius (°C)' },
                ]}
              />
            </div>

            <ParameterSlider
              label="Active Cell Temperature"
              value={params.temperatureValue}
              min={params.temperatureUnit === 'K' ? tempMinK : Number((tempMinK - 273.15).toFixed(1))}
              max={params.temperatureUnit === 'K' ? tempMaxK : Number((tempMaxK - 273.15).toFixed(1))}
              step={0.5}
              unit={params.temperatureUnit === 'K' ? 'K' : '°C'}
              displayValue={formatNum(params.temperatureValue, 1)}
              onChange={(v) => updateParams({ temperatureValue: v })}
            />

            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs">
                <span className="text-[var(--text-muted)]">Exact Input ({params.temperatureUnit === 'K' ? 'K' : '°C'})</span>
                <input
                  type="number"
                  step="0.5"
                  value={params.temperatureValue}
                  onChange={(e) => updateParams({ temperatureValue: parseFloat(e.target.value) })}
                  className="lab-input w-full px-3 py-1.5 rounded-lg font-mono text-sm"
                />
              </label>
              <label className="space-y-1 text-xs">
                <span className="text-[var(--text-muted)]">Target Prediction (K)</span>
                <input
                  type="number"
                  step="1"
                  value={targetPredictK}
                  onChange={(e) => setTargetPredictK(parseFloat(e.target.value) || 298.15)}
                  className="lab-input w-full px-3 py-1.5 rounded-lg font-mono text-sm"
                />
              </label>
            </div>

            <div className="space-y-2 pt-2 border-t border-[var(--border-hairline)]">
              <div className="text-xs font-medium text-[var(--text-secondary)]">Sweep Temperature Range</div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: '0–100 °C (Aqueous)', min: 273.15, max: 373.15 },
                  { label: '15–65 °C (Lab Bench)', min: 288.15, max: 338.15 },
                  { label: '250–450 K (Extended)', min: 250, max: 450 },
                ].map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => {
                      setTempMinK(r.min);
                      setTempMaxK(r.max);
                    }}
                    className={`px-2.5 py-1 rounded-md text-xs border cursor-pointer ${
                      tempMinK === r.min && tempMaxK === r.max
                        ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--text-primary)] font-medium'
                        : 'bg-[var(--bg-surface-elevated)] border-[var(--border-hairline)] text-[var(--text-secondary)]'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <LabButton
                variant={tempAnimating ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setTempAnimating((a) => !a)}
              >
                {tempAnimating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {tempAnimating ? 'Pause Thermal Ramp' : 'Animate Heating / Cooling'}
              </LabButton>
              {Math.abs(result.effectiveQ - 1) < 1e-3 && (
                <LabButton
                  variant="ghost"
                  size="sm"
                  onClick={() => updateParams({ useManualQ: false, anodeConc: 0.1, cathodeConc: 1.5 })}
                >
                  Set Q ≠ 1
                </LabButton>
              )}
            </div>
          </LabCard>

          <div className="lg:col-span-7 space-y-5">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <LabCard className="p-4">
                <div className="text-xs text-[var(--text-muted)]">Current Temperature</div>
                <div className="font-mono text-xl font-bold text-[var(--text-primary)] mt-1">
                  {formatNum(result.temperatureK, 1)} K
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)]">{formatNum(result.temperatureC, 1)} °C</div>
              </LabCard>
              <LabCard className="p-4">
                <div className="text-xs text-[var(--text-muted)]">Current Potential</div>
                <div className="font-mono text-xl font-bold text-[var(--text-primary)] mt-1">
                  {result.isValid ? `${formatSigned(result.cellPotential, 4)} V` : '—'}
                </div>
              </LabCard>
              <LabCard className="p-4">
                <div className="text-xs text-[var(--text-muted)]">Predicted @ {targetPredictK} K</div>
                <div className="font-mono text-xl font-bold text-[var(--accent)] mt-1">
                  {predictedTempResult.isValid ? `${formatSigned(predictedTempResult.cellPotential, 4)} V` : '—'}
                </div>
              </LabCard>
              <LabCard className="p-4">
                <div className="text-xs text-[var(--text-muted)]">Voltage Variation</div>
                <div className="font-mono text-xl font-bold text-[var(--text-primary)] mt-1">
                  {formatSigned(tempVoltageDelta * 1000, 2)} mV
                </div>
                <div className="text-xs font-mono text-[var(--accent)]">{formatSigned(tempPctDelta, 2)}%</div>
              </LabCard>
            </div>

            <LabCard className="p-5 space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    Solution Thermal Kinetic Simulation
                  </h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Higher temperature increases mean ion velocity and scales the thermal voltage RT/(nF).
                  </p>
                </div>
                <span className="font-mono text-xs text-[var(--accent)] font-semibold">
                  RT/nF = {result.isValid ? `${formatNum(result.rtOverNF * 1000, 2)} mV` : '—'}
                </span>
              </div>
              <ThermalKineticCanvas
                temperatureK={result.temperatureK}
                reduced={motionMode === 'reduced'}
                theme={theme}
              />
              {Math.abs(result.effectiveQ - 1) < 1e-4 && (
                <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-500/10 border border-amber-500/35 rounded-lg p-3">
                  Note: Because Q = 1.000 right now, ln(Q) = 0, so the Nernst temperature term vanishes. Click <strong>Set Q ≠ 1</strong> on the left to observe linear thermal voltage drift!
                </p>
              )}
            </LabCard>
          </div>
        </div>
      )}

      {labMode === 'concentration' && (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <LabCard className="lg:col-span-5 p-5 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-[var(--border-hairline)]">
              <Droplets className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Ion Concentration Controls</h2>
            </div>

            <ParameterSlider
              label={`Anode Ion [${params.anodeIonFormula}]`}
              value={params.anodeConc}
              min={0.005}
              max={3.0}
              step={0.005}
              unit="M"
              displayValue={formatNum(params.anodeConc, 3)}
              onChange={(v) => updateParams({ useManualQ: false, anodeConc: Number(v.toFixed(3)) })}
            />

            <ParameterSlider
              label={`Cathode Ion [${params.cathodeIonFormula}]`}
              value={params.cathodeConc}
              min={0.005}
              max={3.0}
              step={0.005}
              unit="M"
              displayValue={formatNum(params.cathodeConc, 3)}
              onChange={(v) => updateParams({ useManualQ: false, cathodeConc: Number(v.toFixed(3)) })}
            />

            <div className="space-y-2 pt-2 border-t border-[var(--border-hairline)]">
              <div className="text-xs font-medium text-[var(--text-secondary)]">
                Quick Concentration Ratios (Anode : Cathode)
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: '1 : 100', a: 0.01, c: 1.0 },
                  { label: '1 : 10', a: 0.1, c: 1.0 },
                  { label: '1 : 1 (Std)', a: 1.0, c: 1.0 },
                  { label: '10 : 1', a: 1.0, c: 0.1 },
                  { label: '100 : 1', a: 1.0, c: 0.01 },
                  { label: '0.01 : 2.5', a: 0.01, c: 2.5 },
                ].map((r) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => applyConcRatio(r.a, r.c)}
                    className="px-2.5 py-2 rounded-lg text-xs font-mono bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-[var(--text-primary)] border border-[var(--border-hairline)] cursor-pointer"
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-1.5 text-xs">
              <div className="flex justify-between font-mono">
                <span className="text-[var(--text-muted)]">Ratio [Anode]/[Cathode]:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {formatScientific(params.anodeConc / Math.max(params.cathodeConc, 1e-9), 3)}
                </span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--text-muted)]">Reaction Quotient Q:</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {result.isValid ? formatScientific(result.effectiveQ, 4) : '—'}
                </span>
              </div>
              <div className="flex justify-between font-mono pt-1 border-t border-[var(--border-hairline)] text-sm">
                <span className="font-sans font-semibold text-[var(--text-primary)]">Cell Potential E:</span>
                <span className="font-bold text-[var(--accent)]">
                  {result.isValid ? `${formatSigned(result.cellPotential, params.precision)} V` : '—'}
                </span>
              </div>
            </div>
          </LabCard>

          <div className="lg:col-span-7 space-y-5">
            <div className="grid sm:grid-cols-2 gap-4">
              <IonBeakerPreview
                title={`Anode Compartment (${params.anodeMaterial})`}
                ionFormula={params.anodeIonFormula}
                concentration={params.anodeConc}
                accent={isDarkTheme ? '#F59E0B' : '#D97706'}
                isDark={isDarkTheme}
              />
              <IonBeakerPreview
                title={`Cathode Compartment (${params.cathodeMaterial})`}
                ionFormula={params.cathodeIonFormula}
                concentration={params.cathodeConc}
                accent={isDarkTheme ? '#10B981' : '#059669'}
                isDark={isDarkTheme}
              />
            </div>

            <LabCard className="p-5 space-y-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Concentration Effect Explanation (Le Chatelier & Nernst Coupling)
              </h3>
              <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                In the overall reaction <span className="font-mono text-[var(--text-primary)]">{params.overallReaction}</span>, cathode ions ({params.cathodeIonFormula}) act as reactants while anode ions ({params.anodeIonFormula}) act as products. Increasing [{params.cathodeIonFormula}] or diluting [{params.anodeIonFormula}] drives the reaction quotient{' '}
                <span className="font-mono font-semibold text-[var(--text-primary)]">Q = {result.isValid ? formatScientific(result.effectiveQ, 3) : '—'}</span> lower, shifting the electrochemical driving force forward by{' '}
                <span className="font-mono font-semibold text-[var(--accent)]">
                  {result.isValid ? `${formatSigned(result.nernstCorrection, 4)} V` : '—'}
                </span>{' '}
                relative to E° ({formatSigned(result.effectiveStandardPotential, 3)} V).
              </p>
            </LabCard>
          </div>
        </div>
      )}
    </div>
  );
}
