import { useEffect, useMemo, useState } from 'react';
import { useAgentivityClient, type EntityUnit } from '@agentivity-labs/sdk-react';
import { PORTAL_CONFIG } from '../config';
import { KindIcon } from '../lib/KindIcon';
import { relativeTime } from '../lib/relativeTime';
import { dismissExecution, fetchAllHistory, historyStatus, isDismissed, HISTORY_STATUS_LABEL, type HistoryEntry, type HistoryStatus } from '../lib/history';

const FILTERS: Array<{ id: 'all' | HistoryStatus; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'waiting', label: 'Waiting for you' },
  { id: 'active', label: 'In progress' },
  { id: 'failed', label: 'Failed' },
  { id: 'completed', label: 'Completed' },
];

/**
 * Every Solution the visitor has already started, across every kind — so they can pick back up a
 * conversation instead of starting over, or just glance at what's still waiting on them.
 */
export function History({ onOpen }: { onOpen: (solution: EntityUnit, executionId: string) => void }) {
  const client = useAgentivityClient();
  const [entries, setEntries] = useState<HistoryEntry[]>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  // Bumped after a dismiss to re-run the isDismissed() filter — dismissal itself is synchronous
  // (localStorage), no need to refetch from the server for it to take effect.
  const [dismissTick, setDismissTick] = useState(0);

  useEffect(() => {
    let alive = true;
    client.entities
      .fetchEntities({ tags: PORTAL_CONFIG.solutionTags, tagMode: PORTAL_CONFIG.tagMode })
      .then((solutions) => fetchAllHistory(client, solutions))
      .then((items) => alive && setEntries(items))
      .catch((err) => alive && setError(err instanceof Error ? err.message : String(err)));
    return () => {
      alive = false;
    };
  }, [client]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (entries ?? [])
      .filter((e) => !isDismissed(e.execution.executionId))
      .filter((e) => (filter === 'all' ? true : historyStatus(e.execution.state) === filter))
      .filter((e) => (q ? e.solution.displayName.toLowerCase().includes(q) : true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, query, filter, dismissTick]);

  return (
    <>
      <p className="portal-eyebrow">History</p>
      <h1 className="portal-title">Your requests</h1>
      <p className="portal-subtitle">Pick up where you left off, or check what's still waiting on you.</p>

      <div className="portal-search">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input placeholder="Search by name…" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      <div className="portal-filters">
        {FILTERS.map((f) => (
          <button key={f.id} className="portal-filter-chip" data-active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {error && <p className="portal-error">{error}</p>}

      {!error && entries && visible.length === 0 && (
        <p className="portal-empty">{entries.length === 0 ? "Nothing here yet — start a Solution and it'll show up." : 'Nothing matches.'}</p>
      )}

      {visible.length > 0 && (
        <div className="portal-solutions-list">
          {visible.map(({ execution, solution }) => {
            const status = historyStatus(execution.state);
            return (
              <button key={execution.executionId} className="portal-history-row" onClick={() => onOpen(solution, execution.executionId)}>
                <span className="portal-solution-row__icon">
                  <KindIcon kind={solution.kind} />
                </span>
                <span className="portal-history-row__body">
                  <span className="portal-history-row__top">
                    <p className="portal-history-row__name">{solution.displayName}</p>
                    <span className="portal-status-badge" data-status={status}>
                      {HISTORY_STATUS_LABEL[status]}
                    </span>
                  </span>
                  <p className="portal-history-row__time">{relativeTime(execution.updatedAt)}</p>
                  {status === 'failed' && execution.error && <p className="portal-history-row__error">{execution.error}</p>}
                </span>
                <span
                  className="portal-history-row__dismiss"
                  role="button"
                  aria-label="Remove from history"
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissExecution(execution.executionId);
                    setDismissTick((t) => t + 1);
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
