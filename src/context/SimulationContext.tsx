import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateNernst,
  createParamsFromPreset,
  toCelsius,
  toKelvin,
  type NernstCalculationResult,
  type PresetId,
  type SimulationParams,
  type TemperatureUnit,
} from '../lib/nernst';
import { type SavedSimulation } from '../lib/export';
import { generateScientificInsights, type ScientificInsight } from '../lib/insights';

export type NavSection =
  | 'overview'
  | 'simulator'
  | 'animation'
  | 'graphs'
  | 'experiment'
  | 'learn'
  | 'guide'
  | 'history';

export type MotionMode = 'reduced' | 'normal' | 'enhanced';
export type LabTheme = 'carbon' | 'ivory' | 'forest';

interface SimulationContextValue {
  activePage: NavSection;
  setActivePage: (page: NavSection) => void;
  params: SimulationParams;
  result: NernstCalculationResult;
  insights: ScientificInsight[];
  updateParams: (patch: Partial<SimulationParams>) => void;
  selectPreset: (presetId: PresetId) => void;
  switchTemperatureUnit: (unit: TemperatureUnit) => void;
  resetSimulation: () => void;
  history: SavedSimulation[];
  saveCurrentSimulation: (label?: string) => void;
  renameHistoryItem: (id: string, label: string) => void;
  deleteHistoryItem: (id: string) => void;
  loadHistoryItem: (id: string) => void;
  compareIds: string[];
  toggleCompareId: (id: string) => void;
  clearCompareIds: () => void;
  motionMode: MotionMode;
  setMotionMode: (mode: MotionMode) => void;
  theme: LabTheme;
  setTheme: (theme: LabTheme) => void;
  isDarkTheme: boolean;
  reportModalOpen: boolean;
  setReportModalOpen: (open: boolean) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  isSimulating: boolean;
  setIsSimulating: (playing: boolean) => void;
}

const HISTORY_STORAGE_KEY = 'nernstlab_simulation_history_v1';
const MOTION_STORAGE_KEY = 'nernstlab_motion_mode_v1';
const THEME_STORAGE_KEY = 'nernstlab_theme_v2';

function buildInitialSeedHistory(): SavedSimulation[] {
  const stdDaniell = createParamsFromPreset('daniell');
  const concDaniell: SimulationParams = {
    ...createParamsFromPreset('daniell'),
    anodeConc: 0.05,
    cathodeConc: 2.0,
    temperatureValue: 318.15,
    temperatureUnit: 'K',
  };
  const ironCu = createParamsFromPreset('iron-copper');

  return [
    {
      id: 'seed-daniell-std',
      label: 'Daniell Cell — Standard State (298.15 K)',
      timestamp: new Date(Date.now() - 3600_000 * 4).toISOString(),
      params: stdDaniell,
      result: calculateNernst(stdDaniell),
    },
    {
      id: 'seed-daniell-boosted',
      label: 'Daniell Cell — High [Cu²⁺] & 45 °C',
      timestamp: new Date(Date.now() - 3600_000 * 2).toISOString(),
      params: concDaniell,
      result: calculateNernst(concDaniell),
    },
    {
      id: 'seed-iron-cu',
      label: 'Iron–Copper Baseline Trial',
      timestamp: new Date(Date.now() - 3600_000).toISOString(),
      params: ironCu,
      result: calculateNernst(ironCu),
    },
  ];
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [activePage, setActivePage] = useState<NavSection>('overview');
  const [params, setParams] = useState<SimulationParams>(() => createParamsFromPreset('daniell'));
  const [prevParams, setPrevParams] = useState<SimulationParams | null>(null);
  const [isSimulating, setIsSimulating] = useState<boolean>(true);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [theme, setThemeState] = useState<LabTheme>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as LabTheme | null;
      if (saved === 'carbon' || saved === 'ivory' || saved === 'forest') return saved;
    } catch {
      // ignore
    }
    return 'carbon';
  });

  const isDarkTheme = theme === 'carbon' || theme === 'forest';

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (isDarkTheme) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme, isDarkTheme]);

  const [motionMode, setMotionModeState] = useState<MotionMode>(() => {
    try {
      const saved = localStorage.getItem(MOTION_STORAGE_KEY) as MotionMode | null;
      if (saved === 'reduced' || saved === 'normal' || saved === 'enhanced') return saved;
      if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 'reduced';
      }
    } catch {
      // ignore
    }
    return 'normal';
  });

  const [history, setHistory] = useState<SavedSimulation[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedSimulation[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item) => ({
            ...item,
            result: calculateNernst(item.params),
          }));
        }
      }
    } catch {
      // fallback to seed
    }
    return buildInitialSeedHistory();
  });

  const [compareIds, setCompareIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SavedSimulation[];
        return parsed.slice(0, 2).map((h) => h.id);
      }
    } catch {
      // ignore
    }
    return ['seed-daniell-std', 'seed-daniell-boosted'];
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastMessage(null), 2800);
  }, []);

  const setTheme = useCallback(
    (next: LabTheme) => {
      setThemeState(next);
      const label =
        next === 'carbon' ? 'Carbon Amber' : next === 'forest' ? 'Forest Emerald' : 'Ivory Paper';
      showToast(`Switched theme to ${label}`);
    },
    [showToast]
  );

  const setMotionMode = useCallback((mode: MotionMode) => {
    setMotionModeState(mode);
    try {
      localStorage.setItem(MOTION_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch {
      // ignore
    }
  }, [history]);

  const result = useMemo(() => calculateNernst(params), [params]);
  const prevResult = useMemo(() => (prevParams ? calculateNernst(prevParams) : null), [prevParams]);

  const insights = useMemo(
    () => generateScientificInsights(params, result, prevParams, prevResult),
    [params, result, prevParams, prevResult]
  );

  const updateParams = useCallback((patch: Partial<SimulationParams>) => {
    setParams((current) => {
      setPrevParams(current);
      const next = { ...current, ...patch };
      if (!next.useManualQ && next.anodeConc > 0 && next.cathodeConc > 0) {
        next.manualQ =
          Math.pow(next.anodeConc, Math.max(next.anodeStoich, 0.1)) /
          Math.pow(next.cathodeConc, Math.max(next.cathodeStoich, 0.1));
      }
      return next;
    });
  }, []);

  const selectPreset = useCallback(
    (presetId: PresetId) => {
      if (presetId === 'custom') {
        setParams((curr) => {
          setPrevParams(curr);
          return {
            ...curr,
            presetId: 'custom',
            cellName: curr.presetId === 'custom' ? curr.cellName : 'Custom Electrochemical Cell',
          };
        });
        return;
      }
      const next = createParamsFromPreset(presetId);
      setParams((curr) => {
        setPrevParams(curr);
        return {
          ...next,
          temperatureUnit: curr.temperatureUnit,
          temperatureValue: curr.temperatureUnit === 'K' ? 298.15 : 25,
          precision: curr.precision,
        };
      });
      showToast(`Loaded ${next.cellName}`);
    },
    [showToast]
  );

  const switchTemperatureUnit = useCallback((unit: TemperatureUnit) => {
    setParams((curr) => {
      if (curr.temperatureUnit === unit) return curr;
      const converted =
        unit === 'K'
          ? Number(toKelvin(curr.temperatureValue, curr.temperatureUnit).toFixed(2))
          : Number(toCelsius(curr.temperatureValue, curr.temperatureUnit).toFixed(2));
      return {
        ...curr,
        temperatureUnit: unit,
        temperatureValue: converted,
      };
    });
  }, []);

  const resetSimulation = useCallback(() => {
    const presetToReset = params.presetId === 'custom' ? 'daniell' : params.presetId;
    const fresh = createParamsFromPreset(presetToReset);
    setPrevParams(params);
    setParams(fresh);
    showToast('Simulation reset to standard conditions (298.15 K, 1.0 M)');
  }, [params, showToast]);

  const saveCurrentSimulation = useCallback(
    (label?: string) => {
      if (!result.isValid) {
        showToast('Resolve parameter errors before saving simulation.');
        return;
      }
      const entry: SavedSimulation = {
        id: `sim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        label:
          label?.trim() ||
          `${params.cellName} (${result.temperatureK.toFixed(1)} K, E = ${result.cellPotential.toFixed(3)} V)`,
        timestamp: new Date().toISOString(),
        params: { ...params },
        result: { ...result },
      };
      setHistory((prev) => [entry, ...prev].slice(0, 50));
      showToast('Simulation saved to local history');
    },
    [params, result, showToast]
  );

  const renameHistoryItem = useCallback((id: string, label: string) => {
    const trimmed = label.trim();
    if (!trimmed) return;
    setHistory((prev) => prev.map((item) => (item.id === id ? { ...item, label: trimmed } : item)));
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    setCompareIds((prev) => prev.filter((cid) => cid !== id));
  }, []);

  const loadHistoryItem = useCallback(
    (id: string) => {
      const target = history.find((item) => item.id === id);
      if (!target) return;
      setPrevParams(params);
      setParams({ ...target.params });
      showToast(`Loaded "${target.label}"`);
    },
    [history, params, showToast]
  );

  const toggleCompareId = useCallback(
    (id: string) => {
      setCompareIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= 3) {
          showToast('Up to 3 simulations can be compared simultaneously.');
          return prev;
        }
        return [...prev, id];
      });
    },
    [showToast]
  );

  const clearCompareIds = useCallback(() => setCompareIds([]), []);

  const value: SimulationContextValue = {
    activePage,
    setActivePage,
    params,
    result,
    insights,
    updateParams,
    selectPreset,
    switchTemperatureUnit,
    resetSimulation,
    history,
    saveCurrentSimulation,
    renameHistoryItem,
    deleteHistoryItem,
    loadHistoryItem,
    compareIds,
    toggleCompareId,
    clearCompareIds,
    motionMode,
    setMotionMode,
    theme,
    setTheme,
    isDarkTheme,
    reportModalOpen,
    setReportModalOpen,
    toastMessage,
    showToast,
    isSimulating,
    setIsSimulating,
  };

  return <SimulationContext.Provider value={value}>{children}</SimulationContext.Provider>;
}

export function useSimulation() {
  const ctx = useContext(SimulationContext);
  if (!ctx) throw new Error('useSimulation must be used within SimulationProvider');
  return ctx;
}
