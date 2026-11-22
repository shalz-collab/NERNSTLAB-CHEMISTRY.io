import { motion } from 'motion/react';
import { useSimulation } from '../context/SimulationContext';
import { formatSigned } from '../lib/utils';

interface VoltageGaugeProps {
  voltage: number;
  standardVoltage: number;
  precision?: number;
  isValid?: boolean;
  size?: number;
}

export function VoltageGauge({
  voltage,
  standardVoltage,
  precision = 4,
  isValid = true,
  size = 196,
}: VoltageGaugeProps) {
  const { motionMode, isDarkTheme, theme } = useSimulation();

  const minV = -2.0;
  const maxV = 2.5;
  const startAngle = -210;
  const sweep = 240;

  const valueToAngle = (v: number) => {
    const clamped = Math.min(Math.max(v, minV), maxV);
    const ratio = (clamped - minV) / (maxV - minV);
    return startAngle + ratio * sweep;
  };

  const cx = 110;
  const cy = 112;
  const r = 84;

  const polarToCartesian = (angleDeg: number, radius = r) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    };
  };

  const describeArc = (a1: number, a2: number, radius = r) => {
    const start = polarToCartesian(a1, radius);
    const end = polarToCartesian(a2, radius);
    const largeArc = Math.abs(a2 - a1) > 180 ? 1 : 0;
    const sweepFlag = a2 >= a1 ? 1 : 0;
    return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
  };

  const zeroAngle = valueToAngle(0);
  const currentAngle = isValid ? valueToAngle(voltage) : zeroAngle;
  const stdAngle = isValid ? valueToAngle(standardVoltage) : zeroAngle;

  const trackPath = describeArc(startAngle, startAngle + sweep);
  const activePath = isValid ? describeArc(zeroAngle, currentAngle) : '';

  const stdDot = polarToCartesian(stdAngle, r);
  const ticks = [-2, -1, 0, 1, 2];

  const accentHex = theme === 'forest' ? '#34D399' : '#F59E0B';
  const strokeColor = !isValid
    ? '#71717A'
    : voltage > 0.0001
    ? accentHex
    : voltage < -0.0001
    ? '#EF4444'
    : '#71717A';

  const trackStroke = isDarkTheme ? '#2B2B31' : '#E4DFD3';
  const needleColor = isDarkTheme ? '#F5F5F4' : '#18181B';
  const tickZeroStroke = isDarkTheme ? '#F5F5F4' : '#18181B';
  const tickStroke = isDarkTheme ? '#6B6B73' : '#A8A29E';
  const tickTextFill = isDarkTheme ? '#9E9EA6' : '#78716C';

  const duration = motionMode === 'reduced' ? 0 : motionMode === 'enhanced' ? 0.55 : 0.35;

  return (
    <div
      className="relative flex flex-col items-center justify-center select-none"
      style={{ width: size, height: size * 0.88 }}
    >
      <svg viewBox="0 0 220 194" className="w-full h-full overflow-visible" aria-label="Cell potential gauge">
        <path
          d={trackPath}
          fill="none"
          stroke={trackStroke}
          strokeWidth="12"
          strokeLinecap="round"
        />

        {ticks.map((t) => {
          const ang = valueToAngle(t);
          const inner = polarToCartesian(ang, r - 13);
          const outer = polarToCartesian(ang, r - 7);
          const labelPos = polarToCartesian(ang, r - 23);
          return (
            <g key={t}>
              <line
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={t === 0 ? tickZeroStroke : tickStroke}
                strokeWidth={t === 0 ? 2 : 1.25}
              />
              <text
                x={labelPos.x}
                y={labelPos.y + 3}
                textAnchor="middle"
                fill={tickTextFill}
                className="text-[9px] font-mono"
              >
                {t > 0 ? `+${t}` : t}
              </text>
            </g>
          );
        })}

        {isValid && Math.abs(currentAngle - zeroAngle) > 0.5 && (
          <motion.path
            d={activePath}
            fill="none"
            stroke={strokeColor}
            strokeWidth="12"
            strokeLinecap="round"
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration }}
          />
        )}

        {isValid && (
          <circle
            cx={stdDot.x}
            cy={stdDot.y}
            r="4.5"
            fill={isDarkTheme ? '#18181B' : '#FFFFFF'}
            stroke={needleColor}
            strokeWidth="2"
          />
        )}

        <motion.g
          initial={false}
          animate={{ rotate: currentAngle + 90 }}
          transition={
            motionMode === 'reduced'
              ? { duration: 0 }
              : { type: 'spring', stiffness: 160, damping: 20 }
          }
          style={{ originX: `${cx}px`, originY: `${cy}px` }}
        >
          <line
            x1={cx}
            y1={cy + 8}
            x2={cx}
            y2={cy - (r - 18)}
            stroke={needleColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="5.5" fill={needleColor} />
          <circle cx={cx} cy={cy} r="2.2" fill={accentHex} />
        </motion.g>
      </svg>

      <div className="absolute bottom-1 flex flex-col items-center text-center">
        <div className="font-mono tabular-nums text-xl font-bold tracking-tight text-[var(--text-primary)]">
          {isValid ? formatSigned(voltage, precision) : '—'}
          <span className="text-xs font-medium text-[var(--text-muted)] ml-1">V</span>
        </div>
        <div className="text-[11px] font-mono text-[var(--text-muted)]">
          E°: {isValid ? `${formatSigned(standardVoltage, 2)} V` : '—'}
        </div>
      </div>
    </div>
  );
}
