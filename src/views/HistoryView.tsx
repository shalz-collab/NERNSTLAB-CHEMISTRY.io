import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BookmarkPlus,
  Check,
  Edit3,
  FileSpreadsheet,
  GitCompare,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import { LabButton, LabCard, SectionHeader } from '../components/ui';
import { useSimulation } from '../context/SimulationContext';
import { exportHistoryCSV } from '../lib/export';
import { formatNum, formatScientific, formatSigned } from '../lib/utils';

export function HistoryView() {
  const {
    history,
    saveCurrentSimulation,
    renameHistoryItem,
    deleteHistoryItem,
    loadHistoryItem,
    compareIds,
    toggleCompareId,
    clearCompareIds,
    setActivePage,
    showToast,
    theme,
    isDarkTheme,
  } = useSimulation();

  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const comparedItems = useMemo(
    () => history.filter((h) => compareIds.includes(h.id)).slice(0, 3),
    [history, compareIds]
  );

  const comparisonChartData = useMemo(() => {
    return comparedItems.map((item) => ({
      name: item.label.length > 22 ? `${item.label.slice(0, 20)}…` : item.label,
      'Standard E° (V)': Number(item.result.effectiveStandardPotential.toFixed(4)),
      'Nernst Shift (V)': Number(item.result.nernstCorrection.toFixed(4)),
      'Actual E (V)': Number(item.result.cellPotential.toFixed(4)),
    }));
  }, [comparedItems]);

  const diffHighlights = useMemo(() => {
    if (comparedItems.length < 2) return null;
    const potentials = comparedItems.map((c) => c.result.cellPotential);
    const temps = comparedItems.map((c) => c.result.temperatureK);

    const maxE = Math.max(...potentials);
    const minE = Math.min(...potentials);
    const maxT = Math.max(...temps);
    const minT = Math.min(...temps);

    return {
      voltageSpread: maxE - minE,
      tempSpread: maxT - minT,
      highestVoltageLabel:
        comparedItems.find((c) => c.result.cellPotential === maxE)?.label ?? '',
    };
  }, [comparedItems]);

  const handleSaveCustom = () => {
    saveCurrentSimulation(newLabel || undefined);
    setNewLabel('');
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Simulation History & Side-by-Side Comparison"
        subtitle="Locally stored electrochemical trials. Save snapshots, rename or reload past runs, export to CSV, and compare up to three experiments simultaneously."
        action={
          <LabButton
            variant="secondary"
            size="sm"
            disabled={history.length === 0}
            onClick={() => {
              exportHistoryCSV(history);
              showToast('Simulation history exported as CSV');
            }}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export History CSV
          </LabButton>
        }
      />

      <LabCard className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Optional run label (e.g., Daniell Cell @ 60 °C, 0.05 M Zn²⁺)"
          className="lab-input flex-1 px-3.5 py-2 rounded-lg text-sm placeholder:text-[var(--text-muted)]"
        />
        <LabButton variant="primary" size="md" onClick={handleSaveCustom}>
          <BookmarkPlus className="w-4 h-4" />
          Save Current Simulation
        </LabButton>
      </LabCard>

      <LabCard className="p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[var(--accent)]" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                Compare Simulations ({comparedItems.length} / 3 selected)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Select up to three rows in the history table below to compare thermodynamic metrics and potential shifts.
              </p>
            </div>
          </div>
          {comparedItems.length > 0 && (
            <LabButton variant="ghost" size="sm" onClick={clearCompareIds}>
              Clear Selection
            </LabButton>
          )}
        </div>

        {comparedItems.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--text-muted)]">
            Select at least two saved simulations below to generate a comparative graph and difference highlights.
          </div>
        ) : (
          <div className="space-y-5">
            {diffHighlights && (
              <div className="grid sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[var(--accent-soft)] border border-[var(--accent-border)] text-xs">
                <div>
                  <div className="text-[var(--text-muted)]">Largest Potential Spread (ΔE)</div>
                  <div className="font-mono text-base font-bold text-[var(--accent)] mt-0.5">
                    {formatNum(diffHighlights.voltageSpread, 4)} V
                  </div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)]">Temperature Span (ΔT)</div>
                  <div className="font-mono text-base font-bold text-[var(--text-primary)] mt-0.5">
                    {formatNum(diffHighlights.tempSpread, 2)} K
                  </div>
                </div>
                <div>
                  <div className="text-[var(--text-muted)]">Highest Output Trial</div>
                  <div className="text-sm font-semibold text-[var(--text-primary)] mt-0.5 truncate">
                    {diffHighlights.highestVoltageLabel}
                  </div>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                    <th className="py-2.5 pr-4 font-medium">Metric</th>
                    {comparedItems.map((item) => (
                      <th key={item.id} className="py-2.5 px-3 font-semibold text-[var(--text-primary)]">
                        {item.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)] font-mono tabular-nums text-[var(--text-secondary)]">
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-[var(--text-muted)]">Cell Type</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-2.5 px-3 font-sans font-medium text-[var(--text-primary)]">
                        {item.params.cellName}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-[var(--text-muted)]">Temperature</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-2.5 px-3">
                        {formatNum(item.result.temperatureK, 2)} K ({formatNum(item.result.temperatureC, 1)} °C)
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-[var(--text-muted)]">Concentrations (Anode / Cathode)</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-2.5 px-3">
                        {item.params.anodeConc} M / {item.params.cathodeConc} M
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-[var(--text-muted)]">Reaction Quotient (Q)</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-2.5 px-3">
                        {formatScientific(item.result.effectiveQ, 3)}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-[var(--text-muted)]">Standard Potential (E°)</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-2.5 px-3">
                        {formatSigned(item.result.effectiveStandardPotential, 4)} V
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-4 font-sans text-[var(--text-muted)]">Nernst Correction</td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-2.5 px-3 text-teal-500">
                        {formatSigned(item.result.nernstCorrection, 4)} V
                      </td>
                    ))}
                  </tr>
                  <tr className="bg-[var(--bg-surface-elevated)]">
                    <td className="py-2.5 pr-4 font-sans font-semibold text-[var(--text-primary)]">
                      Actual Cell Potential (E)
                    </td>
                    {comparedItems.map((item) => (
                      <td key={item.id} className="py-2.5 px-3 font-bold text-[var(--accent)] text-sm">
                        {formatSigned(item.result.cellPotential, 4)} V
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 16, left: 4, bottom: 8 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={theme === 'forest' ? '#20332A' : isDarkTheme ? '#2A2A31' : '#E6E1D6'}
                    vertical={false}
                  />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDarkTheme ? '#A1A1AA' : '#57534E' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: isDarkTheme ? '#A1A1AA' : '#57534E', fontFamily: 'IBM Plex Mono' }}
                    tickFormatter={(v: number) => `${v.toFixed(2)}V`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: theme === 'forest' ? '#131D18' : isDarkTheme ? '#18181B' : '#FFFFFF',
                      borderColor: theme === 'forest' ? '#2A4538' : isDarkTheme ? '#3F3F46' : '#D6D0C4',
                      color: isDarkTheme ? '#F5F5F4' : '#18181B',
                      borderRadius: '10px',
                      fontSize: '12px',
                      fontFamily: 'IBM Plex Mono',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar
                    dataKey="Standard E° (V)"
                    fill={theme === 'forest' ? '#6B8F7E' : isDarkTheme ? '#71717A' : '#44403C'}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                  <Bar dataKey="Nernst Shift (V)" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={36} />
                  <Bar
                    dataKey="Actual E (V)"
                    fill={theme === 'forest' ? '#34D399' : theme === 'ivory' ? '#D97706' : '#F59E0B'}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </LabCard>

      <LabCard className="overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border-hairline)] flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Saved Simulations ({history.length})
          </h2>
          <span className="text-xs text-[var(--text-muted)]">Stored locally in browser storage</span>
        </div>

        {history.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">
            No simulations saved yet. Click <strong>Save Current Simulation</strong> above to archive your active run.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-surface-elevated)] border-b border-[var(--border-hairline)] text-[var(--text-muted)]">
                  <th className="py-3 pl-5 pr-2 font-medium">Compare</th>
                  <th className="py-3 px-3 font-medium">Label & Date</th>
                  <th className="py-3 px-3 font-medium">Cell</th>
                  <th className="py-3 px-3 font-medium">Temp</th>
                  <th className="py-3 px-3 font-medium">Conc. (A / C)</th>
                  <th className="py-3 px-3 font-medium">E°</th>
                  <th className="py-3 px-3 font-medium">Calculated E</th>
                  <th className="py-3 pl-3 pr-5 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-hairline)] text-[var(--text-secondary)]">
                {history.map((item) => {
                  const isCompared = compareIds.includes(item.id);
                  const isEditing = editingId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={isCompared ? 'bg-[var(--accent-soft)]/70' : 'hover:bg-[var(--bg-subtle)]/50'}
                    >
                      <td className="py-3 pl-5 pr-2">
                        <input
                          type="checkbox"
                          checked={isCompared}
                          onChange={() => toggleCompareId(item.id)}
                          aria-label={`Select ${item.label} for comparison`}
                          className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 max-w-[240px]">
                        {isEditing ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  renameHistoryItem(item.id, editingText);
                                  setEditingId(null);
                                }
                              }}
                              className="lab-input w-full px-2 py-1 rounded text-xs"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => {
                                renameHistoryItem(item.id, editingText);
                                setEditingId(null);
                              }}
                              className="p-1 text-teal-500 hover:bg-teal-500/15 rounded cursor-pointer"
                              aria-label="Save name"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] rounded cursor-pointer"
                              aria-label="Cancel rename"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="font-semibold text-[var(--text-primary)] truncate">
                              {item.label}
                            </div>
                            <div className="text-[11px] text-[var(--text-muted)]">
                              {new Date(item.timestamp).toLocaleString()}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">{item.params.cellName}</td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        {formatNum(item.result.temperatureK, 1)} K
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        {item.params.anodeConc} / {item.params.cathodeConc} M
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums">
                        {formatSigned(item.result.effectiveStandardPotential, 3)} V
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums font-bold text-[var(--accent)]">
                        {formatSigned(item.result.cellPotential, 4)} V
                      </td>
                      <td className="py-3 pl-3 pr-5">
                        <div className="flex items-center justify-end gap-1">
                          <LabButton
                            variant="ghost"
                            size="sm"
                            title="Load into simulator"
                            onClick={() => {
                              loadHistoryItem(item.id);
                              setActivePage('simulator');
                            }}
                          >
                            <Play className="w-3.5 h-3.5" />
                            Load
                          </LabButton>
                          <button
                            type="button"
                            title="Rename"
                            onClick={() => {
                              setEditingId(item.id);
                              setEditingText(item.label);
                            }}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Delete"
                            onClick={() => deleteHistoryItem(item.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </LabCard>
    </div>
  );
}
