import { jsPDF } from 'jspdf';
import {
  FARADAY_CONSTANT_F,
  GAS_CONSTANT_R,
  type NernstCalculationResult,
  type SimulationParams,
} from './nernst';
import { generateScientificInsights } from './insights';
import { formatNum, formatScientific, formatSigned } from './utils';

export interface SavedSimulation {
  id: string;
  label: string;
  timestamp: string;
  params: SimulationParams;
  result: NernstCalculationResult;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSimulationCSV(params: SimulationParams, result: NernstCalculationResult) {
  const rows = [
    ['Project', 'NernstLab: Smart Electrochemical Cell Potential Prediction & Visualization System'],
    ['Generated At', new Date().toISOString()],
    ['Cell Name', params.cellName],
    ['Cell Notation', params.notation],
    ['Reaction Direction', params.reactionDirection],
    ['Oxidation Half-Reaction', params.oxidationHalfReaction],
    ['Reduction Half-Reaction', params.reductionHalfReaction],
    ['Overall Reaction', params.overallReaction],
    ['Standard Potential E° (V)', formatNum(result.effectiveStandardPotential, params.precision)],
    ['Temperature (K)', formatNum(result.temperatureK, 2)],
    ['Temperature (°C)', formatNum(result.temperatureC, 2)],
    ['Electrons Transferred (n)', String(params.electronsN)],
    [`Anode [${params.anodeIonFormula}] (M)`, String(params.anodeConc)],
    [`Cathode [${params.cathodeIonFormula}] (M)`, String(params.cathodeConc)],
    ['Reaction Quotient (Q)', String(result.effectiveQ)],
    ['ln(Q)', formatNum(result.lnQ, 6)],
    ['log10(Q)', formatNum(result.log10Q, 6)],
    ['RT / (nF) (V)', formatNum(result.rtOverNF, 6)],
    ['Nernst Correction (V)', formatSigned(result.nernstCorrection, params.precision)],
    ['Calculated Cell Potential E (V)', formatSigned(result.cellPotential, params.precision)],
    ['Gibbs Free Energy ΔG (kJ/mol)', formatNum(result.gibbsFreeEnergyKJ, 3)],
    ['Spontaneity Status', result.spontaneityLabel],
  ];

  const csv = rows
    .map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  triggerDownload(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `nernstlab-simulation-${Date.now()}.csv`
  );
}

export function exportHistoryCSV(history: SavedSimulation[]) {
  const headers = [
    'Label',
    'Date',
    'Cell Name',
    'Direction',
    'Temperature (K)',
    'Anode Conc (M)',
    'Cathode Conc (M)',
    'n',
    'Q',
    'E° (V)',
    'Nernst Correction (V)',
    'Calculated E (V)',
    'ΔG (kJ/mol)',
    'Spontaneity',
  ];

  const rows = history.map((item) => [
    item.label,
    new Date(item.timestamp).toLocaleString(),
    item.params.cellName,
    item.params.reactionDirection,
    item.result.temperatureK.toFixed(2),
    item.params.anodeConc,
    item.params.cathodeConc,
    item.params.electronsN,
    item.result.effectiveQ,
    item.result.effectiveStandardPotential.toFixed(4),
    item.result.nernstCorrection.toFixed(4),
    item.result.cellPotential.toFixed(4),
    item.result.gibbsFreeEnergyKJ.toFixed(2),
    item.result.spontaneityLabel,
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  triggerDownload(
    new Blob([csv], { type: 'text/csv;charset=utf-8;' }),
    `nernstlab-history-${Date.now()}.csv`
  );
}

export function exportChartDataCSV(
  filename: string,
  headers: string[],
  rows: Array<Array<string | number>>
) {
  const csv = [headers, ...rows]
    .map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  triggerDownload(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), `${filename}.csv`);
}

export function exportSvgChartAsPng(containerEl: HTMLElement | null, filename: string) {
  if (!containerEl) return;
  const svg = containerEl.querySelector('svg');
  if (!svg) return;

  const serializer = new XMLSerializer();
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const rect = svg.getBoundingClientRect();
  const width = Math.max(rect.width, 640);
  const height = Math.max(rect.height, 360);
  clone.setAttribute('width', String(width));
  clone.setAttribute('height', String(height));
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

  const svgString = serializer.serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    const scale = 2;
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(scale, scale);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      if (blob) triggerDownload(blob, `${filename}.png`);
    }, 'image/png');
  };
  img.src = url;
}

export function formatCalculationClipboardText(
  params: SimulationParams,
  result: NernstCalculationResult
): string {
  const p = params.precision;
  return [
    `NernstLab Electrochemical Calculation Report`,
    `Cell: ${params.cellName} (${params.notation})`,
    `Overall Reaction (${params.reactionDirection}): ${params.overallReaction}`,
    `--------------------------------------------------`,
    `E° = ${formatSigned(result.effectiveStandardPotential, p)} V`,
    `T  = ${formatNum(result.temperatureK, 2)} K (${formatNum(result.temperatureC, 2)} °C)`,
    `n  = ${params.electronsN} mol e⁻`,
    `Q  = ${formatScientific(result.effectiveQ, 4)}  (ln Q = ${formatNum(result.lnQ, 4)}, log10 Q = ${formatNum(result.log10Q, 4)})`,
    `--------------------------------------------------`,
    `Nernst Equation: E = E° - (RT / nF) ln(Q)`,
    `RT / (nF) = (${GAS_CONSTANT_R.toFixed(4)} × ${result.temperatureK.toFixed(2)}) / (${params.electronsN} × ${FARADAY_CONSTANT_F.toFixed(2)}) = ${formatNum(result.rtOverNF, 5)} V`,
    `Nernst Correction = -(${formatNum(result.rtOverNF, 5)}) × (${formatNum(result.lnQ, 4)}) = ${formatSigned(result.nernstCorrection, p)} V`,
    `Final Cell Potential E = ${formatSigned(result.cellPotential, p)} V`,
    `Gibbs Free Energy ΔG = ${formatNum(result.gibbsFreeEnergyKJ, 2)} kJ/mol (${result.spontaneityLabel})`,
  ].join('\n');
}

export function exportSimulationPDF(params: SimulationParams, result: NernstCalculationResult) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const p = params.precision;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 44;
  let y = 48;

  // Header band
  doc.setFillColor(24, 24, 27);
  doc.rect(0, 0, pageWidth, 82, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('NernstLab', margin, 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(253, 230, 138);
  doc.text('Electrochemical Cell Potential Prediction & Thermodynamic Report', margin, 56);
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 56, { align: 'right' });

  y = 112;
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('1. Selected Electrochemical System', margin, y);
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const systemLines = [
    `Cell System: ${params.cellName}`,
    `Cell Notation: ${params.notation}`,
    `Reaction Direction: ${params.reactionDirection === 'forward' ? 'Forward (Standard Notation)' : 'Reversed'}`,
    `Anode (Oxidation): ${params.oxidationHalfReaction}`,
    `Cathode (Reduction): ${params.reductionHalfReaction}`,
    `Overall Reaction: ${params.overallReaction}`,
  ];
  systemLines.forEach((line) => {
    doc.text(line, margin, y);
    y += 15;
  });

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('2. Input Parameters & Calculated Summary', margin, y);
  y += 18;

  // Summary box
  doc.setFillColor(248, 247, 244);
  doc.setDrawColor(220, 215, 205);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 118, 6, 6, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(217, 119, 6);
  doc.text('CALCULATED CELL POTENTIAL (E)', margin + 16, y + 24);
  doc.setFontSize(24);
  doc.setTextColor(24, 24, 27);
  doc.text(`${formatSigned(result.cellPotential, p)} V`, margin + 16, y + 52);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(63, 63, 70);
  doc.text(`Status: ${result.spontaneityLabel}`, margin + 16, y + 72);
  doc.text(`Gibbs Free Energy (ΔG): ${formatNum(result.gibbsFreeEnergyKJ, 2)} kJ/mol`, margin + 16, y + 88);
  doc.text(`Equilibrium Constant (log10 K): ${formatNum(result.log10K, 2)}`, margin + 16, y + 104);

  const rightCol = pageWidth / 2 + 12;
  doc.text(`Standard Potential (E°): ${formatSigned(result.effectiveStandardPotential, p)} V`, rightCol, y + 26);
  doc.text(`Nernst Correction: ${formatSigned(result.nernstCorrection, p)} V`, rightCol, y + 44);
  doc.text(`Temperature: ${formatNum(result.temperatureK, 2)} K (${formatNum(result.temperatureC, 2)} °C)`, rightCol, y + 62);
  doc.text(`Electrons Transferred (n): ${params.electronsN}`, rightCol, y + 80);
  doc.text(`Reaction Quotient (Q): ${formatScientific(result.effectiveQ, 4)}`, rightCol, y + 98);

  y += 144;
  doc.setTextColor(24, 24, 27);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('3. Step-by-Step Nernst Derivation', margin, y);
  y += 20;

  doc.setFont('courier', 'normal');
  doc.setFontSize(9.5);
  const steps = [
    `Formula:       E = E° - (R * T / (n * F)) * ln(Q)`,
    `Constants:     R = 8.3145 J/(mol·K),  F = 96485.33 C/mol`,
    `Step 1 (Q):    Q = ${formatScientific(result.effectiveQ, 4)}  =>  ln(Q) = ${formatNum(result.lnQ, 5)},  log10(Q) = ${formatNum(result.log10Q, 5)}`,
    `Step 2 (RT/nF): (8.3145 × ${result.temperatureK.toFixed(2)}) / (${params.electronsN} × 96485.33) = ${formatNum(result.rtOverNF, 6)} V`,
    `Step 3 (Term): -(${formatNum(result.rtOverNF, 6)}) × (${formatNum(result.lnQ, 5)}) = ${formatSigned(result.nernstCorrection, p)} V`,
    `Step 4 (E):    ${formatSigned(result.effectiveStandardPotential, p)} + (${formatSigned(result.nernstCorrection, p)}) = ${formatSigned(result.cellPotential, p)} V`,
  ];
  steps.forEach((s) => {
    doc.text(s, margin, y);
    y += 16;
  });

  y += 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('4. Scientific Insights & Analysis', margin, y);
  y += 18;

  const insights = generateScientificInsights(params, result);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  insights.slice(0, 4).forEach((ins) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(24, 24, 27);
    doc.text(`• ${ins.title}`, margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(82, 82, 91);
    const wrapped = doc.splitTextToSize(ins.detail, pageWidth - margin * 2 - 12);
    doc.text(wrapped, margin + 10, y);
    y += wrapped.length * 13 + 8;
  });

  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('NernstLab Electrochemical Simulation Platform — Calculated using exact CODATA physical constants.', margin, 812);

  doc.save(`nernstlab-report-${Date.now()}.pdf`);
}
