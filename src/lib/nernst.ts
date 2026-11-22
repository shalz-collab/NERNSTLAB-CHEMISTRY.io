export const GAS_CONSTANT_R = 8.314462618; // J / (mol * K)
export const FARADAY_CONSTANT_F = 96485.33212; // C / mol
export const LN_10 = Math.LN10; // 2.302585092994046
export const STANDARD_TEMP_K = 298.15; // 25 °C
export const STANDARD_TEMP_C = 25;
export const STANDARD_25C_FACTOR = (GAS_CONSTANT_R * STANDARD_TEMP_K * LN_10) / FARADAY_CONSTANT_F; // 0.05915935... V

export type TemperatureUnit = 'K' | 'C';
export type ReactionDirection = 'forward' | 'reverse';
export type PresetId = 'daniell' | 'iron-copper' | 'concentration' | 'silver-zinc' | 'custom';

export interface CellDefinition {
  id: PresetId;
  name: string;
  shortName: string;
  notation: string;
  description: string;
  anodeMaterial: string;
  anodeSymbol: string;
  anodeIonFormula: string;
  anodeColor: string;
  anodeSolutionColor: string;
  anodePotentialStd: number; // E°_red of anode couple (V)
  oxidationHalfReaction: string;
  cathodeMaterial: string;
  cathodeSymbol: string;
  cathodeIonFormula: string;
  cathodeColor: string;
  cathodeSolutionColor: string;
  cathodePotentialStd: number; // E°_red of cathode couple (V)
  reductionHalfReaction: string;
  overallReaction: string;
  defaultN: number;
  defaultAnodeStoich: number;
  defaultCathodeStoich: number;
  defaultAnodeConc: number; // M
  defaultCathodeConc: number; // M
}

export const CELL_PRESETS: Record<Exclude<PresetId, 'custom'>, CellDefinition> = {
  daniell: {
    id: 'daniell',
    name: 'Daniell Cell (Zn–Cu)',
    shortName: 'Daniell Cell',
    notation: 'Zn(s) | Zn²⁺(aq) || Cu²⁺(aq) | Cu(s)',
    description: 'Classic galvanic cell pairing zinc oxidation with copper(II) reduction.',
    anodeMaterial: 'Zinc',
    anodeSymbol: 'Zn',
    anodeIonFormula: 'Zn²⁺',
    anodeColor: '#94A3B8',
    anodeSolutionColor: 'rgba(203, 213, 225, 0.35)',
    anodePotentialStd: -0.763,
    oxidationHalfReaction: 'Zn(s) → Zn²⁺(aq) + 2e⁻',
    cathodeMaterial: 'Copper',
    cathodeSymbol: 'Cu',
    cathodeIonFormula: 'Cu²⁺',
    cathodeColor: '#C26D3A',
    cathodeSolutionColor: 'rgba(14, 165, 233, 0.32)',
    cathodePotentialStd: 0.340,
    reductionHalfReaction: 'Cu²⁺(aq) + 2e⁻ → Cu(s)',
    overallReaction: 'Zn(s) + Cu²⁺(aq) ⇌ Zn²⁺(aq) + Cu(s)',
    defaultN: 2,
    defaultAnodeStoich: 1,
    defaultCathodeStoich: 1,
    defaultAnodeConc: 1.0,
    defaultCathodeConc: 1.0,
  },
  'iron-copper': {
    id: 'iron-copper',
    name: 'Iron–Copper Cell (Fe–Cu)',
    shortName: 'Iron–Copper',
    notation: 'Fe(s) | Fe²⁺(aq) || Cu²⁺(aq) | Cu(s)',
    description: 'Galvanic couple combining ferrous iron oxidation with copper(II) deposition.',
    anodeMaterial: 'Iron',
    anodeSymbol: 'Fe',
    anodeIonFormula: 'Fe²⁺',
    anodeColor: '#64748B',
    anodeSolutionColor: 'rgba(16, 185, 129, 0.24)',
    anodePotentialStd: -0.447,
    oxidationHalfReaction: 'Fe(s) → Fe²⁺(aq) + 2e⁻',
    cathodeMaterial: 'Copper',
    cathodeSymbol: 'Cu',
    cathodeIonFormula: 'Cu²⁺',
    cathodeColor: '#C26D3A',
    cathodeSolutionColor: 'rgba(14, 165, 233, 0.32)',
    cathodePotentialStd: 0.340,
    reductionHalfReaction: 'Cu²⁺(aq) + 2e⁻ → Cu(s)',
    overallReaction: 'Fe(s) + Cu²⁺(aq) ⇌ Fe²⁺(aq) + Cu(s)',
    defaultN: 2,
    defaultAnodeStoich: 1,
    defaultCathodeStoich: 1,
    defaultAnodeConc: 0.5,
    defaultCathodeConc: 1.0,
  },
  concentration: {
    id: 'concentration',
    name: 'Copper Concentration Cell',
    shortName: 'Concentration Cell',
    notation: 'Cu(s) | Cu²⁺(dilute) || Cu²⁺(conc.) | Cu(s)',
    description: 'Identical copper electrodes driven solely by ion concentration gradient (E° = 0 V).',
    anodeMaterial: 'Copper (Dilute)',
    anodeSymbol: 'Cu',
    anodeIonFormula: 'Cu²⁺',
    anodeColor: '#C26D3A',
    anodeSolutionColor: 'rgba(56, 189, 248, 0.14)',
    anodePotentialStd: 0.340,
    oxidationHalfReaction: 'Cu(s) → Cu²⁺(dilute, aq) + 2e⁻',
    cathodeMaterial: 'Copper (Concentrated)',
    cathodeSymbol: 'Cu',
    cathodeIonFormula: 'Cu²⁺',
    cathodeColor: '#B45309',
    cathodeSolutionColor: 'rgba(2, 132, 199, 0.44)',
    cathodePotentialStd: 0.340,
    reductionHalfReaction: 'Cu²⁺(conc., aq) + 2e⁻ → Cu(s)',
    overallReaction: 'Cu²⁺(conc.) ⇌ Cu²⁺(dilute)',
    defaultN: 2,
    defaultAnodeStoich: 1,
    defaultCathodeStoich: 1,
    defaultAnodeConc: 0.01,
    defaultCathodeConc: 1.0,
  },
  'silver-zinc': {
    id: 'silver-zinc',
    name: 'Zinc–Silver Cell (Zn–Ag)',
    shortName: 'Zinc–Silver',
    notation: 'Zn(s) | Zn²⁺(aq) || Ag⁺(aq) | Ag(s)',
    description: 'High-potential asymmetric stoichiometry cell demonstrating squared ion activity in Q.',
    anodeMaterial: 'Zinc',
    anodeSymbol: 'Zn',
    anodeIonFormula: 'Zn²⁺',
    anodeColor: '#94A3B8',
    anodeSolutionColor: 'rgba(203, 213, 225, 0.30)',
    anodePotentialStd: -0.763,
    oxidationHalfReaction: 'Zn(s) → Zn²⁺(aq) + 2e⁻',
    cathodeMaterial: 'Silver',
    cathodeSymbol: 'Ag',
    cathodeIonFormula: 'Ag⁺',
    cathodeColor: '#CBD5E1',
    cathodeSolutionColor: 'rgba(186, 230, 253, 0.36)',
    cathodePotentialStd: 0.800,
    reductionHalfReaction: '2Ag⁺(aq) + 2e⁻ → 2Ag(s)',
    overallReaction: 'Zn(s) + 2Ag⁺(aq) ⇌ Zn²⁺(aq) + 2Ag(s)',
    defaultN: 2,
    defaultAnodeStoich: 1,
    defaultCathodeStoich: 2,
    defaultAnodeConc: 0.25,
    defaultCathodeConc: 1.0,
  },
};

export interface SimulationParams {
  presetId: PresetId;
  cellName: string;
  notation: string;
  anodeMaterial: string;
  anodeSymbol: string;
  anodeIonFormula: string;
  anodeColor: string;
  anodeSolutionColor: string;
  anodePotentialStd: number;
  oxidationHalfReaction: string;
  cathodeMaterial: string;
  cathodeSymbol: string;
  cathodeIonFormula: string;
  cathodeColor: string;
  cathodeSolutionColor: string;
  cathodePotentialStd: number;
  reductionHalfReaction: string;
  overallReaction: string;
  standardPotentialOverride: number | null; // null => computed as E°cathode - E°anode
  temperatureValue: number; // in current temperatureUnit
  temperatureUnit: TemperatureUnit;
  electronsN: number;
  anodeConc: number; // mol/L (M)
  cathodeConc: number; // mol/L (M)
  anodeStoich: number; // exponent for anode product ion
  cathodeStoich: number; // exponent for cathode reactant ion
  useManualQ: boolean;
  manualQ: number;
  reactionDirection: ReactionDirection;
  precision: number; // 2, 3, 4, or 5
}

export interface ValidationIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
}

export interface NernstCalculationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  temperatureK: number;
  temperatureC: number;
  baseStandardPotential: number; // E° for written forward cell (E°cathode - E°anode or override)
  effectiveStandardPotential: number; // adjusted for direction
  reactionQuotientForward: number;
  effectiveQ: number; // adjusted for direction
  lnQ: number;
  log10Q: number;
  rtOverNF: number; // RT / (nF) in V
  log10Factor: number; // 2.302585 * RT / (nF) in V
  nernstCorrection: number; // -(RT / nF) * ln(Q) in V
  cellPotential: number; // E in V
  isAt25C: boolean;
  gibbsFreeEnergyKJ: number; // ΔG = -nFE in kJ/mol
  standardGibbsKJ: number; // ΔG° = -nFE° in kJ/mol
  equilibriumConstantK: number; // K = exp(n F E° / R T)
  log10K: number;
  spontaneity: 'spontaneous' | 'equilibrium' | 'non-spontaneous';
  spontaneityLabel: string;
  /** Which physical side acts as the actual electron source (true anode under spontaneous flow) */
  electronFlowDirection: 'left-to-right' | 'right-to-left' | 'equilibrium';
  anodeHalfPotentialActual: number;
  cathodeHalfPotentialActual: number;
}

export function createParamsFromPreset(presetId: Exclude<PresetId, 'custom'>): SimulationParams {
  const p = CELL_PRESETS[presetId];
  return {
    presetId,
    cellName: p.name,
    notation: p.notation,
    anodeMaterial: p.anodeMaterial,
    anodeSymbol: p.anodeSymbol,
    anodeIonFormula: p.anodeIonFormula,
    anodeColor: p.anodeColor,
    anodeSolutionColor: p.anodeSolutionColor,
    anodePotentialStd: p.anodePotentialStd,
    oxidationHalfReaction: p.oxidationHalfReaction,
    cathodeMaterial: p.cathodeMaterial,
    cathodeSymbol: p.cathodeSymbol,
    cathodeIonFormula: p.cathodeIonFormula,
    cathodeColor: p.cathodeColor,
    cathodeSolutionColor: p.cathodeSolutionColor,
    cathodePotentialStd: p.cathodePotentialStd,
    reductionHalfReaction: p.reductionHalfReaction,
    overallReaction: p.overallReaction,
    standardPotentialOverride: null,
    temperatureValue: 298.15,
    temperatureUnit: 'K',
    electronsN: p.defaultN,
    anodeConc: p.defaultAnodeConc,
    cathodeConc: p.defaultCathodeConc,
    anodeStoich: p.defaultAnodeStoich,
    cathodeStoich: p.defaultCathodeStoich,
    useManualQ: false,
    manualQ: Math.pow(p.defaultAnodeConc, p.defaultAnodeStoich) / Math.pow(p.defaultCathodeConc, p.defaultCathodeStoich),
    reactionDirection: 'forward',
    precision: 4,
  };
}

export function toKelvin(value: number, unit: TemperatureUnit): number {
  return unit === 'K' ? value : value + 273.15;
}

export function toCelsius(value: number, unit: TemperatureUnit): number {
  return unit === 'C' ? value : value - 273.15;
}

export function calculateNernst(params: SimulationParams): NernstCalculationResult {
  const issues: ValidationIssue[] = [];

  const temperatureK = toKelvin(params.temperatureValue, params.temperatureUnit);
  const temperatureC = toCelsius(params.temperatureValue, params.temperatureUnit);

  if (!Number.isFinite(temperatureK) || temperatureK <= 0) {
    issues.push({
      field: 'temperature',
      severity: 'error',
      message: 'Absolute temperature must be strictly greater than 0 K (-273.15 °C).',
    });
  } else if (temperatureK < 273.15) {
    issues.push({
      field: 'temperature',
      severity: 'warning',
      message: 'Temperature is below 0 °C (273.15 K); aqueous electrolyte solutions freeze at 1 atm.',
    });
  } else if (temperatureK > 373.15) {
    issues.push({
      field: 'temperature',
      severity: 'warning',
      message: 'Temperature exceeds 100 °C (373.15 K); aqueous solutions boil at 1 atm unless pressurized.',
    });
  }

  if (!Number.isFinite(params.electronsN) || params.electronsN <= 0) {
    issues.push({
      field: 'electronsN',
      severity: 'error',
      message: 'Number of transferred electrons (n) must be a positive number.',
    });
  } else if (!Number.isInteger(params.electronsN)) {
    issues.push({
      field: 'electronsN',
      severity: 'warning',
      message: 'Electron transfer count (n) is normally a positive integer for balanced redox equations.',
    });
  }

  if (!params.useManualQ) {
    if (!Number.isFinite(params.anodeConc) || params.anodeConc <= 0) {
      issues.push({
        field: 'anodeConc',
        severity: 'error',
        message: 'Anode ion concentration must be greater than 0 M (ln Q is undefined for ≤ 0).',
      });
    } else if (params.anodeConc > 10) {
      issues.push({
        field: 'anodeConc',
        severity: 'warning',
        message: 'Anode concentration exceeds 10 M; non-ideal ionic activity deviations become significant.',
      });
    }

    if (!Number.isFinite(params.cathodeConc) || params.cathodeConc <= 0) {
      issues.push({
        field: 'cathodeConc',
        severity: 'error',
        message: 'Cathode ion concentration must be greater than 0 M (division by zero or invalid logarithm).',
      });
    } else if (params.cathodeConc > 10) {
      issues.push({
        field: 'cathodeConc',
        severity: 'warning',
        message: 'Cathode concentration exceeds 10 M; non-ideal ionic activity deviations become significant.',
      });
    }

    if (!Number.isFinite(params.anodeStoich) || params.anodeStoich <= 0 || !Number.isFinite(params.cathodeStoich) || params.cathodeStoich <= 0) {
      issues.push({
        field: 'stoichiometry',
        severity: 'error',
        message: 'Reaction stoichiometric coefficients must be positive values.',
      });
    }
  } else {
    if (!Number.isFinite(params.manualQ) || params.manualQ <= 0) {
      issues.push({
        field: 'manualQ',
        severity: 'error',
        message: 'Reaction quotient Q must be strictly greater than 0.',
      });
    }
  }

  const baseStandardPotential =
    params.standardPotentialOverride !== null && Number.isFinite(params.standardPotentialOverride)
      ? params.standardPotentialOverride
      : Number((params.cathodePotentialStd - params.anodePotentialStd).toFixed(6));

  if (!Number.isFinite(baseStandardPotential)) {
    issues.push({
      field: 'standardPotential',
      severity: 'error',
      message: 'Standard cell potential E° must be a valid finite number.',
    });
  } else if (Math.abs(baseStandardPotential) > 6) {
    issues.push({
      field: 'standardPotential',
      severity: 'warning',
      message: 'Standard potential magnitude exceeds 6 V, which is outside typical aqueous electrochemical windows.',
    });
  }

  const hasError = issues.some((i) => i.severity === 'error');
  if (hasError) {
    return {
      isValid: false,
      issues,
      temperatureK: Number.isFinite(temperatureK) ? temperatureK : 298.15,
      temperatureC: Number.isFinite(temperatureC) ? temperatureC : 25,
      baseStandardPotential: Number.isFinite(baseStandardPotential) ? baseStandardPotential : 0,
      effectiveStandardPotential: NaN,
      reactionQuotientForward: NaN,
      effectiveQ: NaN,
      lnQ: NaN,
      log10Q: NaN,
      rtOverNF: NaN,
      log10Factor: NaN,
      nernstCorrection: NaN,
      cellPotential: NaN,
      isAt25C: false,
      gibbsFreeEnergyKJ: NaN,
      standardGibbsKJ: NaN,
      equilibriumConstantK: NaN,
      log10K: NaN,
      spontaneity: 'equilibrium',
      spontaneityLabel: 'Invalid Parameters',
      electronFlowDirection: 'equilibrium',
      anodeHalfPotentialActual: NaN,
      cathodeHalfPotentialActual: NaN,
    };
  }

  const reactionQuotientForward = params.useManualQ
    ? params.manualQ
    : Math.pow(params.anodeConc, params.anodeStoich) / Math.pow(params.cathodeConc, params.cathodeStoich);

  const isReversed = params.reactionDirection === 'reverse';
  const effectiveStandardPotential = isReversed ? -baseStandardPotential : baseStandardPotential;
  const effectiveQ = isReversed ? 1 / reactionQuotientForward : reactionQuotientForward;

  const lnQ = Math.log(effectiveQ);
  const log10Q = Math.log10(effectiveQ);
  const rtOverNF = (GAS_CONSTANT_R * temperatureK) / (params.electronsN * FARADAY_CONSTANT_F);
  const log10Factor = rtOverNF * LN_10;
  const nernstCorrection = -rtOverNF * lnQ;
  const cellPotential = effectiveStandardPotential + nernstCorrection;

  // Individual half-cell reduction potentials (relative to SHE)
  const anodeHalfPotentialActual =
    params.anodePotentialStd + rtOverNF * Math.log(Math.pow(Math.max(params.anodeConc, 1e-12), params.anodeStoich));
  const cathodeHalfPotentialActual =
    params.cathodePotentialStd + rtOverNF * Math.log(Math.pow(Math.max(params.cathodeConc, 1e-12), params.cathodeStoich));

  const gibbsFreeEnergyKJ = (-params.electronsN * FARADAY_CONSTANT_F * cellPotential) / 1000;
  const standardGibbsKJ = (-params.electronsN * FARADAY_CONSTANT_F * effectiveStandardPotential) / 1000;
  const log10K = (params.electronsN * FARADAY_CONSTANT_F * effectiveStandardPotential) / (GAS_CONSTANT_R * temperatureK * LN_10);
  const equilibriumConstantK = Math.abs(log10K) < 300 ? Math.pow(10, log10K) : log10K > 0 ? Infinity : 0;

  let spontaneity: 'spontaneous' | 'equilibrium' | 'non-spontaneous';
  let spontaneityLabel: string;
  if (Math.abs(cellPotential) < 1e-5) {
    spontaneity = 'equilibrium';
    spontaneityLabel = 'At Equilibrium (E = 0 V)';
  } else if (cellPotential > 0) {
    spontaneity = 'spontaneous';
    spontaneityLabel = 'Spontaneous (Galvanic)';
  } else {
    spontaneity = 'non-spontaneous';
    spontaneityLabel = 'Non-Spontaneous (Reverse Favored)';
  }

  // Physical direction of electron flow between Left (written anode) and Right (written cathode):
  // Calculate forward E_forward to know which physical electrode actually has lower reduction potential
  const forwardPotential = isReversed ? -cellPotential : cellPotential;
  let electronFlowDirection: 'left-to-right' | 'right-to-left' | 'equilibrium';
  if (Math.abs(forwardPotential) < 1e-5) {
    electronFlowDirection = 'equilibrium';
  } else if (forwardPotential > 0) {
    electronFlowDirection = 'left-to-right';
  } else {
    electronFlowDirection = 'right-to-left';
  }

  return {
    isValid: true,
    issues,
    temperatureK,
    temperatureC,
    baseStandardPotential,
    effectiveStandardPotential,
    reactionQuotientForward,
    effectiveQ,
    lnQ,
    log10Q,
    rtOverNF,
    log10Factor,
    nernstCorrection,
    cellPotential,
    isAt25C: Math.abs(temperatureK - STANDARD_TEMP_K) < 0.05,
    gibbsFreeEnergyKJ,
    standardGibbsKJ,
    equilibriumConstantK,
    log10K,
    spontaneity,
    spontaneityLabel,
    electronFlowDirection,
    anodeHalfPotentialActual,
    cathodeHalfPotentialActual,
  };
}

/** Graph 1: E vs Temperature */
export function generateTemperatureSeries(
  params: SimulationParams,
  minK = 273.15,
  maxK = 373.15,
  steps = 45
) {
  const data: Array<{
    tempK: number;
    tempC: number;
    potential: number;
    standardPotential: number;
    correction: number;
  }> = [];

  for (let i = 0; i <= steps; i++) {
    const tK = minK + ((maxK - minK) * i) / steps;
    const res = calculateNernst({
      ...params,
      temperatureValue: tK,
      temperatureUnit: 'K',
    });
    if (res.isValid) {
      data.push({
        tempK: Number(tK.toFixed(2)),
        tempC: Number((tK - 273.15).toFixed(2)),
        potential: Number(res.cellPotential.toFixed(5)),
        standardPotential: Number(res.effectiveStandardPotential.toFixed(5)),
        correction: Number(res.nernstCorrection.toFixed(5)),
      });
    }
  }
  return data;
}

/** Graph 2: E vs Ion Concentration (Cathode or Anode sweep) */
export function generateConcentrationSeries(
  params: SimulationParams,
  targetIon: 'cathode' | 'anode' = 'cathode',
  useLogScale = false,
  minConc = 0.001,
  maxConc = 5.0,
  steps = 50
) {
  const data: Array<{
    concentration: number;
    logConc: number;
    potential: number;
    standardPotential: number;
    qValue: number;
  }> = [];

  const logMin = Math.log10(Math.max(minConc, 1e-6));
  const logMax = Math.log10(Math.max(maxConc, minConc * 2));

  for (let i = 0; i <= steps; i++) {
    const conc = useLogScale
      ? Math.pow(10, logMin + ((logMax - logMin) * i) / steps)
      : minConc + ((maxConc - minConc) * i) / steps;

    const res = calculateNernst({
      ...params,
      useManualQ: false,
      cathodeConc: targetIon === 'cathode' ? conc : params.cathodeConc,
      anodeConc: targetIon === 'anode' ? conc : params.anodeConc,
    });
    if (res.isValid) {
      data.push({
        concentration: Number(conc.toFixed(5)),
        logConc: Number(Math.log10(conc).toFixed(3)),
        potential: Number(res.cellPotential.toFixed(5)),
        standardPotential: Number(res.effectiveStandardPotential.toFixed(5)),
        qValue: Number(res.effectiveQ.toFixed(5)),
      });
    }
  }
  return data;
}

/** Graph 3: E vs Reaction Quotient Q */
export function generateQuotientSeries(
  params: SimulationParams,
  useLogScale = true,
  minLogQ = -4,
  maxLogQ = 4,
  steps = 55
) {
  const data: Array<{
    q: number;
    logQ: number;
    potential: number;
    standardPotential: number;
  }> = [];

  const minLinearQ = Math.pow(10, Math.max(minLogQ, -2));
  const maxLinearQ = Math.min(Math.pow(10, maxLogQ), 100);

  for (let i = 0; i <= steps; i++) {
    const qVal = useLogScale
      ? Math.pow(10, minLogQ + ((maxLogQ - minLogQ) * i) / steps)
      : minLinearQ + ((maxLinearQ - minLinearQ) * i) / steps;

    const res = calculateNernst({
      ...params,
      useManualQ: true,
      manualQ: params.reactionDirection === 'reverse' ? 1 / qVal : qVal,
    });
    if (res.isValid) {
      data.push({
        q: Number(qVal.toPrecision(4)),
        logQ: Number(Math.log10(qVal).toFixed(3)),
        potential: Number(res.cellPotential.toFixed(5)),
        standardPotential: Number(res.effectiveStandardPotential.toFixed(5)),
      });
    }
  }
  return data;
}
