import { BookmarkPlus, RotateCcw } from 'lucide-react';
import { CellVisualization } from '../components/CellVisualization';
import { InsightsPanel } from '../components/InsightsPanel';
import {
  LabButton,
  LabCard,
  ParameterSlider,
  SectionHeader,
  SegmentedControl,
} from '../components/ui';
import { useSimulation } from '../context/SimulationContext';
import { CELL_PRESETS, type PresetId } from '../lib/nernst';
import { formatNum, formatScientific, formatSigned } from '../lib/utils';

export function AnimationView() {
  const {
    params,
    result,
    insights,
    updateParams,
    selectPreset,
    switchTemperatureUnit,
    resetSimulation,
    saveCurrentSimulation,
  } = useSimulation();

  const presets: Array<Exclude<PresetId, 'custom'>> = [
    'daniell',
    'iron-copper',
    'concentration',
    'silver-zinc',
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Live Electrochemical Cell Animation"
        subtitle="Watch oxidation, electron flow, cathode deposition, and salt-bridge ion migration respond instantaneously to concentration and temperature changes."
        action={
          <>
            <LabButton variant="secondary" size="sm" onClick={resetSimulation}>
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Conditions
            </LabButton>
            <LabButton variant="primary" size="sm" onClick={() => saveCurrentSimulation()}>
              <BookmarkPlus className="w-3.5 h-3.5" />
              Save Snapshot
            </LabButton>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {presets.map((id) => {
          const item = CELL_PRESETS[id];
          const active = params.presetId === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectPreset(id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                active
                  ? 'bg-[var(--accent)] text-[var(--accent-fg)] border-transparent font-semibold'
                  : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-strong)] hover:bg-[var(--bg-subtle)]'
              }`}
            >
              {item.shortName}
            </button>
          );
        })}
      </div>

      <div className="grid xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-8">
          <CellVisualization />
        </div>

        <div className="xl:col-span-4 space-y-5">
          <LabCard className="p-5 space-y-5">
            <div className="flex items-baseline justify-between pb-3 border-b border-[var(--border-hairline)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">Live Cell Controls</h2>
              <span className="font-mono text-sm font-bold text-[var(--accent)]">
                {result.isValid ? `${formatSigned(result.cellPotential, params.precision)} V` : '—'}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-secondary)]">
                  Solution Temperature
                </span>
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
                label="Temperature"
                value={params.temperatureValue}
                min={params.temperatureUnit === 'K' ? 273.15 : 0}
                max={params.temperatureUnit === 'K' ? 373.15 : 100}
                step={1}
                unit={params.temperatureUnit === 'K' ? 'K' : '°C'}
                displayValue={formatNum(params.temperatureValue, 1)}
                helperText="Changes thermal kinetic speed"
                onChange={(v) => updateParams({ temperatureValue: v })}
              />
            </div>

            <div className="pt-2 border-t border-[var(--border-hairline)]">
              <ParameterSlider
                label={`Anode [${params.anodeIonFormula}] Concentration`}
                value={params.anodeConc}
                min={0.005}
                max={3.0}
                step={0.01}
                unit="M"
                displayValue={formatNum(params.anodeConc, 3)}
                helperText="Adjusts left beaker ion density"
                onChange={(v) =>
                  updateParams({ useManualQ: false, anodeConc: Number(v.toFixed(3)) })
                }
              />
            </div>

            <div className="pt-2 border-t border-[var(--border-hairline)]">
              <ParameterSlider
                label={`Cathode [${params.cathodeIonFormula}] Concentration`}
                value={params.cathodeConc}
                min={0.005}
                max={3.0}
                step={0.01}
                unit="M"
                displayValue={formatNum(params.cathodeConc, 3)}
                helperText="Adjusts right beaker ion density"
                onChange={(v) =>
                  updateParams({ useManualQ: false, cathodeConc: Number(v.toFixed(3)) })
                }
              />
            </div>

            <div className="pt-3 border-t border-[var(--border-hairline)] grid grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[var(--text-muted)]">Reaction Quotient Q</div>
                <div className="font-mono font-semibold text-[var(--text-primary)] mt-0.5">
                  {result.isValid ? formatScientific(result.effectiveQ, 3) : '—'}
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Nernst Shift</div>
                <div className="font-mono font-semibold text-[var(--accent)] mt-0.5">
                  {result.isValid ? `${formatSigned(result.nernstCorrection, 4)} V` : '—'}
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Gibbs Energy ΔG</div>
                <div className="font-mono font-semibold text-[var(--text-primary)] mt-0.5">
                  {result.isValid ? `${formatNum(result.gibbsFreeEnergyKJ, 1)} kJ/mol` : '—'}
                </div>
              </div>
              <div>
                <div className="text-[var(--text-muted)]">Status</div>
                <div className="font-medium text-[var(--text-primary)] mt-0.5 truncate">
                  {result.spontaneityLabel}
                </div>
              </div>
            </div>
          </LabCard>

          <InsightsPanel insights={insights} compact />
        </div>
      </div>
    </div>
  );
}
