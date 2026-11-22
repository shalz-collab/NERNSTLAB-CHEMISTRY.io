import { type NernstCalculationResult, type SimulationParams } from './nernst';
import { formatNum, formatScientific, formatSigned } from './utils';

export interface ScientificInsight {
  id: string;
  category: 'Concentration' | 'Temperature' | 'Thermodynamics' | 'Electrochemistry' | 'Delta';
  title: string;
  detail: string;
  tone: 'positive' | 'neutral' | 'caution';
}

export function generateScientificInsights(
  params: SimulationParams,
  result: NernstCalculationResult,
  prevParams?: SimulationParams | null,
  prevResult?: NernstCalculationResult | null
): ScientificInsight[] {
  const insights: ScientificInsight[] = [];

  if (!result.isValid) {
    insights.push({
      id: 'invalid',
      category: 'Thermodynamics',
      title: 'Physical parameter constraint violated',
      detail: result.issues.find((i) => i.severity === 'error')?.message ?? 'Check input values.',
      tone: 'caution',
    });
    return insights;
  }

  // 1. Live delta explanation if user recently changed a parameter
  if (prevParams && prevResult && prevResult.isValid) {
    const deltaE = result.cellPotential - prevResult.cellPotential;
    if (Math.abs(deltaE) >= 0.0001) {
      const dirWord = deltaE > 0 ? 'increased' : 'decreased';
      if (params.cathodeConc !== prevParams.cathodeConc && !params.useManualQ) {
        const concDir = params.cathodeConc > prevParams.cathodeConc ? 'Increasing' : 'Decreasing';
        insights.push({
          id: 'delta-cathode',
          category: 'Delta',
          title: `${concDir} cathode [${params.cathodeIonFormula}] ${dirWord} cell potential`,
          detail: `Changing [${params.cathodeIonFormula}] from ${formatNum(prevParams.cathodeConc, 3)} M to ${formatNum(params.cathodeConc, 3)} M shifted Q to ${formatScientific(result.effectiveQ)} and changed E by ${formatSigned(deltaE, params.precision)} V.`,
          tone: deltaE > 0 ? 'positive' : 'neutral',
        });
      } else if (params.anodeConc !== prevParams.anodeConc && !params.useManualQ) {
        const concDir = params.anodeConc > prevParams.anodeConc ? 'Increasing' : 'Decreasing';
        insights.push({
          id: 'delta-anode',
          category: 'Delta',
          title: `${concDir} anode [${params.anodeIonFormula}] ${dirWord} cell potential`,
          detail: `Changing [${params.anodeIonFormula}] from ${formatNum(prevParams.anodeConc, 3)} M to ${formatNum(params.anodeConc, 3)} M adjusted Q to ${formatScientific(result.effectiveQ)}, shifting E by ${formatSigned(deltaE, params.precision)} V.`,
          tone: deltaE > 0 ? 'positive' : 'neutral',
        });
      } else if (Math.abs(result.temperatureK - prevResult.temperatureK) >= 0.05) {
        const tempDir = result.temperatureK > prevResult.temperatureK ? 'Raising' : 'Lowering';
        insights.push({
          id: 'delta-temp',
          category: 'Delta',
          title: `${tempDir} temperature altered the Nernst correction term`,
          detail: `Moving temperature to ${formatNum(result.temperatureK, 2)} K scaled RT/(nF) to ${formatNum(result.rtOverNF * 1000, 2)} mV, shifting E by ${formatSigned(deltaE, params.precision)} V.`,
          tone: deltaE > 0 ? 'positive' : 'neutral',
        });
      } else if (params.reactionDirection !== prevParams.reactionDirection) {
        insights.push({
          id: 'delta-direction',
          category: 'Delta',
          title: 'Reaction direction reversed',
          detail: `Reversing the cell reaction inverted Q to 1/Q and flipped the sign of E° and E (${formatSigned(result.cellPotential, params.precision)} V).`,
          tone: result.cellPotential > 0 ? 'positive' : 'caution',
        });
      }
    }
  }

  // 2. Reaction quotient shift analysis
  if (Math.abs(result.effectiveQ - 1) < 1e-4) {
    insights.push({
      id: 'q-standard',
      category: 'Concentration',
      title: 'System is at standard-state quotient (Q = 1)',
      detail: `Because ln(1) = 0, the Nernst correction term vanishes and the actual potential equals the standard potential E° = ${formatSigned(result.effectiveStandardPotential, params.precision)} V regardless of temperature.`,
      tone: 'neutral',
    });
  } else if (result.effectiveQ < 1) {
    insights.push({
      id: 'q-less-than-1',
      category: 'Concentration',
      title: 'Reactant-favored concentration increases voltage',
      detail: `With Q = ${formatScientific(result.effectiveQ)} < 1, ln(Q) = ${formatNum(result.lnQ, 3)} is negative. Subtracting (RT/nF)ln(Q) adds ${formatSigned(result.nernstCorrection, params.precision)} V above E°.`,
      tone: 'positive',
    });
  } else {
    insights.push({
      id: 'q-greater-than-1',
      category: 'Concentration',
      title: 'Product accumulation lowers cell potential',
      detail: `With Q = ${formatScientific(result.effectiveQ)} > 1, ln(Q) = ${formatNum(result.lnQ, 3)} is positive, producing a Nernst correction of ${formatSigned(result.nernstCorrection, params.precision)} V below E°.`,
      tone: 'neutral',
    });
  }

  // 3. Concentration cell special explanation
  if (Math.abs(result.effectiveStandardPotential) < 1e-5) {
    insights.push({
      id: 'concentration-cell',
      category: 'Electrochemistry',
      title: 'Concentration-driven entropic potential (E° = 0 V)',
      detail: `Identical half-cells yield E° = 0 V. All observed voltage (${formatSigned(result.cellPotential, params.precision)} V) arises purely from the concentration gradient driving ion equalization.`,
      tone: Math.abs(result.cellPotential) > 1e-4 ? 'positive' : 'neutral',
    });
  }

  // 4. Temperature coupling note
  if (Math.abs(result.lnQ) > 0.01) {
    const slopeMvPerK = (-result.rtOverNF / result.temperatureK) * result.lnQ * 1000;
    insights.push({
      id: 'temp-sensitivity',
      category: 'Temperature',
      title: `Thermal sensitivity: ${formatSigned(slopeMvPerK, 3)} mV/K`,
      detail: `At Q = ${formatScientific(result.effectiveQ)} and n = ${params.electronsN}, each 10 K rise shifts the Nernst potential by ${formatSigned(slopeMvPerK * 10, 2)} mV.`,
      tone: 'neutral',
    });
  }

  // 5. Spontaneity & Gibbs free energy
  if (result.spontaneity === 'spontaneous') {
    insights.push({
      id: 'spontaneous',
      category: 'Thermodynamics',
      title: 'Spontaneous galvanic operation (ΔG < 0)',
      detail: `Positive E (${formatSigned(result.cellPotential, params.precision)} V) gives ΔG = ${formatNum(result.gibbsFreeEnergyKJ, 2)} kJ/mol. Electrons flow spontaneously from ${result.electronFlowDirection === 'left-to-right' ? `${params.anodeSymbol} to ${params.cathodeSymbol}` : `${params.cathodeSymbol} to ${params.anodeSymbol}`}.`,
      tone: 'positive',
    });
  } else if (result.spontaneity === 'non-spontaneous') {
    insights.push({
      id: 'non-spontaneous',
      category: 'Thermodynamics',
      title: 'Non-spontaneous in selected direction (ΔG > 0)',
      detail: `Negative E (${formatSigned(result.cellPotential, params.precision)} V) yields ΔG = +${formatNum(Math.abs(result.gibbsFreeEnergyKJ), 2)} kJ/mol. Without external power, the reverse cell reaction proceeds spontaneously.`,
      tone: 'caution',
    });
  } else {
    insights.push({
      id: 'equilibrium',
      category: 'Thermodynamics',
      title: 'Electrochemical equilibrium reached (Q = K)',
      detail: 'Net cell potential is 0.0000 V and ΔG = 0 kJ/mol. Forward oxidation and reverse reduction rates are balanced, so net electron current ceases.',
      tone: 'neutral',
    });
  }

  return insights;
}
