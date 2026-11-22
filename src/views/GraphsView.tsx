import { useMemo, useRef, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Download, FileSpreadsheet, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import {
  LabButton,
  LabCard,
  ParameterSlider,
  SectionHeader,
  SegmentedControl,
} from '../components/ui';
import { useSimulation } from '../context/SimulationContext';
import { exportChartDataCSV, exportSvgChartAsPng } from '../lib/export';
import {
  generateConcentrationSeries,
  generateQuotientSeries,
  generateTemperatureSeries,
} from '../lib/nernst';
import { formatNum, formatScientific, formatSigned } from '../lib/utils';

export function GraphsView() {
  const { params, result, updateParams, showToast, theme } = useSimulation();

  const [tempRange, setTempRange] = useState<[number, number]>([273.15, 373.15]);
  const [showStdLine, setShowStdLine] = useState(true);
  const [showActualLine, setShowActualLine] = useState(true);

  const [concTarget, setConcTarget] = useState<'cathode' | 'anode'>('cathode');
  const [concLogScale, setConcLogScale] = useState(true);
  const [concMax, setConcMax] = useState(3.0);

  const [qLogScale, setQLogScale] = useState(true);
  const [qExponentRange, setQExponentRange] = useState<[number, number]>([-3, 3]);

  const chart1Ref = useRef<HTMLDivElement | null>(null);
  const chart2Ref = useRef<HTMLDivElement | null>(null);
  const chart3Ref = useRef<HTMLDivElement | null>(null);
  const chart4Ref = useRef<HTMLDivElement | null>(null);

  const chartTheme = useMemo(() => {
    if (theme === 'forest') {
      return {
        grid: '#20332A',
        axis: '#96B5A7',
        tooltipBg: '#131D18',
        tooltipBorder: '#2A4538',
        tooltipText: '#ECFDF5',
        linePrimary: '#34D399',
        lineSecondary: '#FBBF24',
        lineTertiary: '#FB923C',
        stdBar: '#6B8F7E',
        zeroLine: '#96B5A7',
      };
    }
    if (theme === 'ivory') {
      return {
        grid: '#E6E1D6',
        axis: '#57534E',
        tooltipBg: '#FFFFFF',
        tooltipBorder: '#D6D0C4',
        tooltipText: '#18181B',
        linePrimary: '#D97706',
        lineSecondary: '#059669',
        lineTertiary: '#EA580C',
        stdBar: '#44403C',
        zeroLine: '#44403C',
      };
    }
    return {
      grid: '#2A2A31',
      axis: '#A1A1AA',
      tooltipBg: '#18181B',
      tooltipBorder: '#3F3F46',
      tooltipText: '#F5F5F4',
      linePrimary: '#F59E0B',
      lineSecondary: '#10B981',
      lineTertiary: '#FB923C',
      stdBar: '#71717A',
      zeroLine: '#A1A1AA',
    };
  }, [theme]);

  const tempData = useMemo(
    () => generateTemperatureSeries(params, tempRange[0], tempRange[1], 45),
    [params, tempRange]
  );

  const concData = useMemo(
    () => generateConcentrationSeries(params, concTarget, concLogScale, 0.005, concMax, 48),
    [params, concTarget, concLogScale, concMax]
  );

  const quotientData = useMemo(
    () => generateQuotientSeries(params, qLogScale, qExponentRange[0], qExponentRange[1], 52),
    [params, qLogScale, qExponentRange]
  );

  const comparisonData = useMemo(() => {
    if (!result.isValid) return [];
    return [
      {
        name: 'Standard (E°)',
        value: Number(result.effectiveStandardPotential.toFixed(4)),
        fill: chartTheme.stdBar,
      },
      {
        name: 'Nernst Correction',
        value: Number(result.nernstCorrection.toFixed(4)),
        fill: result.nernstCorrection >= 0 ? '#10B981' : '#EA580C',
      },
      {
        name: 'Actual Potential (E)',
        value: Number(result.cellPotential.toFixed(4)),
        fill: chartTheme.linePrimary,
      },
    ];
  }, [result, chartTheme]);

  const zoomTemp = (factor: number) => {
    const center = result.isValid ? result.temperatureK : 298.15;
    const halfSpan = ((tempRange[1] - tempRange[0]) / 2) * factor;
    const clampedSpan = Math.min(Math.max(halfSpan, 10), 120);
    setTempRange([
      Math.max(200, Number((center - clampedSpan).toFixed(1))),
      Math.min(500, Number((center + clampedSpan).toFixed(1))),
    ]);
  };

  const resetZoomAll = () => {
    setTempRange([273.15, 373.15]);
    setConcMax(3.0);
    setQExponentRange([-3, 3]);
    setShowStdLine(true);
    setShowActualLine(true);
    showToast('All chart ranges and series reset');
  };

  const currentTempX =
    params.temperatureUnit === 'K'
      ? Number(result.temperatureK.toFixed(2))
      : Number(result.temperatureC.toFixed(2));

  const currentConcVal = concTarget === 'cathode' ? params.cathodeConc : params.anodeConc;
  const currentConcX = concLogScale
    ? Number(Math.log10(Math.max(currentConcVal, 1e-6)).toFixed(3))
    : Number(currentConcVal.toFixed(3));

  const currentQX = qLogScale
    ? Number(Math.log10(Math.max(result.effectiveQ, 1e-9)).toFixed(3))
    : Number(result.effectiveQ.toPrecision(4));

  const tooltipStyle = {
    backgroundColor: chartTheme.tooltipBg,
    borderColor: chartTheme.tooltipBorder,
    color: chartTheme.tooltipText,
    borderRadius: '10px',
    fontSize: '12px',
    fontFamily: 'IBM Plex Mono',
  };

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Interactive Graph Explorer"
        subtitle="Live thermodynamic curves computed mathematically from your current cell parameters. Hover to inspect coordinates, toggle log scales, zoom, or export."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showActualLine}
                onChange={(e) => setShowActualLine(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              Actual E
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-lg px-2.5 py-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={showStdLine}
                onChange={(e) => setShowStdLine(e.target.checked)}
                className="accent-[var(--accent)]"
              />
              Standard E°
            </label>
            <LabButton variant="secondary" size="sm" onClick={resetZoomAll}>
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Zoom
            </LabButton>
          </div>
        }
      />

      <div className="grid xl:grid-cols-2 gap-6">
        {/* GRAPH 1 */}
        <LabCard className="p-5 flex flex-col space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                1. Cell Potential (E) vs Temperature
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Slope = −(R / nF) ln(Q) · Active: {currentTempX} {params.temperatureUnit === 'K' ? 'K' : '°C'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <LabButton variant="ghost" size="sm" onClick={() => zoomTemp(0.7)} title="Zoom in">
                <ZoomIn className="w-3.5 h-3.5" />
              </LabButton>
              <LabButton variant="ghost" size="sm" onClick={() => zoomTemp(1.4)} title="Zoom out">
                <ZoomOut className="w-3.5 h-3.5" />
              </LabButton>
              <LabButton
                variant="ghost"
                size="sm"
                title="Download PNG"
                onClick={() => {
                  exportSvgChartAsPng(chart1Ref.current, 'nernstlab-potential-vs-temperature');
                  showToast('Temperature chart PNG downloaded');
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </LabButton>
              <LabButton
                variant="ghost"
                size="sm"
                title="Export CSV"
                onClick={() => {
                  exportChartDataCSV(
                    'nernstlab-potential-vs-temperature',
                    ['Temp (K)', 'Temp (°C)', 'Actual E (V)', 'Standard E° (V)', 'Nernst Correction (V)'],
                    tempData.map((d) => [d.tempK, d.tempC, d.potential, d.standardPotential, d.correction])
                  );
                  showToast('Temperature dataset CSV exported');
                }}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </LabButton>
            </div>
          </div>

          <div ref={chart1Ref} className="h-[270px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tempData} margin={{ top: 10, right: 16, left: 4, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis
                  dataKey={params.temperatureUnit === 'K' ? 'tempK' : 'tempC'}
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fontSize: 11, fill: chartTheme.axis, fontFamily: 'IBM Plex Mono' }}
                  label={{
                    value: params.temperatureUnit === 'K' ? 'Temperature (K)' : 'Temperature (°C)',
                    position: 'insideBottom',
                    offset: -10,
                    style: { fontSize: 11, fill: chartTheme.axis },
                  }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: chartTheme.axis, fontFamily: 'IBM Plex Mono' }}
                  tickFormatter={(v: number) => `${v.toFixed(2)}V`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown, name: unknown) => [
                    `${formatSigned(Number(value), 4)} V`,
                    String(name),
                  ]}
                  labelFormatter={(l) => `T = ${l} ${params.temperatureUnit === 'K' ? 'K' : '°C'}`}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                {showStdLine && (
                  <Line
                    type="monotone"
                    dataKey="standardPotential"
                    name="Standard E°"
                    stroke="#94A3B8"
                    strokeWidth={1.6}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {showActualLine && (
                  <Line
                    type="monotone"
                    dataKey="potential"
                    name="Cell Potential E"
                    stroke={chartTheme.linePrimary}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {result.isValid && (
                  <>
                    <ReferenceLine
                      x={currentTempX}
                      stroke={chartTheme.linePrimary}
                      strokeDasharray="3 3"
                      strokeOpacity={0.5}
                    />
                    <ReferenceDot
                      x={currentTempX}
                      y={Number(result.cellPotential.toFixed(5))}
                      r={5.5}
                      fill={chartTheme.linePrimary}
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  </>
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ParameterSlider
            label="Live Temperature Scrubber"
            value={params.temperatureValue}
            min={params.temperatureUnit === 'K' ? tempRange[0] : Number((tempRange[0] - 273.15).toFixed(1))}
            max={params.temperatureUnit === 'K' ? tempRange[1] : Number((tempRange[1] - 273.15).toFixed(1))}
            step={1}
            unit={params.temperatureUnit === 'K' ? 'K' : '°C'}
            displayValue={formatNum(params.temperatureValue, 1)}
            onChange={(val) => updateParams({ temperatureValue: val })}
          />
        </LabCard>

        {/* GRAPH 2 */}
        <LabCard className="p-5 flex flex-col space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                2. Cell Potential (E) vs Ion Concentration
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Sweeping [{concTarget === 'cathode' ? params.cathodeIonFormula : params.anodeIonFormula}] · {concLogScale ? 'Log₁₀[Ion] linear slope' : 'Molarity curve'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <LabButton
                variant="ghost"
                size="sm"
                title="Download PNG"
                onClick={() => {
                  exportSvgChartAsPng(chart2Ref.current, 'nernstlab-potential-vs-concentration');
                  showToast('Concentration chart PNG downloaded');
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </LabButton>
              <LabButton
                variant="ghost"
                size="sm"
                title="Export CSV"
                onClick={() => {
                  exportChartDataCSV(
                    'nernstlab-potential-vs-concentration',
                    ['Concentration (M)', 'log10(Conc)', 'Actual E (V)', 'Standard E° (V)', 'Q'],
                    concData.map((d) => [d.concentration, d.logConc, d.potential, d.standardPotential, d.qValue])
                  );
                  showToast('Concentration dataset CSV exported');
                }}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </LabButton>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <SegmentedControl
              value={concTarget}
              onChange={setConcTarget}
              options={[
                { value: 'cathode', label: `Cathode [${params.cathodeIonFormula}]` },
                { value: 'anode', label: `Anode [${params.anodeIonFormula}]` },
              ]}
            />
            <SegmentedControl
              value={concLogScale ? 'log' : 'linear'}
              onChange={(v) => setConcLogScale(v === 'log')}
              options={[
                { value: 'log', label: 'Log Scale' },
                { value: 'linear', label: 'Linear (M)' },
              ]}
            />
          </div>

          <div ref={chart2Ref} className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={concData} margin={{ top: 10, right: 16, left: 4, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis
                  dataKey={concLogScale ? 'logConc' : 'concentration'}
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fontSize: 11, fill: chartTheme.axis, fontFamily: 'IBM Plex Mono' }}
                  label={{
                    value: concLogScale ? 'log₁₀(Concentration / M)' : 'Concentration (M)',
                    position: 'insideBottom',
                    offset: -10,
                    style: { fontSize: 11, fill: chartTheme.axis },
                  }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: chartTheme.axis, fontFamily: 'IBM Plex Mono' }}
                  tickFormatter={(v: number) => `${v.toFixed(2)}V`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown, name: unknown) => [
                    `${formatSigned(Number(value), 4)} V`,
                    String(name),
                  ]}
                  labelFormatter={(l) =>
                    concLogScale
                      ? `log₁₀(C) = ${l} (${Math.pow(10, Number(l)).toFixed(3)} M)`
                      : `C = ${l} M`
                  }
                />
                {showStdLine && (
                  <Line
                    type="monotone"
                    dataKey="standardPotential"
                    name="Standard E°"
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {showActualLine && (
                  <Line
                    type="monotone"
                    dataKey="potential"
                    name="Cell Potential E"
                    stroke={chartTheme.lineSecondary}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {result.isValid && (
                  <ReferenceDot
                    x={currentConcX}
                    y={Number(result.cellPotential.toFixed(5))}
                    r={5.5}
                    fill={chartTheme.lineSecondary}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ParameterSlider
            label={`Active ${concTarget === 'cathode' ? 'Cathode' : 'Anode'} Concentration`}
            value={currentConcVal}
            min={0.005}
            max={concMax}
            step={0.01}
            unit="M"
            displayValue={formatNum(currentConcVal, 3)}
            onChange={(val) =>
              updateParams(
                concTarget === 'cathode'
                  ? { useManualQ: false, cathodeConc: Number(val.toFixed(3)) }
                  : { useManualQ: false, anodeConc: Number(val.toFixed(3)) }
              )
            }
          />
        </LabCard>

        {/* GRAPH 3 */}
        <LabCard className="p-5 flex flex-col space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                3. Cell Potential (E) vs Reaction Quotient (Q)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Active Q = {result.isValid ? formatScientific(result.effectiveQ, 3) : '—'} · Crosses E° at Q = 1
              </p>
            </div>
            <div className="flex items-center gap-1">
              <SegmentedControl
                value={qLogScale ? 'log' : 'linear'}
                onChange={(v) => setQLogScale(v === 'log')}
                options={[
                  { value: 'log', label: 'log₁₀(Q)' },
                  { value: 'linear', label: 'Linear Q' },
                ]}
              />
              <LabButton
                variant="ghost"
                size="sm"
                title="Download PNG"
                onClick={() => {
                  exportSvgChartAsPng(chart3Ref.current, 'nernstlab-potential-vs-quotient');
                  showToast('Quotient chart PNG downloaded');
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </LabButton>
              <LabButton
                variant="ghost"
                size="sm"
                title="Export CSV"
                onClick={() => {
                  exportChartDataCSV(
                    'nernstlab-potential-vs-quotient',
                    ['Q', 'log10(Q)', 'Actual E (V)', 'Standard E° (V)'],
                    quotientData.map((d) => [d.q, d.logQ, d.potential, d.standardPotential])
                  );
                  showToast('Quotient dataset CSV exported');
                }}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </LabButton>
            </div>
          </div>

          <div ref={chart3Ref} className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quotientData} margin={{ top: 10, right: 16, left: 4, bottom: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                <XAxis
                  dataKey={qLogScale ? 'logQ' : 'q'}
                  type="number"
                  domain={['dataMin', 'dataMax']}
                  tick={{ fontSize: 11, fill: chartTheme.axis, fontFamily: 'IBM Plex Mono' }}
                  label={{
                    value: qLogScale ? 'log₁₀(Q)' : 'Reaction Quotient Q',
                    position: 'insideBottom',
                    offset: -10,
                    style: { fontSize: 11, fill: chartTheme.axis },
                  }}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fontSize: 11, fill: chartTheme.axis, fontFamily: 'IBM Plex Mono' }}
                  tickFormatter={(v: number) => `${v.toFixed(2)}V`}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown, name: unknown) => [
                    `${formatSigned(Number(value), 4)} V`,
                    String(name),
                  ]}
                  labelFormatter={(l) =>
                    qLogScale ? `log₁₀(Q) = ${l} (Q = ${formatScientific(Math.pow(10, Number(l)), 2)})` : `Q = ${l}`
                  }
                />
                <ReferenceLine x={qLogScale ? 0 : 1} stroke="#94A3B8" strokeDasharray="4 3" />
                {showStdLine && (
                  <Line
                    type="monotone"
                    dataKey="standardPotential"
                    name="Standard E°"
                    stroke="#94A3B8"
                    strokeWidth={1.5}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {showActualLine && (
                  <Line
                    type="monotone"
                    dataKey="potential"
                    name="Cell Potential E"
                    stroke={chartTheme.lineTertiary}
                    strokeWidth={2.5}
                    dot={false}
                    isAnimationActive={false}
                  />
                )}
                {result.isValid && (
                  <ReferenceDot
                    x={currentQX}
                    y={Number(result.cellPotential.toFixed(5))}
                    r={5.5}
                    fill={chartTheme.lineTertiary}
                    stroke="#FFFFFF"
                    strokeWidth={2}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <ParameterSlider
            label="Reaction Quotient Slider (log₁₀ Q)"
            value={result.isValid ? Math.min(Math.max(result.log10Q, qExponentRange[0]), qExponentRange[1]) : 0}
            min={qExponentRange[0]}
            max={qExponentRange[1]}
            step={0.1}
            unit=""
            displayValue={`Q = ${result.isValid ? formatScientific(result.effectiveQ, 3) : '—'}`}
            onChange={(logVal) => {
              const qNew = Number(Math.pow(10, logVal).toPrecision(4));
              updateParams({
                useManualQ: true,
                manualQ: params.reactionDirection === 'reverse' ? 1 / qNew : qNew,
              });
            }}
          />
        </LabCard>

        {/* GRAPH 4 */}
        <LabCard className="p-5 flex flex-col space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">
                4. Standard (E°) vs Nernst Correction vs Actual (E)
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Additive decomposition: E = E° + (−RT/nF · ln Q)
              </p>
            </div>
            <div className="flex items-center gap-1">
              <LabButton
                variant="ghost"
                size="sm"
                title="Download PNG"
                onClick={() => {
                  exportSvgChartAsPng(chart4Ref.current, 'nernstlab-standard-vs-actual');
                  showToast('Comparison chart PNG downloaded');
                }}
              >
                <Download className="w-3.5 h-3.5" />
              </LabButton>
              <LabButton
                variant="ghost"
                size="sm"
                title="Export CSV"
                onClick={() => {
                  exportChartDataCSV(
                    'nernstlab-standard-vs-actual',
                    ['Component', 'Voltage (V)'],
                    comparisonData.map((d) => [d.name, d.value])
                  );
                  showToast('Decomposition CSV exported');
                }}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
              </LabButton>
            </div>
          </div>

          <div ref={chart4Ref} className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 14, right: 16, left: 4, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: chartTheme.axis }} />
                <YAxis
                  tick={{ fontSize: 11, fill: chartTheme.axis, fontFamily: 'IBM Plex Mono' }}
                  tickFormatter={(v: number) => `${v.toFixed(2)}V`}
                />
                <ReferenceLine y={0} stroke={chartTheme.zeroLine} strokeWidth={1.2} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: unknown) => [`${formatSigned(Number(value), 4)} V`, 'Potential']}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={72}>
                  {comparisonData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2 border-t border-[var(--border-hairline)] text-xs">
            <div>
              <div className="text-[var(--text-muted)]">E° (Standard)</div>
              <div className="font-mono font-semibold text-[var(--text-primary)]">
                {result.isValid ? `${formatSigned(result.effectiveStandardPotential, 4)} V` : '—'}
              </div>
            </div>
            <div>
              <div className="text-[var(--text-muted)]">Correction Term</div>
              <div
                className={`font-mono font-semibold ${
                  result.nernstCorrection >= 0 ? 'text-emerald-500' : 'text-orange-500'
                }`}
              >
                {result.isValid ? `${formatSigned(result.nernstCorrection, 4)} V` : '—'}
              </div>
            </div>
            <div>
              <div className="text-[var(--text-muted)]">Resulting E</div>
              <div className="font-mono font-semibold text-[var(--accent)]">
                {result.isValid ? `${formatSigned(result.cellPotential, 4)} V` : '—'}
              </div>
            </div>
          </div>
        </LabCard>
      </div>
    </div>
  );
}
