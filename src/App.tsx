import '@agentivity-labs/sdk-react/styles.css';
import './theme/portal.css';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import {
  AgentivityProvider,
  ArtifactsThemeProvider,
  ChatController,
  TeamGraph,
  WorkflowGraph,
  teamAvatarResolver,
  teamHubMemberId,
  teamMembersFromStructure,
  useAgentivityClient,
  useExecutionStatuses,
  type EntityUnit,
  type TeamStructure,
  type WorkflowGraphStructure,
} from '@agentivity-labs/sdk-react';
import { useLayout } from './useLayout';
import { useTheme } from './theme/useTheme';
import { ThemeSwitcher } from './theme/ThemeSwitcher';
import { Solutions } from './screens/Solutions';
import { SolutionChat } from './screens/SolutionChat';
import { History } from './screens/History';

const baseUrl = import.meta.env.VITE_AGENTIVITY_BASE_URL;

type Screen = { name: 'solutions' } | { name: 'history' } | { name: 'chat'; solution: EntityUnit };

/** Which side panel (if any) a chat screen's Solution offers — an Agent offers neither. */
type SidePanelKind = 'team' | 'workflow' | undefined;

function sidePanelKindFor(screen: Screen): SidePanelKind {
  if (screen.name !== 'chat') return undefined;
  return screen.solution.kind === 'team' ? 'team' : screen.solution.kind === 'workflow' ? 'workflow' : undefined;
}

function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M15 5L8 12l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 7.5V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function App() {
  return (
    <AgentivityProvider baseUrl={baseUrl}>
      <ThemedPortal />
    </AgentivityProvider>
  );
}

/** Splits off just to apply the theme's CSS vars once `useTheme` has resolved — kept as its own
 * component so `PortalShell` below can freely call `useAgentivityClient()` (requires being a
 * descendant of `AgentivityProvider`, which an ancestor's own function body never is). */
function ThemedPortal() {
  const { theme, setThemeId } = useTheme();
  return (
    <ArtifactsThemeProvider theme={theme.artifactsTheme}>
      <PortalShell themeId={theme.id} onThemeChange={setThemeId} />
    </ArtifactsThemeProvider>
  );
}

function PortalShell({ themeId, onThemeChange }: { themeId: string; onThemeChange: (id: string) => void }) {
  const client = useAgentivityClient();
  const [screen, setScreen] = useState<Screen>({ name: 'solutions' });
  const [executionId, setExecutionId] = useState<string>();
  const layout = useLayout();

  const goSolutions = () => setScreen({ name: 'solutions' });

  const sidePanelKind = sidePanelKindFor(screen);
  const hasSidePanel = sidePanelKind !== undefined;
  const chatSolutionId = screen.name === 'chat' ? screen.solution.id : undefined;

  // The side panel (a Team's roster/graph, or a Workflow's flow diagram), shown via a header
  // toggle when (and only when) the open Solution offers one — an Agent has neither. Below the
  // desktop breakpoint the card shows either the chat or the panel; on tablet/desktop the panel
  // sits beside it, split by a draggable divider (see portal.css). Re-derived only when entering
  // a *different* chat screen, not on every resize, so dragging or resizing across a breakpoint
  // keeps whatever the user last chose.
  const [showPanel, setShowPanel] = useState(false);
  useEffect(() => {
    setShowPanel(sidePanelKindFor(screen) !== undefined && layout === 'desktop');
    setDockDrag(undefined);
    // Only the identity of the open screen should reset this — not layout, which must NOT reset
    // an already-open/closed choice when the window merely resizes across a breakpoint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen.name === 'chat' ? screen.solution.id : screen.name]);

  const panelAside = hasSidePanel && (layout === 'desktop' || layout === 'tablet') && showPanel;
  const panelScreen = hasSidePanel && layout === 'mobile' && showPanel;

  // The dock's width: the user's own once they have dragged the divider, else a default for the layout.
  const cardRef = useRef<HTMLDivElement>(null);
  const [dockDrag, setDockDrag] = useState<number>();
  const [dragging, setDragging] = useState(false);
  const dockWidth = dockDrag ?? (layout === 'desktop' ? 320 : 280);
  const clampDock = (w: number) => Math.max(220, Math.min(w, (cardRef.current?.clientWidth ?? 480) - 260));
  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const moveDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !cardRef.current) return;
    // The dock is anchored to the card's right edge: its width is the distance from the pointer to that edge.
    setDockDrag(clampDock(cardRef.current.getBoundingClientRect().right - e.clientX));
  };
  const keyDrag = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowLeft') setDockDrag(clampDock(dockWidth + 24));
    else if (e.key === 'ArrowRight') setDockDrag(clampDock(dockWidth - 24));
  };

  // The team as saved in the team editor: its members, the icon/group each one wears, and its
  // manager. Nothing about the team is written down in this app — change it in Studio and this
  // view follows. Only fetched while a Team chat is actually open.
  const [team, setTeam] = useState<TeamStructure>();
  useEffect(() => {
    if (sidePanelKind !== 'team' || !chatSolutionId) {
      setTeam(undefined);
      return;
    }
    let alive = true;
    client.entities
      .fetchTeam(chatSolutionId)
      .then((t) => alive && setTeam(t))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [client, sidePanelKind, chatSolutionId]);
  const members = useMemo(() => (team ? teamMembersFromStructure(team) : []), [team]);
  const hubMemberId = team ? teamHubMemberId(team) : undefined;
  const resolveAvatar = useMemo(() => teamAvatarResolver(members), [members]);

  // The workflow's flow diagram — its nodes and the execution-flow edges between them. Nothing
  // about it is written down in this app either — change it in Studio and this view follows.
  // Only fetched while a Workflow chat is actually open.
  const [workflowGraph, setWorkflowGraph] = useState<WorkflowGraphStructure>();
  useEffect(() => {
    if (sidePanelKind !== 'workflow' || !chatSolutionId) {
      setWorkflowGraph(undefined);
      return;
    }
    let alive = true;
    client.entities
      .fetchWorkflowGraph(chatSolutionId)
      .then((g) => alive && setWorkflowGraph(g))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [client, sidePanelKind, chatSolutionId]);

  // One ChatController per chat screen, owned here so it's the SAME instance the conversation
  // (SolutionChat) and the side panel (rendered alongside it, below) both read from — otherwise
  // the two would silently drift out of sync.
  const controller = useMemo(() => (chatSolutionId ? new ChatController({ contextId: chatSolutionId }) : undefined), [chatSolutionId]);

  // Both diagrams (a workflow's nodes, a team's members) light up from the execution's own inspector, not from stream
  // events (those are not replayed: a run opened from History, or after a reconnect, would show an empty diagram).
  const stepStatuses = useExecutionStatuses(screen.name === 'chat' ? executionId : undefined, { controller });

  const panelLabel = sidePanelKind === 'workflow' ? 'workflow' : 'team';
  const panel = controller && (sidePanelKind === 'team' ? <TeamGraph controller={controller} members={members} hubMemberId={hubMemberId} statuses={stepStatuses.members} /> : sidePanelKind === 'workflow' && workflowGraph ? <WorkflowGraph controller={controller} structure={workflowGraph} statuses={stepStatuses.nodes} /> : null);

  return (
    <div className="portal-shell" data-layout={layout} data-team={panelAside ? 'aside' : 'closed'} data-dragging={dragging || undefined}>
      <div className="portal-frame" style={{ ['--dock-w' as string]: `${dockWidth}px` }}>
        <div ref={cardRef} className="portal-card">
          <div className="portal-topbar">
            <div className="portal-header__actions">
              <ThemeSwitcher activeId={themeId} onChange={onThemeChange} />
              {hasSidePanel && (
                <button className="portal-pill-btn" onClick={() => setShowPanel((v) => !v)} aria-pressed={showPanel}>
                  {showPanel ? (layout === 'mobile' ? 'Back to chat' : `Hide ${panelLabel}`) : `See ${panelLabel}`}
                </button>
              )}
              {screen.name === 'solutions' && (
                <button className="portal-icon-btn" onClick={() => setScreen({ name: 'history' })} aria-label="Your history" title="Your history">
                  <HistoryIcon />
                </button>
              )}
              {screen.name !== 'solutions' && (
                <button className="portal-icon-btn portal-icon-btn--ghost" onClick={goSolutions} aria-label="Back to Solutions" title="Back to Solutions">
                  <BackIcon />
                </button>
              )}
            </div>
          </div>

          <div className="portal-card__body">
            <div className="portal-card__main">
              {screen.name === 'solutions' && (
                <div className="portal-card__scroll">
                  <Solutions
                    onSelect={(solution) => {
                      // A stale executionId here would make the next message continue whatever
                      // conversation was last open with a DIFFERENT Solution, instead of starting
                      // a real new one (same bug class confirmed in the Trip Manager showcase:
                      // the backend correctly resumed the old run/thread, re-asking
                      // already-answered questions, while the chat UI looked empty/fresh —
                      // appearing to "do nothing").
                      setExecutionId(undefined);
                      setScreen({ name: 'chat', solution });
                    }}
                  />
                </div>
              )}

              {screen.name === 'history' && (
                <div className="portal-card__scroll">
                  <History
                    onOpen={(solution, resumeExecutionId) => {
                      setExecutionId(resumeExecutionId);
                      setScreen({ name: 'chat', solution });
                    }}
                  />
                </div>
              )}

              {screen.name === 'chat' && controller && (
                <SolutionChat
                  solution={screen.solution}
                  executionId={executionId}
                  onExecutionStarted={setExecutionId}
                  controller={controller}
                  panelScreen={panelScreen}
                  panel={panel}
                  running={stepStatuses.running}
                  resolveMemberAvatar={resolveAvatar}
                />
              )}
            </div>

            {hasSidePanel && layout !== 'mobile' && (
              <div
                className="portal-splitter"
                role="separator"
                aria-orientation="vertical"
                aria-label={`Resize the ${panelLabel} panel`}
                tabIndex={panelAside ? 0 : -1}
                hidden={!panelAside}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={() => setDragging(false)}
                onPointerCancel={() => setDragging(false)}
                onKeyDown={keyDrag}
              />
            )}

            {hasSidePanel && layout !== 'mobile' && (
              <aside className="portal-team-dock" data-open={panelAside} aria-label={`Your ${panelLabel}`} aria-hidden={!panelAside} inert={!panelAside}>
                <div className="portal-team-dock__content">
                  <p className="portal-eyebrow" style={{ margin: 0 }}>
                    Your {panelLabel}
                  </p>
                  {panel}
                </div>
              </aside>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
