import { Copy, FileSpreadsheet, FileText, Printer, X } from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import {
  exportSimulationCSV,
  exportSimulationPDF,
  formatCalculationClipboardText,
} from '../lib/export';
import { FARADAY_CONSTANT_F, GAS_CONSTANT_R } from '../lib/nernst';
import { formatNum, formatScientific, formatSigned } from '../lib/utils';
import { LabButton } from './ui';

export function ReportModal() {
  const { params, result, insights, reportModalOpen, setReportModalOpen, showToast } =
    useSimulation();

  if (!reportModalOpen) return null;

  const p = params.precision;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatCalculationClipboardText(params, result));
      showToast('Report summary copied to clipboard');
    } catch {
      showToast('Clipboard copy unavailable in this browser context');
    }
  };

  const handlePdf = () => {
    exportSimulationPDF(params, result);
    showToast('PDF scientific report downloaded');
  };

  const handleCsv = () => {
    exportSimulationCSV(params, result);
    showToast('Simulation CSV downloaded');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Export and Printable Scientific Report"
    >
      <div className="bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-hairline)] no-print">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Scientific Simulation Report
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              NernstLab · {new Date().toLocaleString()}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReportModalOpen(false)}
            aria-label="Close report modal"
            className="p-2 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-[var(--text-secondary)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-hairline)]">
            <div>
              <div className="text-xs font-mono text-[var(--accent)] font-semibold">
                NERNSTLAB TECHNICAL REPORT
              </div>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mt-0.5">
                {params.cellName}
              </h3>
              <p className="font-mono text-xs text-[var(--text-muted)] mt-0.5">{params.notation}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs text-[var(--text-muted)]">Calculated Cell Potential</div>
              <div className="font-mono tabular-nums text-3xl font-bold text-[var(--text-primary)]">
                {result.isValid ? `${formatSigned(result.cellPotential, p)} V` : 'Invalid'}
              </div>
              <div className="text-xs font-medium text-[var(--accent)]">
                {result.spontaneityLabel}
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-2">
              <div className="text-xs font-semibold text-[var(--text-primary)]">
                Electrochemical Equations
              </div>
              <div className="space-y-1 text-xs font-mono">
                <div>
                  <span className="text-[var(--text-muted)]">Oxidation: </span>
                  {params.oxidationHalfReaction}
                </div>
                <div>
                  <span className="text-[var(--text-muted)]">Reduction: </span>
                  {params.reductionHalfReaction}
                </div>
                <div className="pt-1 border-t border-[var(--border-hairline)] font-semibold text-[var(--text-primary)]">
                  {params.overallReaction}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-1.5 text-xs">
              <div className="font-semibold text-[var(--text-primary)] mb-1">Input Conditions</div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--text-muted)]">Standard Potential E°:</span>
                <span className="text-[var(--text-primary)]">
                  {formatSigned(result.effectiveStandardPotential, p)} V
                </span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--text-muted)]">Temperature:</span>
                <span className="text-[var(--text-primary)]">
                  {formatNum(result.temperatureK, 2)} K ({formatNum(result.temperatureC, 2)} °C)
                </span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--text-muted)]">Electrons (n):</span>
                <span className="text-[var(--text-primary)]">{params.electronsN} mol e⁻</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--text-muted)]">
                  [{params.anodeIonFormula}] / [{params.cathodeIonFormula}]:
                </span>
                <span className="text-[var(--text-primary)]">
                  {params.anodeConc} M / {params.cathodeConc} M
                </span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-[var(--text-muted)]">Reaction Quotient Q:</span>
                <span className="text-[var(--text-primary)]">
                  {formatScientific(result.effectiveQ, 4)}
                </span>
              </div>
            </div>
          </div>

          {result.isValid && (
            <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-hairline)] space-y-2">
              <div className="text-xs font-semibold text-[var(--text-primary)]">
                Nernst Equation Derivation
              </div>
              <div className="font-mono text-xs space-y-1.5 text-[var(--text-secondary)]">
                <div>E = E° − (RT / nF) ln(Q)</div>
                <div>
                  RT / (nF) = ({GAS_CONSTANT_R.toFixed(4)} × {result.temperatureK.toFixed(2)}) / (
                  {params.electronsN} × {FARADAY_CONSTANT_F.toFixed(2)}) ={' '}
                  <strong className="text-[var(--text-primary)]">{formatNum(result.rtOverNF, 6)} V</strong>
                </div>
                <div>
                  ln(Q) = ln({formatScientific(result.effectiveQ, 4)}) ={' '}
                  <strong className="text-[var(--text-primary)]">{formatNum(result.lnQ, 5)}</strong> &nbsp;|&nbsp; log₁₀(Q) ={' '}
                  <strong className="text-[var(--text-primary)]">{formatNum(result.log10Q, 5)}</strong>
                </div>
                <div>
                  Nernst Correction = −({formatNum(result.rtOverNF, 6)}) × ({formatNum(result.lnQ, 5)}) ={' '}
                  <strong className="text-[var(--text-primary)]">{formatSigned(result.nernstCorrection, p)} V</strong>
                </div>
                <div className="pt-1.5 border-t border-[var(--border-hairline)] text-sm font-semibold text-[var(--text-primary)]">
                  E = {formatSigned(result.effectiveStandardPotential, p)} + (
                  {formatSigned(result.nernstCorrection, p)}) ={' '}
                  {formatSigned(result.cellPotential, p)} V &nbsp;|&nbsp; ΔG ={' '}
                  {formatNum(result.gibbsFreeEnergyKJ, 2)} kJ/mol
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="text-xs font-semibold text-[var(--text-primary)]">
              Analytical Interpretation
            </div>
            <ul className="space-y-1.5 text-xs text-[var(--text-secondary)]">
              {insights.slice(0, 4).map((ins) => (
                <li key={ins.id}>
                  <strong className="text-[var(--text-primary)]">{ins.title}:</strong> {ins.detail}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer Export Actions */}
        <div className="px-6 py-4 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3 no-print">
          <LabButton variant="ghost" size="sm" onClick={handleCopy} disabled={!result.isValid}>
            <Copy className="w-4 h-4" />
            Copy Text
          </LabButton>
          <div className="flex flex-wrap items-center gap-2">
            <LabButton variant="secondary" size="sm" onClick={handleCsv} disabled={!result.isValid}>
              <FileSpreadsheet className="w-4 h-4" />
              Export CSV
            </LabButton>
            <LabButton variant="secondary" size="sm" onClick={handlePrint} disabled={!result.isValid}>
              <Printer className="w-4 h-4" />
              Print Report
            </LabButton>
            <LabButton variant="primary" size="sm" onClick={handlePdf} disabled={!result.isValid}>
              <FileText className="w-4 h-4" />
              Download PDF
            </LabButton>
          </div>
        </div>
      </div>
    </div>
  );
}
