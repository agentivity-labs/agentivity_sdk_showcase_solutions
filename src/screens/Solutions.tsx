import { useEffect, useState, useSyncExternalStore } from 'react';
import { ChatConnectionNotice, useAgentivityClient, type EntityUnit } from '@agentivity-labs/sdk-react';
import { PORTAL_CONFIG } from '../config';
import { KindIcon } from '../lib/KindIcon';

const KIND_LABEL: Record<string, string> = {
  agent: 'Agent',
  team: 'Team',
  workflow: 'Workflow',
};

/**
 * The portal's home screen: every entity (agent, team, or workflow — doesn't matter which, they
 * all "just work" the same way from here on) tagged with one of `PORTAL_CONFIG.solutionTags` in
 * the Agentivity library. Picking a row hands its id/kind up to `App`, which opens the generic
 * chat screen for it. A vertical list rather than a card grid — see portal.css — so it reads
 * right whether there's one Solution or twenty.
 *
 * No filter-by-tag here (deliberately, for now) — it would require the backend to filter by tag
 * cheaply (a per-object index), which it currently can't: today's `/api/v1/entities?tag=` still
 * has to deserialize every entity of the matching kind(s) to check its tags, same as any other
 * listing. Fine at today's scale, not at "1000 entities" scale — revisit once the storage layer
 * can filter without a full read (see `WorkspaceObjectMetadata.Tags`, currently unpopulated).
 */
export function Solutions({ onSelect }: { onSelect: (entity: EntityUnit) => void }) {
  const client = useAgentivityClient();
  const [solutions, setSolutions] = useState<EntityUnit[]>();
  const [error, setError] = useState<string>();
  const [query, setQuery] = useState('');
  // The SDK already knows whether the server can be reached (and probes it again by itself while it cannot):
  // an unreachable server is said plainly, with the countdown to the next attempt, instead of a generic
  // "Something went wrong" — and the list loads on its own as soon as the server is back.
  const connection = useSyncExternalStore(client.connection.subscribe, client.connection.getSnapshot);
  const online = connection.status === 'online';

  useEffect(() => {
    // While offline there is nothing to ask; the effect runs again when the connection comes back.
    if (!online) return;
    let alive = true;
    client.entities
      .fetchEntities({ tags: PORTAL_CONFIG.solutionTags, tagMode: PORTAL_CONFIG.tagMode })
      .then((items) => {
        if (!alive) return;
        setError(undefined);
        setSolutions(items);
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : String(err)));
    return () => {
      alive = false;
    };
  }, [client, online]);

  const q = query.trim().toLowerCase();
  const visible = (solutions ?? []).filter((s) => (q ? s.displayName.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q) : true));

  return (
    <>
      <p className="portal-eyebrow">Welcome</p>
      <h1 className="portal-title">What can we help you with?</h1>
      <p className="portal-subtitle">Pick one below to get started — each one handles a specific request from start to finish.</p>

      {/* Only worth showing once there's enough to search through. */}
      {solutions && solutions.length > 4 && (
        <div className="portal-search portal-search--compact">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      )}

      <ChatConnectionNotice monitor={client.connection} className="portal-connection" />

      {/* A failed request while the server is unreachable is the notice above, not an error of its own. */}
      {error && online && !solutions && <p className="portal-error">{error}</p>}

      {/* Loading (a workspace that wakes up takes most of a minute): the shape of the list, not an empty page. */}
      {!solutions && !error && online && (
        <div className="portal-solutions-list" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="portal-solution-row portal-solution-row--skeleton">
              <span className="portal-solution-row__icon" />
              <span className="portal-solution-row__body">
                <span className="portal-skeleton portal-skeleton--short" />
                <span className="portal-skeleton" />
              </span>
            </div>
          ))}
        </div>
      )}

      {solutions?.length === 0 && (
        <p className="portal-empty">
          Nothing to show yet — tag an agent, team, or workflow with{' '}
          {PORTAL_CONFIG.solutionTags.map((t) => `"${t}"`).join(' / ')} in the Agentivity library.
        </p>
      )}

      {solutions && solutions.length > 0 && visible.length === 0 && <p className="portal-empty">Nothing matches.</p>}

      {visible.length > 0 && (
        <div className="portal-solutions-list">
          {visible.map((s) => (
            <button key={s.id} className="portal-solution-row" onClick={() => onSelect(s)}>
              <span className="portal-solution-row__icon">
                <KindIcon kind={s.kind} />
              </span>
              <span className="portal-solution-row__body">
                <span className="portal-solution-row__kind">{KIND_LABEL[s.kind] ?? s.kind}</span>
                <p className="portal-solution-row__name">{s.displayName}</p>
                {s.description && <p className="portal-solution-row__role">{s.description}</p>}
              </span>
              <svg className="portal-solution-row__chevron" width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
