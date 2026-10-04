import type { AgentivityClient, EntityUnit, ExecutionRecord } from '@agentivity-labs/sdk-react';

/** One past (or in-progress) conversation with a Solution, ready for the History screen. */
export interface HistoryEntry {
  execution: ExecutionRecord;
  solution: EntityUnit;
}

/** Buckets `ExecutionRecord.state` into the states the History screen cares about. */
export type HistoryStatus = 'waiting' | 'active' | 'failed' | 'completed';

export function historyStatus(state: string): HistoryStatus {
  const s = state.trim().toLowerCase();
  if (s === 'waitingforinput' || s === 'waiting_for_input') return 'waiting';
  if (s === 'active' || s === 'running') return 'active';
  if (s === 'failed') return 'failed'; // it stopped on an error: never presented as a success
  return 'completed'; // completed | cancelled | anything else — nothing left to wait on
}

export const HISTORY_STATUS_LABEL: Record<HistoryStatus, string> = {
  waiting: 'Waiting for you',
  active: 'In progress',
  failed: 'Failed',
  completed: 'Completed',
};

/**
 * Every past/current execution across every Solution — the backend only offers history scoped
 * to one entity at a time (`GET /api/v1/executions?entityId=`), so this fans that out across all
 * Solutions and merges the results, most recently updated first.
 */
export async function fetchAllHistory(client: AgentivityClient, solutions: EntityUnit[]): Promise<HistoryEntry[]> {
  const perSolution = await Promise.all(
    solutions.map(async (solution) => {
      const executions = await client.runs.fetchExecutionsByEntityId(solution.id).catch(() => []);
      return executions.map((execution) => ({ execution, solution }));
    })
  );
  return perSolution
    .flat()
    .sort((a, b) => (b.execution.updatedAt ?? '').localeCompare(a.execution.updatedAt ?? ''));
}

// ── Locally-dismissed entries ────────────────────────────────────────────────
// The backend has no "delete a run from my history" concept (a run is the system's own record of
// what happened, not the viewer's to erase) — "Delete" here just hides it from THIS browser's
// History list, same idea as archiving an email instead of deleting the server's copy.

const DISMISSED_KEY = 'solutions-portal-dismissed-executions';

function readDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function isDismissed(executionId: string): boolean {
  return readDismissed().has(executionId);
}

export function dismissExecution(executionId: string): void {
  try {
    const ids = readDismissed();
    ids.add(executionId);
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    // Private browsing / blocked storage: the entry reappears next visit — acceptable, nothing to persist to.
  }
}
