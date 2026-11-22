import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  FastForward,
  Info,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  Zap,
} from 'lucide-react';
import { useSimulation } from '../context/SimulationContext';
import { formatNum, formatSigned } from '../lib/utils';
import { LabButton, LabCard } from './ui';

type InspectedTarget = 'anode' | 'cathode' | 'salt-bridge' | 'voltmeter' | null;

const MECHANISM_STEPS = [
  {
    step: 1,
    title: 'Anode Oxidation & Metal Dissolution',
    detail:
      'Surface metal atoms lose electrons and enter the aqueous phase as hydrated cations, leaving electrons behind on the electrode.',
  },
  {
    step: 2,
    title: 'External Circuit Electron Flow',
    detail:
      'Driven by the electrochemical potential gradient (E), electrons travel through the external wire and voltmeter toward the cathode.',
  },
  {
    step: 3,
    title: 'Cathode Reduction & Metal Deposition',
    detail:
      'Cations from the cathode electrolyte accept arriving electrons at the interface and deposit as solid metal onto the cathode.',
  },
  {
    step: 4,
    title: 'Salt Bridge Electroneutrality',
    detail:
      'Inert NO₃⁻ anions migrate toward the oxidizing compartment while K⁺ cations migrate toward the reducing compartment to prevent charge buildup.',
  },
];

interface CellVisualizationProps {
  compact?: boolean;
  showControls?: boolean;
  interactiveInspect?: boolean;
}

export function CellVisualization({
  compact = false,
  showControls = true,
  interactiveInspect = true,
}: CellVisualizationProps) {
  const {
    params,
    result,
    updateParams,
    motionMode,
    isSimulating,
    setIsSimulating,
    isDarkTheme,
    theme,
  } = useSimulation();

  const [speed, setSpeed] = useState(1.0);
  const [slowMotion, setSlowMotion] = useState(false);
  const [phase, setPhase] = useState(0);
  const [corrosionProgress, setCorrosionProgress] = useState(0.22);
  const [inspected, setInspected] = useState<InspectedTarget>(interactiveInspect ? 'anode' : null);
  const [activeStepIdx, setActiveStepIdx] = useState<number | null>(null);

  const lastTimeRef = useRef<number>(0);

  const thermalFactor = useMemo(() => {
    const t = result.isValid ? result.temperatureK : 298.15;
    return Math.min(Math.max(Math.sqrt(t / 298.15) * (t / 298.15), 0.45), 2.4);
  }, [result.isValid, result.temperatureK]);

  const emfSpeedFactor = useMemo(() => {
    if (!result.isValid || result.electronFlowDirection === 'equilibrium') return 0;
    return Math.min(Math.max(Math.abs(result.cellPotential) / 0.85, 0.35), 2.2);
  }, [result.isValid, result.cellPotential, result.electronFlowDirection]);

  useEffect(() => {
    if (!isSimulating || motionMode === 'reduced') return;

    let rafId = 0;
    const tick = (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const effectiveSpeed = (slowMotion ? 0.28 : speed) * (motionMode === 'enhanced' ? 1.25 : 1.0);
      setPhase((prev) => (prev + dt * effectiveSpeed) % 1000);

      if (result.isValid && result.electronFlowDirection !== 'equilibrium') {
        setCorrosionProgress((prev) => {
          const next = prev + dt * 0.025 * effectiveSpeed * emfSpeedFactor;
          return next > 1 ? 0.08 : next;
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    lastTimeRef.current = 0;
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isSimulating, speed, slowMotion, motionMode, result.isValid, result.electronFlowDirection, emfSpeedFactor]);

  const flowDir = result.electronFlowDirection;
  const isLeftOxidizing = flowDir === 'left-to-right';
  const isRightOxidizing = flowDir === 'right-to-left';
  const isEquilibrium = flowDir === 'equilibrium' || !result.isValid;

  const leftIonCount = useMemo(() => {
    const c = Math.max(params.anodeConc, 0.001);
    return Math.round(Math.min(Math.max(12 + Math.log10(c) * 5.5, 4), 26));
  }, [params.anodeConc]);

  const rightIonCount = useMemo(() => {
    const c = Math.max(params.cathodeConc, 0.001);
    return Math.round(Math.min(Math.max(12 + Math.log10(c) * 5.5, 4), 26));
  }, [params.cathodeConc]);

  // Non-blue scientific instrument SVG palette
  const svgColors = useMemo(() => {
    if (theme === 'forest') {
      return {
        stageBg: 'from-[#0E1813] via-[#122019] to-[#15261E]',
        bench: '#1F3329',
        benchShadow: '#070E0B',
        wireOuter: '#567365',
        wireGlow: '#34D399',
        electronFill: '#34D399',
        electronText: '#071911',
        arrowFill: '#34D399',
        captionFill: '#6EE7B7',
        ionLeft: '#FBBF24',
        ionRight: '#34D399',
        ionText: '#F2FBF6',
        labelPrimary: '#F2FBF6',
        labelSub: '#9AC0AC',
        glassStroke: '#6D9480',
        bridgeGlass: '#4B6B5C',
        bridgeGelTop: '#243C31',
        bridgeGelBot: '#192C23',
        bridgeText: '#BED8CA',
        leftSolFill: 'rgba(251, 191, 36, 0.14)',
        rightSolFill: 'rgba(52, 211, 153, 0.18)',
        meterBody: '#0A130F',
        meterScreen: '#050B08',
        meterAccent: '#34D399',
      };
    }
    if (theme === 'ivory') {
      return {
        stageBg: 'from-[#FFFEFA] via-[#FAF8F2] to-[#F3EFE5]',
        bench: '#E2DCD0',
        benchShadow: '#C7BFB0',
        wireOuter: '#3F3F46',
        wireGlow: '#D97706',
        electronFill: '#D97706',
        electronText: '#FFFFFF',
        arrowFill: '#D97706',
        captionFill: '#B45309',
        ionLeft: '#D97706',
        ionRight: '#059669',
        ionText: '#18181B',
        labelPrimary: '#18181B',
        labelSub: '#57534E',
        glassStroke: '#8C8478',
        bridgeGlass: '#A8A095',
        bridgeGelTop: '#F5EFE0',
        bridgeGelBot: '#EAE2CE',
        bridgeText: '#44403C',
        leftSolFill: 'rgba(217, 119, 6, 0.14)',
        rightSolFill: 'rgba(5, 150, 105, 0.16)',
        meterBody: '#1C1917',
        meterScreen: '#0C0A09',
        meterAccent: '#FBBF24',
      };
    }
    // Carbon Amber default
    return {
      stageBg: 'from-[#141417] via-[#18181C] to-[#1C1B1E]',
      bench: '#2A2A30',
      benchShadow: '#0A0A0C',
      wireOuter: '#666670',
      wireGlow: '#F59E0B',
      electronFill: '#F59E0B',
      electronText: '#18130A',
      arrowFill: '#F59E0B',
      captionFill: '#FCD34D',
      ionLeft: '#F59E0B',
      ionRight: '#10B981',
      ionText: '#F5F5F4',
      labelPrimary: '#F5F5F4',
      labelSub: '#A1A1AA',
      glassStroke: '#787882',
      bridgeGlass: '#585862',
      bridgeGelTop: '#2E2A21',
      bridgeGelBot: '#24221C',
      bridgeText: '#D4D4D8',
      leftSolFill: 'rgba(245, 158, 11, 0.14)',
      rightSolFill: 'rgba(16, 185, 129, 0.18)',
      meterBody: '#101012',
      meterScreen: '#080809',
      meterAccent: '#F59E0B',
    };
  }, [theme]);

  const renderSolutionIons = (
    count: number,
    bx: number,
    by: number,
    bw: number,
    bh: number,
    label: string,
    color: string,
    seedOffset: number
  ) => {
    const items = [];
    for (let i = 0; i < count; i++) {
      const s1 = Math.sin((i + seedOffset) * 12.9898) * 43758.5453;
      const fx = s1 - Math.floor(s1);
      const s2 = Math.sin((i + seedOffset + 31) * 78.233) * 43758.5453;
      const fy = s2 - Math.floor(s2);

      const jitterX = Math.sin(phase * 2.1 * thermalFactor + i * 1.7) * (6 * thermalFactor);
      const jitterY = Math.cos(phase * 1.8 * thermalFactor + i * 2.3) * (5 * thermalFactor);

      const x = bx + 18 + fx * (bw - 36) + jitterX;
      const y = by + 24 + fy * (bh - 38) + jitterY;

      items.push(
        <g key={`${seedOffset}-${i}`} transform={`translate(${x.toFixed(1)}, ${y.toFixed(1)})`}>
          <circle r="7.5" fill={color} fillOpacity={isDarkTheme ? '0.24' : '0.16'} stroke={color} strokeWidth="1.1" />
          <text
            textAnchor="middle"
            dy="2.8"
            className="font-mono text-[6.5px] font-semibold"
            fill={svgColors.ionText}
          >
            {label}
          </text>
        </g>
      );
    }
    return items;
  };

  const renderBubbles = (bx: number, by: number, bw: number, bh: number, seed: number) => {
    const bubbles = [];
    const bubbleCount = 6;
    for (let i = 0; i < bubbleCount; i++) {
      const progress = (phase * 0.35 * thermalFactor + i / bubbleCount + seed * 0.17) % 1;
      const x = bx + 22 + ((i * 39 + seed * 17) % (bw - 44)) + Math.sin(progress * 10 + i) * 3;
      const y = by + bh - 12 - progress * (bh - 22);
      const r = 1.6 + (i % 3) * 0.9;
      bubbles.push(
        <circle
          key={`bub-${seed}-${i}`}
          cx={x.toFixed(1)}
          cy={y.toFixed(1)}
          r={r}
          fill="#FFFFFF"
          fillOpacity={0.55 * (1 - progress * 0.5)}
          stroke={svgColors.wireGlow}
          strokeOpacity="0.35"
          strokeWidth="0.6"
        />
      );
    }
    return bubbles;
  };

  const sampleWirePoint = (tNorm: number) => {
    const total = 108 + 440 + 108;
    const d = tNorm * total;
    if (d <= 108) return { x: 190, y: 170 - d };
    if (d <= 108 + 440) return { x: 190 + (d - 108), y: 62 };
    return { x: 630, y: 62 + (d - 548) };
  };

  const electronDots = useMemo(() => {
    if (isEquilibrium) return [];
    const count = 8;
    const list = [];
    for (let i = 0; i < count; i++) {
      const raw = (phase * 0.28 * emfSpeedFactor + i / count) % 1;
      const t = isLeftOxidizing ? raw : 1 - raw;
      const pt = sampleWirePoint(t);
      const insideMeter = pt.y < 70 && pt.x > 346 && pt.x < 474;
      if (!insideMeter) {
        list.push({ id: i, x: pt.x, y: pt.y });
      }
    }
    return list;
  }, [phase, emfSpeedFactor, isLeftOxidizing, isEquilibrium]);

  const sampleBridgePoint = (tNorm: number) => {
    const seg1 = 115;
    const seg2 = 260;
    const seg3 = 115;
    const total = seg1 + seg2 + seg3;
    const d = tNorm * total;
    if (d <= seg1) return { x: 280, y: 265 - d };
    if (d <= seg1 + seg2) return { x: 280 + (d - seg1), y: 150 };
    return { x: 540, y: 150 + (d - seg1 - seg2) };
  };

  const saltBridgeIons = useMemo(() => {
    const ions: Array<{ id: string; x: number; y: number; label: string; positive: boolean }> = [];
    const dirSign = isEquilibrium ? 0 : isLeftOxidizing ? 1 : -1;
    for (let i = 0; i < 4; i++) {
      const offset = (phase * 0.22 * Math.max(emfSpeedFactor, 0.35) + i * 0.25) % 1;
      const tAnion = dirSign === 0 ? 0.15 + i * 0.1 : dirSign > 0 ? 0.52 - offset * 0.48 : 0.48 + offset * 0.48;
      const ptA = sampleBridgePoint(Math.min(Math.max(tAnion, 0.04), 0.96));
      ions.push({
        id: `no3-${i}`,
        x: ptA.x + (ptA.y > 165 ? -5 : 0),
        y: ptA.y + (ptA.y <= 165 ? -6 : 0),
        label: 'NO₃⁻',
        positive: false,
      });

      const tCation = dirSign === 0 ? 0.55 + i * 0.1 : dirSign > 0 ? 0.48 + offset * 0.48 : 0.52 - offset * 0.48;
      const ptC = sampleBridgePoint(Math.min(Math.max(tCation, 0.04), 0.96));
      ions.push({
        id: `k-${i}`,
        x: ptC.x + (ptC.y > 165 ? 5 : 0),
        y: ptC.y + (ptC.y <= 165 ? 6 : 0),
        label: 'K⁺',
        positive: true,
      });
    }
    return ions;
  }, [phase, emfSpeedFactor, isEquilibrium, isLeftOxidizing]);

  const redoxParticles = useMemo(() => {
    if (isEquilibrium) return { dissolving: [], depositing: [] };
    const dissolving = [0, 1, 2].map((i) => {
      const p = (phase * 0.42 * emfSpeedFactor + i / 3) % 1;
      const oxX = isLeftOxidizing ? 206 : 614;
      const dir = isLeftOxidizing ? 1 : -1;
      return {
        id: `diss-${i}`,
        x: oxX + dir * (4 + p * 38),
        y: 268 + i * 32 + Math.sin(p * 5 + i) * 6,
        opacity: 1 - p * 0.75,
        label: isLeftOxidizing ? params.anodeIonFormula : params.cathodeIonFormula,
      };
    });

    const depositing = [0, 1, 2].map((i) => {
      const p = (phase * 0.42 * emfSpeedFactor + i / 3) % 1;
      const redX = isLeftOxidizing ? 614 : 206;
      const dir = isLeftOxidizing ? -1 : 1;
      return {
        id: `dep-${i}`,
        x: redX + dir * ((1 - p) * 42 + 4),
        y: 268 + i * 32 + Math.cos(p * 5 + i) * 5,
        opacity: 0.3 + p * 0.7,
        label: isLeftOxidizing ? params.cathodeIonFormula : params.anodeIonFormula,
      };
    });
    return { dissolving, depositing };
  }, [phase, emfSpeedFactor, isEquilibrium, isLeftOxidizing, params.anodeIonFormula, params.cathodeIonFormula]);

  const buildWavePath = (x: number, y: number, w: number, h: number, seed: number) => {
    const amp = motionMode === 'reduced' ? 1 : 2.6;
    const shift = phase * 3.0 + seed;
    const mid1 = y + Math.sin(shift) * amp;
    const mid2 = y + Math.cos(shift + 1.4) * amp;
    return `M ${x} ${y} Q ${x + w * 0.25} ${mid1.toFixed(1)}, ${x + w * 0.5} ${y} T ${x + w} ${mid2.toFixed(1)} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
  };

  const handleStepForward = () => {
    setIsSimulating(false);
    setActiveStepIdx((prev) => (prev === null ? 0 : (prev + 1) % MECHANISM_STEPS.length));
    setPhase((prev) => prev + 0.65);
    setCorrosionProgress((prev) => (prev + 0.12 > 1 ? 0.15 : prev + 0.12));
  };

  const handleResetAnimation = () => {
    setPhase(0);
    setCorrosionProgress(0.2);
    setActiveStepIdx(null);
    setSlowMotion(false);
    setSpeed(1.0);
  };

  const handleToggleReverse = () => {
    updateParams({
      reactionDirection: params.reactionDirection === 'forward' ? 'reverse' : 'forward',
    });
  };

  const leftCorrode = isLeftOxidizing ? corrosionProgress * 7 : isRightOxidizing ? -corrosionProgress * 7 : 0;
  const rightPlate = isLeftOxidizing ? corrosionProgress * 7 : isRightOxidizing ? -corrosionProgress * 7 : 0;

  return (
    <div className="space-y-4">
      <LabCard className="overflow-hidden">
        {/* Top Stage Header */}
        <div className="px-5 py-3 border-b border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-3 bg-[var(--bg-surface-elevated)]">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[var(--text-primary)]">{params.cellName}</span>
            <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
            <span className="font-mono text-[var(--text-secondary)]">{params.notation}</span>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[var(--text-secondary)]">
              e⁻ flow:{' '}
              <strong className="text-[var(--accent)]">
                {flowDir === 'left-to-right'
                  ? `${params.anodeSymbol} → ${params.cathodeSymbol}`
                  : flowDir === 'right-to-left'
                  ? `${params.cathodeSymbol} → ${params.anodeSymbol}`
                  : 'Equilibrium (0 net)'}
              </strong>
            </span>
          </div>
        </div>

        {/* SVG Electrochemical Cell Stage */}
        <div className={`relative bg-gradient-to-b ${svgColors.stageBg} px-2 sm:px-5 pt-4 pb-3`}>
          <svg
            viewBox="0 0 820 465"
            className={`w-full h-auto mx-auto select-none ${compact ? 'max-h-[340px]' : 'max-h-[455px]'}`}
            role="img"
            aria-label={`Interactive electrochemical cell diagram for ${params.cellName}`}
          >
            <defs>
              <linearGradient id="leftElectrodeGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={params.anodeColor} stopOpacity="0.9" />
                <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.58" />
                <stop offset="55%" stopColor={params.anodeColor} stopOpacity="0.96" />
                <stop offset="100%" stopColor="#18181B" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="rightElectrodeGrad" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={params.cathodeColor} stopOpacity="0.9" />
                <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.58" />
                <stop offset="55%" stopColor={params.cathodeColor} stopOpacity="0.96" />
                <stop offset="100%" stopColor="#18181B" stopOpacity="0.6" />
              </linearGradient>
              <linearGradient id="glassHighlight" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity={isDarkTheme ? '0.18' : '0.62'} />
                <stop offset="14%" stopColor="#FFFFFF" stopOpacity={isDarkTheme ? '0.04' : '0.12'} />
                <stop offset="86%" stopColor="#FFFFFF" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity={isDarkTheme ? '0.14' : '0.42'} />
              </linearGradient>
              <linearGradient id="saltBridgeFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={svgColors.bridgeGelTop} stopOpacity="0.92" />
                <stop offset="100%" stopColor={svgColors.bridgeGelBot} stopOpacity="0.82" />
              </linearGradient>
              <filter id="electronGlow" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Lab Bench Surface */}
            <rect x="35" y="408" width="750" height="10" rx="5" fill={svgColors.bench} />
            <ellipse cx="220" cy="409" rx="105" ry="6" fill={svgColors.benchShadow} fillOpacity="0.55" />
            <ellipse cx="600" cy="409" rx="105" ry="6" fill={svgColors.benchShadow} fillOpacity="0.55" />

            {/* External Circuit Wire */}
            <path
              d="M 190 170 L 190 62 L 630 62 L 630 170"
              fill="none"
              stroke={svgColors.wireOuter}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M 190 170 L 190 62 L 630 62 L 630 170"
              fill="none"
              stroke={svgColors.wireGlow}
              strokeWidth={activeStepIdx === 1 ? '3' : '1.4'}
              strokeOpacity={activeStepIdx === 1 ? '0.95' : '0.5'}
            />

            {/* Directional arrows along external wire */}
            {!isEquilibrium && (
              <g fill={svgColors.arrowFill}>
                {isLeftOxidizing ? (
                  <>
                    <polygon points="278,56 290,62 278,68" />
                    <polygon points="536,56 548,62 536,68" />
                  </>
                ) : (
                  <>
                    <polygon points="290,56 278,62 290,68" />
                    <polygon points="548,56 536,62 548,68" />
                  </>
                )}
              </g>
            )}

            {/* Animated Electrons on External Wire */}
            {electronDots.map((e) => (
              <g key={e.id} transform={`translate(${e.x.toFixed(1)}, ${e.y.toFixed(1)})`} filter="url(#electronGlow)">
                <circle r="7.5" fill={svgColors.electronFill} stroke="#FFFFFF" strokeWidth="1.4" />
                <text textAnchor="middle" dy="2.5" fill={svgColors.electronText} className="font-mono text-[7px] font-bold">
                  e⁻
                </text>
              </g>
            ))}

            {/* Wire Flow Caption */}
            <text x="275" y="47" textAnchor="middle" fill={svgColors.captionFill} className="font-mono text-[10px] font-medium">
              {isEquilibrium ? 'No net e⁻ flow' : isLeftOxidizing ? 'e⁻ flow →' : '← e⁻ flow'}
            </text>
            <text x="545" y="47" textAnchor="middle" fill={svgColors.captionFill} className="font-mono text-[10px] font-medium">
              {isEquilibrium ? 'Equilibrium' : isLeftOxidizing ? 'e⁻ flow →' : '← e⁻ flow'}
            </text>

            {/* Digital Voltmeter (Clickable) */}
            <g
              onClick={() => interactiveInspect && setInspected('voltmeter')}
              className={interactiveInspect ? 'cursor-pointer' : ''}
            >
              <rect
                x="348"
                y="24"
                width="124"
                height="74"
                rx="12"
                fill={svgColors.meterBody}
                stroke={inspected === 'voltmeter' ? svgColors.wireGlow : '#3F3F46'}
                strokeWidth={inspected === 'voltmeter' ? '2.5' : '1.5'}
              />
              <rect x="358" y="34" width="104" height="38" rx="6" fill={svgColors.meterScreen} stroke="#27272A" strokeWidth="1" />
              <text
                x="410"
                y="58"
                textAnchor="middle"
                className="font-mono text-[16px] font-bold"
                fill={
                  !result.isValid
                    ? '#F87171'
                    : result.cellPotential > 0
                    ? svgColors.meterAccent
                    : result.cellPotential < 0
                    ? '#FB7185'
                    : '#A1A1AA'
                }
              >
                {result.isValid ? `${formatSigned(result.cellPotential, 3)} V` : 'ERR'}
              </text>
              <text x="410" y="86" textAnchor="middle" className="font-mono text-[8.5px]" fill="#A1A1AA">
                VOLTMETER · {result.temperatureK.toFixed(1)} K
              </text>
              <circle cx="348" cy="62" r="4.5" fill={isLeftOxidizing ? '#F59E0B' : '#10B981'} stroke="#FFFFFF" strokeWidth="1.2" />
              <circle cx="472" cy="62" r="4.5" fill={isLeftOxidizing ? '#10B981' : '#F59E0B'} stroke="#FFFFFF" strokeWidth="1.2" />
            </g>

            {/* ================= LEFT BEAKER ================= */}
            <g>
              <path d={buildWavePath(112, 232, 216, 172, 0)} fill={svgColors.leftSolFill} />
              {renderBubbles(112, 232, 216, 172, 1)}
              {renderSolutionIons(
                leftIonCount,
                112,
                232,
                216,
                172,
                params.anodeIonFormula,
                svgColors.ionLeft,
                11
              )}

              {/* Left Electrode */}
              <g
                onClick={() => interactiveInspect && setInspected('anode')}
                className={interactiveInspect ? 'cursor-pointer' : ''}
              >
                <rect x="176" y="162" width="28" height="12" rx="3" fill="#52525B" />
                <rect
                  x="174"
                  y="174"
                  width="32"
                  height="64"
                  rx="2"
                  fill="url(#leftElectrodeGrad)"
                  stroke={inspected === 'anode' || activeStepIdx === 0 ? svgColors.wireGlow : '#71717A'}
                  strokeWidth={inspected === 'anode' || activeStepIdx === 0 ? '2.4' : '1'}
                />
                <rect
                  x={174 + Math.max(leftCorrode * 0.45, -3.5)}
                  y="238"
                  width={Math.max(20, 32 - leftCorrode * 0.9)}
                  height="134"
                  rx="4"
                  fill="url(#leftElectrodeGrad)"
                  stroke={inspected === 'anode' || activeStepIdx === 0 ? svgColors.wireGlow : '#71717A'}
                  strokeWidth={inspected === 'anode' || activeStepIdx === 0 ? '2.4' : '1'}
                />
                <text x="190" y="214" textAnchor="middle" fill="#18181B" className="font-display text-[13px] font-bold">
                  {params.anodeSymbol}
                </text>
                <circle cx="163" cy="186" r="10" fill={isLeftOxidizing ? '#D97706' : '#059669'} />
                <text x="163" y="190" textAnchor="middle" fill="#FFFFFF" className="font-mono text-[13px] font-bold">
                  {isLeftOxidizing ? '−' : '+'}
                </text>
              </g>

              <path
                d="M 106 198 L 112 208 L 112 396 Q 112 406 124 406 L 316 406 Q 328 406 328 396 L 328 208 L 334 198"
                fill="url(#glassHighlight)"
                stroke={svgColors.glassStroke}
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              {[255, 295, 335, 375].map((yTick, idx) => (
                <line
                  key={yTick}
                  x1="118"
                  y1={yTick}
                  x2={idx % 2 === 0 ? 132 : 126}
                  y2={yTick}
                  stroke={svgColors.glassStroke}
                  strokeWidth="1.2"
                  strokeOpacity="0.65"
                />
              ))}
            </g>

            {/* ================= RIGHT BEAKER ================= */}
            <g>
              <path d={buildWavePath(492, 232, 216, 172, 2.2)} fill={svgColors.rightSolFill} />
              {renderBubbles(492, 232, 216, 172, 2)}
              {renderSolutionIons(
                rightIonCount,
                492,
                232,
                216,
                172,
                params.cathodeIonFormula,
                svgColors.ionRight,
                57
              )}

              {/* Right Electrode */}
              <g
                onClick={() => interactiveInspect && setInspected('cathode')}
                className={interactiveInspect ? 'cursor-pointer' : ''}
              >
                <rect x="616" y="162" width="28" height="12" rx="3" fill="#52525B" />
                <rect
                  x="614"
                  y="174"
                  width="32"
                  height="64"
                  rx="2"
                  fill="url(#rightElectrodeGrad)"
                  stroke={inspected === 'cathode' || activeStepIdx === 2 ? svgColors.wireGlow : '#71717A'}
                  strokeWidth={inspected === 'cathode' || activeStepIdx === 2 ? '2.4' : '1'}
                />
                <rect
                  x={614 - Math.max(rightPlate * 0.45, -3.5)}
                  y="238"
                  width={Math.max(20, 32 + rightPlate * 0.9)}
                  height="134"
                  rx="4"
                  fill="url(#rightElectrodeGrad)"
                  stroke={inspected === 'cathode' || activeStepIdx === 2 ? svgColors.wireGlow : '#71717A'}
                  strokeWidth={inspected === 'cathode' || activeStepIdx === 2 ? '2.4' : '1'}
                />
                <text x="630" y="214" textAnchor="middle" fill="#18181B" className="font-display text-[13px] font-bold">
                  {params.cathodeSymbol}
                </text>
                <circle cx="657" cy="186" r="10" fill={isLeftOxidizing ? '#059669' : '#D97706'} />
                <text x="657" y="190" textAnchor="middle" fill="#FFFFFF" className="font-mono text-[13px] font-bold">
                  {isLeftOxidizing ? '+' : '−'}
                </text>
              </g>

              <path
                d="M 486 198 L 492 208 L 492 396 Q 492 406 504 406 L 696 406 Q 708 406 708 396 L 708 208 L 714 198"
                fill="url(#glassHighlight)"
                stroke={svgColors.glassStroke}
                strokeWidth="2.4"
                strokeLinejoin="round"
              />
              {[255, 295, 335, 375].map((yTick, idx) => (
                <line
                  key={yTick}
                  x1="702"
                  y1={yTick}
                  x2={idx % 2 === 0 ? 688 : 694}
                  y2={yTick}
                  stroke={svgColors.glassStroke}
                  strokeWidth="1.2"
                  strokeOpacity="0.65"
                />
              ))}
            </g>

            {/* ================= DISSOLVING & DEPOSITING PARTICLES ================= */}
            {redoxParticles.dissolving.map((p) => (
              <g key={p.id} transform={`translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`} opacity={p.opacity}>
                <circle r="8.5" fill={svgColors.ionLeft} fillOpacity="0.3" stroke={svgColors.ionLeft} strokeWidth="1.3" />
                <text textAnchor="middle" dy="3" fill={svgColors.ionText} className="font-mono text-[6.8px] font-bold">
                  {p.label}
                </text>
              </g>
            ))}
            {redoxParticles.depositing.map((p) => (
              <g key={p.id} transform={`translate(${p.x.toFixed(1)}, ${p.y.toFixed(1)})`} opacity={p.opacity}>
                <circle r="8.5" fill={svgColors.ionRight} fillOpacity="0.3" stroke={svgColors.ionRight} strokeWidth="1.3" />
                <text textAnchor="middle" dy="3" fill={svgColors.ionText} className="font-mono text-[6.8px] font-bold">
                  {p.label}
                </text>
              </g>
            ))}

            {/* ================= SALT BRIDGE ================= */}
            <g
              onClick={() => interactiveInspect && setInspected('salt-bridge')}
              className={interactiveInspect ? 'cursor-pointer' : ''}
            >
              <path
                d="M 280 278 L 280 154 Q 280 134 300 134 L 520 134 Q 540 134 540 154 L 540 278"
                fill="none"
                stroke={inspected === 'salt-bridge' || activeStepIdx === 3 ? svgColors.wireGlow : svgColors.bridgeGlass}
                strokeWidth="30"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 280 278 L 280 154 Q 280 134 300 134 L 520 134 Q 540 134 540 154 L 540 278"
                fill="none"
                stroke="url(#saltBridgeFill)"
                strokeWidth="24"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect x="268" y="272" width="24" height="10" rx="4" fill="#E7E5E4" stroke="#A8A29E" strokeWidth="1" />
              <rect x="528" y="272" width="24" height="10" rx="4" fill="#E7E5E4" stroke="#A8A29E" strokeWidth="1" />

              {saltBridgeIons.map((ion) => (
                <g key={ion.id} transform={`translate(${ion.x.toFixed(1)}, ${ion.y.toFixed(1)})`}>
                  <circle
                    r="8.5"
                    fill={ion.positive ? '#D1FAE5' : '#FEF3C7'}
                    stroke={ion.positive ? '#059669' : '#D97706'}
                    strokeWidth="1.2"
                  />
                  <text textAnchor="middle" dy="2.7" fill="#18181B" className="font-mono text-[6px] font-bold">
                    {ion.label}
                  </text>
                </g>
              ))}

              <text x="410" y="122" textAnchor="middle" fill={svgColors.bridgeText} className="font-sans text-[10.5px] font-semibold">
                Salt Bridge (KNO₃ agar)
              </text>
            </g>

            {/* ================= BOTTOM LABELS ================= */}
            <g>
              <text x="220" y="434" textAnchor="middle" fill={svgColors.labelPrimary} className="font-display text-[12px] font-bold">
                {isLeftOxidizing ? 'ANODE (Oxidation)' : isRightOxidizing ? 'CATHODE (Reduction)' : 'LEFT HALF-CELL'} · {params.anodeMaterial}
              </text>
              <text x="220" y="451" textAnchor="middle" fill={svgColors.labelSub} className="font-mono text-[10.5px]">
                {params.oxidationHalfReaction} · [{params.anodeIonFormula}] = {params.anodeConc} M
              </text>

              <text x="600" y="434" textAnchor="middle" fill={svgColors.labelPrimary} className="font-display text-[12px] font-bold">
                {isLeftOxidizing ? 'CATHODE (Reduction)' : isRightOxidizing ? 'ANODE (Oxidation)' : 'RIGHT HALF-CELL'} · {params.cathodeMaterial}
              </text>
              <text x="600" y="451" textAnchor="middle" fill={svgColors.labelSub} className="font-mono text-[10.5px]">
                {params.reductionHalfReaction} · [{params.cathodeIonFormula}] = {params.cathodeConc} M
              </text>
            </g>
          </svg>

          {interactiveInspect && (
            <div className="mt-2 text-center text-[11px] text-[var(--text-muted)]">
              Click the left electrode, right electrode, salt bridge, or voltmeter to inspect live half-cell data.
            </div>
          )}
        </div>

        {/* Playback Controls */}
        {showControls && (
          <div className="px-5 py-3.5 bg-[var(--bg-surface)] border-t border-[var(--border-hairline)] flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <LabButton
                variant={isSimulating ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => {
                  setActiveStepIdx(null);
                  setIsSimulating(!isSimulating);
                }}
              >
                {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {isSimulating ? 'Pause' : 'Play'}
              </LabButton>

              <LabButton variant="secondary" size="sm" onClick={handleStepForward}>
                <StepForward className="w-3.5 h-3.5" />
                Step
              </LabButton>

              <LabButton variant="secondary" size="sm" onClick={handleResetAnimation}>
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </LabButton>

              <LabButton
                variant={slowMotion ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSlowMotion((s) => !s)}
              >
                <FastForward className="w-3.5 h-3.5" />
                Slow-Mo {slowMotion ? 'On' : 'Off'}
              </LabButton>

              <LabButton variant="secondary" size="sm" onClick={handleToggleReverse}>
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Reverse ({params.reactionDirection === 'forward' ? 'Fwd' : 'Rev'})
              </LabButton>
            </div>

            <div className="flex items-center gap-3 min-w-[180px]">
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Speed</span>
              <input
                type="range"
                min={0.25}
                max={3.0}
                step={0.25}
                value={speed}
                onChange={(e) => {
                  setSlowMotion(false);
                  setSpeed(parseFloat(e.target.value));
                }}
                aria-label="Animation speed"
                className="lab-slider w-28"
              />
              <span className="font-mono tabular-nums text-xs font-semibold text-[var(--text-primary)] w-10 text-right">
                {slowMotion ? '0.3×' : `${speed.toFixed(2)}×`}
              </span>
            </div>
          </div>
        )}
      </LabCard>

      {/* Step-by-Step Mechanism Callout */}
      {activeStepIdx !== null && (
        <LabCard className="p-4 bg-[var(--accent-soft)] border-[var(--accent-border)]">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-mono font-semibold text-[var(--accent)]">
                Step {MECHANISM_STEPS[activeStepIdx].step} of 4 · Mechanistic Walkthrough
              </div>
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {MECHANISM_STEPS[activeStepIdx].title}
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                {MECHANISM_STEPS[activeStepIdx].detail}
              </p>
            </div>
            <LabButton variant="secondary" size="sm" onClick={handleStepForward}>
              Next Step
            </LabButton>
          </div>
        </LabCard>
      )}

      {/* Interactive Component Inspector */}
      {interactiveInspect && inspected && (
        <LabCard className="p-5">
          {inspected === 'anode' && (
            <div className="grid sm:grid-cols-4 gap-4 items-start">
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center gap-2 text-xs text-[var(--accent)] font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Left Electrode Inspector</span>
                </div>
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {params.anodeMaterial} Electrode ({params.anodeSymbol})
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Role under current conditions:{' '}
                  <strong className="text-[var(--text-primary)]">
                    {isLeftOxidizing ? 'Anode (Oxidation)' : isRightOxidizing ? 'Cathode (Reduction)' : 'Equilibrium'}
                  </strong>
                </p>
                <div className="font-mono text-xs text-[var(--text-secondary)] pt-1">
                  {params.oxidationHalfReaction}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-muted)]">Standard & Actual Half-Potential</div>
                <div className="font-mono tabular-nums text-sm font-semibold text-[var(--text-primary)]">
                  E° = {formatSigned(params.anodePotentialStd, 3)} V
                </div>
                <div className="font-mono tabular-nums text-xs text-[var(--accent)]">
                  E(actual) = {result.isValid ? `${formatSigned(result.anodeHalfPotentialActual, 4)} V` : '—'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-muted)]">Solution Ion Concentration</div>
                <div className="font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
                  [{params.anodeIonFormula}] = {params.anodeConc} M
                </div>
                <div className="text-xs text-[var(--text-muted)]">Stoich. exponent ν = {params.anodeStoich}</div>
              </div>
            </div>
          )}

          {inspected === 'cathode' && (
            <div className="grid sm:grid-cols-4 gap-4 items-start">
              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center gap-2 text-xs text-emerald-500 font-semibold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Right Electrode Inspector</span>
                </div>
                <h4 className="text-base font-bold text-[var(--text-primary)]">
                  {params.cathodeMaterial} Electrode ({params.cathodeSymbol})
                </h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Role under current conditions:{' '}
                  <strong className="text-[var(--text-primary)]">
                    {isLeftOxidizing ? 'Cathode (Reduction)' : isRightOxidizing ? 'Anode (Oxidation)' : 'Equilibrium'}
                  </strong>
                </p>
                <div className="font-mono text-xs text-[var(--text-secondary)] pt-1">
                  {params.reductionHalfReaction}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-muted)]">Standard & Actual Half-Potential</div>
                <div className="font-mono tabular-nums text-sm font-semibold text-[var(--text-primary)]">
                  E° = {formatSigned(params.cathodePotentialStd, 3)} V
                </div>
                <div className="font-mono tabular-nums text-xs text-emerald-500">
                  E(actual) = {result.isValid ? `${formatSigned(result.cathodeHalfPotentialActual, 4)} V` : '—'}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-muted)]">Solution Ion Concentration</div>
                <div className="font-mono tabular-nums text-lg font-bold text-[var(--text-primary)]">
                  [{params.cathodeIonFormula}] = {params.cathodeConc} M
                </div>
                <div className="text-xs text-[var(--text-muted)]">Stoich. exponent ν = {params.cathodeStoich}</div>
              </div>
            </div>
          )}

          {inspected === 'salt-bridge' && (
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-[var(--accent)] mt-0.5 shrink-0" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-[var(--text-primary)]">
                  Salt Bridge Function (Inert KNO₃ Electrolyte)
                </h4>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                  The salt bridge completes the internal electrical circuit without mixing the two reactive half-cell solutions. As{' '}
                  {isLeftOxidizing ? params.anodeIonFormula : params.cathodeIonFormula} ions accumulate at the oxidizing electrode, negatively charged{' '}
                  <strong className="font-mono text-[var(--text-primary)]">NO₃⁻</strong> ions diffuse into that beaker to neutralize excess positive charge. Simultaneously,{' '}
                  <strong className="font-mono text-[var(--text-primary)]">K⁺</strong> ions migrate into the reducing compartment to replace cations plated onto the cathode.
                </p>
              </div>
            </div>
          )}

          {inspected === 'voltmeter' && (
            <div className="grid sm:grid-cols-3 gap-4 items-center">
              <div className="space-y-1">
                <div className="text-xs text-[var(--text-muted)]">High-Impedance Voltmeter Reading</div>
                <div className="font-mono tabular-nums text-xl font-bold text-[var(--text-primary)]">
                  {result.isValid ? `${formatSigned(result.cellPotential, params.precision)} V` : 'Invalid'}
                </div>
                <div className="text-xs text-[var(--accent)]">{result.spontaneityLabel}</div>
              </div>
              <div className="sm:col-span-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                Measures open-circuit electromotive force (EMF) across the external terminals with negligible current draw so the cell stays near thermodynamic reversibility. Calculated as{' '}
                <span className="font-mono text-[var(--text-primary)]">
                  E = E° ({formatSigned(result.effectiveStandardPotential, 3)} V) + Nernst correction ({formatSigned(result.nernstCorrection, 4)} V)
                </span>{' '}
                at {formatNum(result.temperatureK, 2)} K.
              </div>
            </div>
          )}
        </LabCard>
      )}
    </div>
  );
}
