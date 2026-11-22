import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { type ScientificInsight } from '../lib/insights';
import { LabCard } from './ui';

export function InsightsPanel({
  insights,
  compact = false,
}: {
  insights: ScientificInsight[];
  compact?: boolean;
}) {
  const items = compact ? insights.slice(0, 3) : insights;

  return (
    <LabCard className="p-5">
      <div className="flex items-baseline justify-between gap-2 pb-3 border-b border-[var(--border-hairline)]">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Rule-Based Scientific Insights
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Derived directly from active Nernst thermodynamic parameters
          </p>
        </div>
        <span className="text-xs font-mono text-[var(--text-muted)]">{items.length} active</span>
      </div>

      <div className="divide-y divide-[var(--border-hairline)] mt-1">
        {items.map((ins) => {
          const Icon =
            ins.tone === 'positive'
              ? CheckCircle2
              : ins.tone === 'caution'
              ? AlertTriangle
              : Info;
          const toneColor =
            ins.tone === 'positive'
              ? 'text-teal-500'
              : ins.tone === 'caution'
              ? 'text-amber-500'
              : 'text-[var(--accent)]';

          return (
            <div key={ins.id} className="py-3 first:pt-3 last:pb-0 flex items-start gap-3">
              <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${toneColor}`} />
              <div className="space-y-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">{ins.title}</span>
                  <span className="text-[var(--text-muted)]" aria-hidden="true">·</span>
                  <span className="text-[var(--text-muted)]">{ins.category}</span>
                </div>
                <p className="text-xs leading-relaxed text-[var(--text-secondary)]">{ins.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </LabCard>
  );
}
