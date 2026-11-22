import {
  AlertCircle,
  AlertTriangle,
  BookmarkPlus,
  Copy,
  FileDown,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { InsightsPanel } from '../components/InsightsPanel';
import {
  LabButton,
  LabCard,
  ParameterSlider,
  SectionHeader,
  SegmentedControl,
} from '../components/ui';
import { useSimulation } from '../context/SimulationContext';
import { formatCalculationClipboardText } from '../lib/export';
import {
  FARADAY_CONSTANT_F,
  GAS_CONSTANT_R,
  STANDARD_25C_FACTOR,
  type PresetId,
} from '../lib/nernst';
import { formatNum, formatScientific, formatSigned } from '../lib/utils';

export function SimulatorView() {
  const {
    params,
    result,
    insights,
    updateParams,
    selectPreset,
    switchTemperatureUnit,
    resetSimulation,
    saveCurrentSimulation,
    setReportModalOpen,
    showToast,
  } = useSimulation();

  const p = params.precision;
  const errors = result.issues.filter((i) => i.severity === 'error');
  const warnings = result.issues.filter((i) => i.severity === 'warning');

  const handleCopy = async () => {
    if (!result.isValid) return;
    try {
      await navigator.clipboard.writeText(formatCalculationClipboardText(params, result));
      showToast('Step-by-step calculation copied to clipboard');
    } catch {
      showToast('Clipboard access blocked in this browser');
    }
  };

  const presetTabs: Array<{ value: PresetId; label: string }> = [
    { value: 'daniell', label: 'Daniell (Zn–Cu)' },
    { value: 'iron-copper', label: 'Iron–Copper' },
    { value: 'concentration', label: 'Concentration Cell' },
    { value: 'silver-zinc', label: 'Zinc–Silver' },
    { value: 'custom', label: 'Custom Cell' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Nernst Equation Calculator & Cell Simulator"
        subtitle="Real-time thermodynamic calculation of electrochemical cell potential with step-by-step symbolic derivation and custom half-cell builder."
        action={
          <>
            <LabButton variant="secondary" size="sm" onClick={handleCopy} disabled={!result.isValid}>
              <Copy className="w-3.5 h-3.5" />
              Copy Calculation
            </LabButton>
            <LabButton
              variant="secondary"
              size="sm"
              onClick={() => setReportModalOpen(true)}
              disabled={!result.isValid}
            >
              <FileDown className="w-3.5 h-3.5" />
              Download Report
            </LabButton>
            <LabButton
              variant="primary"
              size="sm"
              onClick={() => saveCurrentSimulation()}
              disabled={!result.isValid}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save Run
            </LabButton>
          </>
        }
      />

      {/* Preset & Custom Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[var(--bg-subtle)] border border-[var(--border-hairline)] rounded-xl">
          {presetTabs.map((tab) => {
            const active = params.presetId === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => selectPreset(tab.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Precision:</span>
          <SegmentedControl
            value={String(params.precision)}
            onChange={(val) => updateParams({ precision: Number(val) })}
            options={[
              { value: '2', label: '2 dec' },
              { value: '3', label: '3 dec' },
              { value: '4', label: '4 dec' },
              { value: '5', label: '5 dec' },
            ]}
          />
          <LabButton variant="ghost" size="sm" onClick={resetSimulation}>
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </LabButton>
        </div>
      </div>

      {/* Validation Errors & Physical Warnings */}
      {(errors.length > 0 || warnings.length > 0) && (
        <div className="space-y-2">
          {errors.map((err, idx) => (
            <div
              key={`err-${idx}`}
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/35 text-xs text-rose-700 dark:text-rose-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Input Error:</strong> {err.message}
              </div>
            </div>
          ))}
          {warnings.map((warn, idx) => (
            <div
              key={`warn-${idx}`}
              className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-800 dark:text-amber-200"
            >
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold">Physical Validity Notice:</strong> {warn.message}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Cell Builder Panel */}
      {params.presetId === 'custom' && (
        <LabCard className="p-5 bg-[var(--bg-surface-elevated)]">
          <div className="pb-3 mb-4 border-b border-[var(--border-hairline)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Custom Electrochemical Cell Designer
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Define electrode materials, half-reactions, and standard reduction potentials (E°_red vs SHE)
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Cell Name</span>
              <input
                type="text"
                value={params.cellName}
                onChange={(e) => updateParams({ cellName: e.target.value })}
                className="lab-input w-full px-3 py-2 rounded-lg text-sm"
              />
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Anode Material & Symbol</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={params.anodeMaterial}
                  onChange={(e) => updateParams({ anodeMaterial: e.target.value })}
                  placeholder="Material"
                  className="lab-input col-span-2 px-3 py-2 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={params.anodeSymbol}
                  onChange={(e) => updateParams({ anodeSymbol: e.target.value })}
                  placeholder="Sym"
                  className="lab-input px-2.5 py-2 rounded-lg font-mono text-sm"
                />
              </div>
            </label>
            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Cathode Material & Symbol</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={params.cathodeMaterial}
                  onChange={(e) => updateParams({ cathodeMaterial: e.target.value })}
                  placeholder="Material"
                  className="lab-input col-span-2 px-3 py-2 rounded-lg text-sm"
                />
                <input
                  type="text"
                  value={params.cathodeSymbol}
                  onChange={(e) => updateParams({ cathodeSymbol: e.target.value })}
                  placeholder="Sym"
                  className="lab-input px-2.5 py-2 rounded-lg font-mono text-sm"
                />
              </div>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Anode Ion & Standard E°_red (V)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={params.anodeIonFormula}
                  onChange={(e) =>
                    updateParams({
                      anodeIonFormula: e.target.value,
                      notation: `${params.anodeSymbol}(s) | ${e.target.value}(aq) || ${params.cathodeIonFormula}(aq) | ${params.cathodeSymbol}(s)`,
                    })
                  }
                  placeholder="Mg²⁺"
                  className="lab-input px-3 py-2 rounded-lg font-mono text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  value={params.anodePotentialStd}
                  onChange={(e) =>
                    updateParams({
                      anodePotentialStd: parseFloat(e.target.value),
                      standardPotentialOverride: null,
                    })
                  }
                  className="lab-input px-3 py-2 rounded-lg font-mono text-sm"
                />
              </div>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Cathode Ion & Standard E°_red (V)</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={params.cathodeIonFormula}
                  onChange={(e) =>
                    updateParams({
                      cathodeIonFormula: e.target.value,
                      notation: `${params.anodeSymbol}(s) | ${params.anodeIonFormula}(aq) || ${e.target.value}(aq) | ${params.cathodeSymbol}(s)`,
                    })
                  }
                  placeholder="Ag⁺"
                  className="lab-input px-3 py-2 rounded-lg font-mono text-sm"
                />
                <input
                  type="number"
                  step="0.01"
                  value={params.cathodePotentialStd}
                  onChange={(e) =>
                    updateParams({
                      cathodePotentialStd: parseFloat(e.target.value),
                      standardPotentialOverride: null,
                    })
                  }
                  className="lab-input px-3 py-2 rounded-lg font-mono text-sm"
                />
              </div>
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Overall Balanced Reaction</span>
              <input
                type="text"
                value={params.overallReaction}
                onChange={(e) => updateParams({ overallReaction: e.target.value })}
                className="lab-input w-full px-3 py-2 rounded-lg font-mono text-xs"
              />
            </label>

            <label className="space-y-1 text-xs">
              <span className="font-medium text-[var(--text-secondary)]">Oxidation Half-Reaction (Anode)</span>
              <input
                type="text"
                value={params.oxidationHalfReaction}
                onChange={(e) => updateParams({ oxidationHalfReaction: e.target.value })}
                className="lab-input w-full px-3 py-2 rounded-lg font-mono text-xs"
              />
            </label>

            <label className="space-y-1 text-xs lg:col-span-2">
              <span className="font-medium text-[var(--text-secondary)]">Reduction Half-Reaction (Cathode)</span>
              <input
                type="text"
                value={params.reductionHalfReaction}
                onChange={(e) => updateParams({ reductionHalfReaction: e.target.value })}
                className="lab-input w-full px-3 py-2 rounded-lg font-mono text-xs"
              />
            </label>
          </div>
        </LabCard>
      )}

      {/* Main Two-Column Calculator Workspace */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <LabCard className="lg:col-span-5 p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-hairline)]">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--accent)]" />
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Reaction Parameters
              </h2>
            </div>
            <SegmentedControl
              value={params.reactionDirection}
              onChange={(val) => updateParams({ reactionDirection: val })}
              options={[
                { value: 'forward', label: 'Forward' },
                { value: 'reverse', label: 'Reverse' },
              ]}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Standard Cell Potential (E°, V)
              </label>
              {params.standardPotentialOverride !== null && (
                <button
                  type="button"
                  onClick={() => updateParams({ standardPotentialOverride: null })}
                  className="text-[11px] text-[var(--accent)] hover:underline cursor-pointer"
                >
                  Use E°cathode − E°anode
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                value={
                  params.standardPotentialOverride !== null
                    ? params.standardPotentialOverride
                    : Number((params.cathodePotentialStd - params.anodePotentialStd).toFixed(4))
                }
                onChange={(e) =>
                  updateParams({ standardPotentialOverride: parseFloat(e.target.value) })
                }
                className="lab-input w-full px-3 py-2 rounded-lg font-mono tabular-nums text-sm font-semibold"
              />
              <span className="font-mono text-xs text-[var(--text-muted)] shrink-0">V</span>
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-[var(--border-hairline)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Temperature</span>
              <SegmentedControl
                value={params.temperatureUnit}
                onChange={switchTemperatureUnit}
                options={[
                  { value: 'K', label: 'Kelvin (K)' },
                  { value: 'C', label: 'Celsius (°C)' },
                ]}
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                step="0.5"
                value={params.temperatureValue}
                onChange={(e) => updateParams({ temperatureValue: parseFloat(e.target.value) })}
                className="lab-input w-28 px-3 py-1.5 rounded-lg font-mono tabular-nums text-sm font-semibold"
              />
              <div className="flex-1">
                <input
                  type="range"
                  min={params.temperatureUnit === 'K' ? 273.15 : 0}
                  max={params.temperatureUnit === 'K' ? 373.15 : 100}
                  step={0.5}
                  value={Math.min(
                    Math.max(
                      Number.isFinite(params.temperatureValue) ? params.temperatureValue : 298.15,
                      params.temperatureUnit === 'K' ? 273.15 : 0
                    ),
                    params.temperatureUnit === 'K' ? 373.15 : 100
                  )}
                  onChange={(e) => updateParams({ temperatureValue: parseFloat(e.target.value) })}
                  className="lab-slider w-full"
                />
              </div>
            </div>
            <div className="text-[11px] font-mono text-[var(--text-muted)]">
              Equivalent: {result.isValid ? `${formatNum(result.temperatureK, 2)} K / ${formatNum(result.temperatureC, 2)} °C` : '—'}
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t border-[var(--border-hairline)]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-[var(--text-secondary)]">
                Electrons Transferred (n)
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 6].map((nOpt) => (
                  <button
                    key={nOpt}
                    type="button"
                    onClick={() => updateParams({ electronsN: nOpt })}
                    className={`w-7 h-7 rounded-md font-mono text-xs font-semibold transition-colors cursor-pointer ${
                      params.electronsN === nOpt
                        ? 'bg-[var(--accent)] text-[var(--accent-fg)]'
                        : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {nOpt}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min={1}
              step={1}
              value={params.electronsN}
              onChange={(e) => updateParams({ electronsN: parseFloat(e.target.value) })}
              className="lab-input w-full px-3 py-1.5 rounded-lg font-mono tabular-nums text-sm"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-[var(--border-hairline)]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Reaction Quotient Source
              </span>
              <SegmentedControl
                value={params.useManualQ ? 'manual' : 'ions'}
                onChange={(val) => updateParams({ useManualQ: val === 'manual' })}
                options={[
                  { value: 'ions', label: 'Ion Molarities' },
                  { value: 'manual', label: 'Direct Q' },
                ]}
              />
            </div>

            {!params.useManualQ ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      Anode [{params.anodeIonFormula}] Concentration (M)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={params.anodeConc}
                      onChange={(e) => updateParams({ anodeConc: parseFloat(e.target.value) })}
                      className="lab-input w-24 px-2.5 py-1 rounded-md font-mono tabular-nums text-xs text-right"
                    />
                  </div>
                  <ParameterSlider
                    label=""
                    value={params.anodeConc}
                    min={0.001}
                    max={5.0}
                    step={0.005}
                    unit="M"
                    displayValue={formatNum(params.anodeConc, 3)}
                    onChange={(v) => updateParams({ anodeConc: Number(v.toFixed(3)) })}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[var(--text-secondary)]">
                      Cathode [{params.cathodeIonFormula}] Concentration (M)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={params.cathodeConc}
                      onChange={(e) => updateParams({ cathodeConc: parseFloat(e.target.value) })}
                      className="lab-input w-24 px-2.5 py-1 rounded-md font-mono tabular-nums text-xs text-right"
                    />
                  </div>
                  <ParameterSlider
                    label=""
                    value={params.cathodeConc}
                    min={0.001}
                    max={5.0}
                    step={0.005}
                    unit="M"
                    displayValue={formatNum(params.cathodeConc, 3)}
                    onChange={(v) => updateParams({ cathodeConc: Number(v.toFixed(3)) })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <label className="space-y-1 text-xs">
                    <span className="text-[var(--text-muted)]">Anode Exponent (νₐ)</span>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      step={1}
                      value={params.anodeStoich}
                      onChange={(e) => updateParams({ anodeStoich: parseFloat(e.target.value) })}
                      className="lab-input w-full px-3 py-1.5 rounded-lg font-mono text-sm"
                    />
                  </label>
                  <label className="space-y-1 text-xs">
                    <span className="text-[var(--text-muted)]">Cathode Exponent (ν_c)</span>
                    <input
                      type="number"
                      min={1}
                      max={6}
                      step={1}
                      value={params.cathodeStoich}
                      onChange={(e) => updateParams({ cathodeStoich: parseFloat(e.target.value) })}
                      className="lab-input w-full px-3 py-1.5 rounded-lg font-mono text-sm"
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-xs font-medium text-[var(--text-secondary)]">
                  Direct Reaction Quotient (Q)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={params.manualQ}
                  onChange={(e) => updateParams({ manualQ: parseFloat(e.target.value) })}
                  className="lab-input w-full px-3 py-2 rounded-lg font-mono tabular-nums text-sm font-semibold"
                />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[0.001, 0.01, 0.1, 1, 10, 100, 1000].map((qOpt) => (
                    <button
                      key={qOpt}
                      type="button"
                      onClick={() => updateParams({ manualQ: qOpt })}
                      className="px-2 py-1 text-[11px] font-mono rounded-md bg-[var(--bg-subtle)] hover:bg-[var(--accent-soft)] text-[var(--text-primary)] cursor-pointer"
                    >
                      Q={qOpt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </LabCard>

        {/* Right: Output Summary & Step-by-Step Symbolic Derivation */}
        <div className="lg:col-span-7 space-y-5">
          <LabCard className="p-5">
            <div className="grid sm:grid-cols-3 gap-5 pb-4 border-b border-[var(--border-hairline)]">
              <div>
                <div className="text-xs text-[var(--text-muted)]">Final Cell Potential (E)</div>
                <div className="font-mono tabular-nums text-3xl font-bold text-[var(--text-primary)] mt-1">
                  {result.isValid ? `${formatSigned(result.cellPotential, p)} V` : '—'}
                </div>
                <div className="text-xs font-medium text-[var(--accent)] mt-1">
                  {result.spontaneityLabel}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Standard Potential (E°)</div>
                <div className="font-mono tabular-nums text-2xl font-bold text-[var(--text-primary)] mt-1">
                  {result.isValid ? `${formatSigned(result.effectiveStandardPotential, p)} V` : '—'}
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)] mt-1">
                  ΔG° = {result.isValid ? `${formatNum(result.standardGibbsKJ, 1)} kJ/mol` : '—'}
                </div>
              </div>
              <div>
                <div className="text-xs text-[var(--text-muted)]">Nernst Correction</div>
                <div
                  className={`font-mono tabular-nums text-2xl font-bold mt-1 ${
                    result.nernstCorrection >= 0 ? 'text-teal-500' : 'text-amber-500'
                  }`}
                >
                  {result.isValid ? `${formatSigned(result.nernstCorrection, p)} V` : '—'}
                </div>
                <div className="text-xs font-mono text-[var(--text-muted)] mt-1">
                  ΔG = {result.isValid ? `${formatNum(result.gibbsFreeEnergyKJ, 1)} kJ/mol` : '—'}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
              <div>
                <div className="text-[var(--text-muted)]">Quotient (Q)</div>
                <div className="font-mono font-semibold text-[var(--text-primary)] mt-0.5">
                  {result.isValid ? formatScientific(result.effectiveQ, 4) : '—'}
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Temperature</div>
                <div className="font-mono font-semibold text-[var(--text-primary)] mt-0.5">
                  {result.isValid ? `${formatNum(result.temperatureK, 2)} K` : '—'}
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Electrons (n)</div>
                <div className="font-mono font-semibold text-[var(--text-primary)] mt-0.5">
                  {params.electronsN} mol e⁻
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Equilibrium log₁₀(K)</div>
                <div className="font-mono font-semibold text-[var(--text-primary)] mt-0.5">
                  {result.isValid ? formatNum(result.log10K, 2) : '—'}
                </div>
              </div>
            </div>
          </LabCard>

          <LabCard className="p-5 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                Step-by-Step Nernst Equation Substitution
              </h3>
              <span className="font-mono text-xs text-[var(--accent)]">
                {result.isAt25C ? '298.15 K (25 °C) Special Form Matches' : 'General Temperature Form'}
              </span>
            </div>

            {result.isValid ? (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)]">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">
                    1. Natural Logarithm & Base-10 Equations
                  </div>
                  <div className="grid sm:grid-cols-2 gap-2 font-mono text-[var(--text-secondary)]">
                    <div>E = E° − (RT / nF) ln(Q)</div>
                    <div>
                      E = E° − ({formatNum(result.log10Factor * params.electronsN, 5)} / n) log₁₀(Q)
                    </div>
                  </div>
                  {result.isAt25C && (
                    <div className="mt-1.5 text-[11px] font-mono text-[var(--accent)]">
                      At 25 °C (298.15 K): 2.3026·RT/F = {STANDARD_25C_FACTOR.toFixed(5)} V ≈ 0.05916 V
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)]">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">
                    2. Compute Reaction Quotient Q & Logarithms
                  </div>
                  <div className="font-mono text-[var(--text-secondary)] space-y-1">
                    {!params.useManualQ ? (
                      <div>
                        Q = {params.reactionDirection === 'forward'
                          ? `[${params.anodeIonFormula}]^${params.anodeStoich} / [${params.cathodeIonFormula}]^${params.cathodeStoich} = (${params.anodeConc})^${params.anodeStoich} / (${params.cathodeConc})^${params.cathodeStoich}`
                          : `[${params.cathodeIonFormula}]^${params.cathodeStoich} / [${params.anodeIonFormula}]^${params.anodeStoich} = (${params.cathodeConc})^${params.cathodeStoich} / (${params.anodeConc})^${params.anodeStoich}`}{' '}
                        = <strong className="text-[var(--text-primary)]">{formatScientific(result.effectiveQ, 5)}</strong>
                      </div>
                    ) : (
                      <div>
                        Q (effective) = <strong className="text-[var(--text-primary)]">{formatScientific(result.effectiveQ, 5)}</strong>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-x-6 gap-y-1 text-[var(--text-muted)]">
                      <span>ln(Q) = {formatNum(result.lnQ, 5)}</span>
                      <span>log₁₀(Q) = {formatNum(result.log10Q, 5)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)]">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">
                    3. Evaluate Thermal Potential Factor RT/(nF)
                  </div>
                  <div className="font-mono text-[var(--text-secondary)] space-y-1">
                    <div>
                      RT / (nF) = ({GAS_CONSTANT_R.toFixed(4)} J·mol⁻¹·K⁻¹ × {result.temperatureK.toFixed(2)} K) / ({params.electronsN} × {FARADAY_CONSTANT_F.toFixed(2)} C·mol⁻¹)
                    </div>
                    <div>
                      RT / (nF) = <strong className="text-[var(--text-primary)]">{formatNum(result.rtOverNF, 6)} V</strong> &nbsp;·&nbsp; Base-10 slope = <strong className="text-[var(--text-primary)]">{formatNum(result.log10Factor, 6)} V/decade</strong>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)]">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">
                    4. Substitute & Compute Final Cell Potential (E)
                  </div>
                  <div className="font-mono text-[var(--text-primary)] space-y-1">
                    <div>
                      Natural-log form: E = {formatSigned(result.effectiveStandardPotential, p)} − ({formatNum(result.rtOverNF, 5)})({formatNum(result.lnQ, 5)})
                    </div>
                    <div>
                      Base-10 form: &nbsp;&nbsp;&nbsp;E = {formatSigned(result.effectiveStandardPotential, p)} − ({formatNum(result.log10Factor, 5)})({formatNum(result.log10Q, 5)})
                    </div>
                    <div className="pt-1 text-sm font-bold text-[var(--accent)]">
                      E = {formatSigned(result.effectiveStandardPotential, p)} + ({formatSigned(result.nernstCorrection, p)}) = {formatSigned(result.cellPotential, p)} V
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-rose-500">
                Enter valid positive temperature (K), electron count (n), and concentrations (&gt; 0 M) to compute the Nernst derivation.
              </p>
            )}
          </LabCard>

          <InsightsPanel insights={insights} />
        </div>
      </div>
    </div>
  );
}
