import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import {
  ChatDiscussion,
  ConnectionStatusBanner,
  buildArtifactsBundle,
  retryWithBackoff,
  useAgentivityClient,
  useRunStream,
  type AgUiChatMember,
  type AgUiConnectionState,
  type AgUiMemberAvatar,
  type ChatController,
  type ChatHilGate,
  type ChatMessage,
  type ChatMessageRole,
  type EntityUnit,
} from '@agentivity-labs/sdk-react';

// ChatMessageBubble only renders a block type present in the registry it is given; the default
// bundle already contains every standard artifact widget (RadarChart, charts, cards, …) a
// workflow/agent node can emit via interact_with_human (see AgUiWidgetCatalog.cs).
const widgetRegistry = buildArtifactsBundle();

function connectionMessage(state: AgUiConnectionState, secondsLeft: number | undefined) {
  if (state.status === 'connecting') return 'Connecting…';
  return `Connection lost — reconnecting (attempt ${state.attempt})${secondsLeft != null && secondsLeft > 0 ? ` in ${secondsLeft}s…` : '…'}`;
}

function roleForAuthorType(authorType: string): ChatMessageRole {
  if (authorType === 'user') return 'user';
  if (authorType === 'system') return 'system';
  return 'assistant'; // agent | workflow | unknown — all render as the other side of the conversation
}

/**
 * A generic conversation with whichever Solution was picked — agnostic of whether it's an agent,
 * a team, or a workflow underneath: `startExecution`, HIL responses, and `ChatDiscussion` itself
 * already work identically for all three.
 *
 * When `executionId` is already set on mount (opened from History, not freshly picked from the
 * Solutions screen), this also hydrates the conversation's past messages and any currently-
 * pending HIL question before the live stream takes over — "resume" rather than "start over".
 */
export function SolutionChat({
  solution,
  executionId,
  onExecutionStarted,
  controller,
  panelScreen = false,
  panel,
  running,
  resolveMemberAvatar,
}: {
  solution: EntityUnit;
  executionId: string | undefined;
  onExecutionStarted: (executionId: string) => void;
  /** Owned by the shared shell (App.tsx) — kept as the same instance the side panel (team
   * roster/graph, or workflow diagram) reads from, so both reflect the exact same live
   * conversation state. */
  controller: ChatController;
  /** True only on a phone-width layout, while the side panel is open (a Team or Workflow
   * Solution only — an Agent has neither) — the panel replaces the chat pane in place (there's
   * no room to show both). Desktop/tablet show it as a side dock instead (rendered by App.tsx,
   * outside this component). */
  panelScreen?: boolean;
  /** The side panel itself (`<TeamGraph>` or `<WorkflowGraph>`), already built by App.tsx — this
   * component only decides WHERE to render it (inline, in place of the chat, on a phone). */
  panel?: ReactNode;
  /** The execution is actively working (not waiting on the user, not finished) — lights up the input's stop button. */
  running?: boolean;
  resolveMemberAvatar?: (member: AgUiChatMember) => AgUiMemberAvatar | undefined;
}) {
  const client = useAgentivityClient();
  const [streamUrl, setStreamUrl] = useState<string>();
  const [error, setError] = useState<string>();

  const { events, connectionState } = useRunStream(streamUrl);

  useEffect(() => {
    events.forEach(controller.feedEvent);
  }, [events, controller]);

  // Resume: only runs once, and only when this screen was opened directly at an existing
  // executionId (from History) rather than starting fresh from the Solutions screen.
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!executionId || hydratedRef.current) return;
    hydratedRef.current = true;
    (async () => {
      try {
        const [threads, execution] = await Promise.all([client.conversations.fetchExecutionThreads(executionId), client.runs.fetchExecution(executionId)]);
        const defaultThread = threads.find((t) => t.isDefault) ?? threads[0];

        if (defaultThread) {
          controller.addThread({
            threadId: defaultThread.threadId,
            contextId: solution.id,
            runId: defaultThread.runId ?? '',
            title: defaultThread.title,
            isDefault: defaultThread.isDefault,
            status: defaultThread.status,
            createdAt: defaultThread.createdAt,
            updatedAt: defaultThread.updatedAt,
          });

          const messages = await client.conversations.fetchExecutionThreadMessages({ executionId, threadId: defaultThread.threadId });
          for (const m of messages) {
            const message: ChatMessage = {
              id: m.messageId,
              role: roleForAuthorType(m.authorType),
              contextId: solution.id,
              threadId: defaultThread.threadId,
              runId: m.runId ?? '',
              text: m.text,
              authorId: m.authorId,
              authorName: m.authorName,
              metadata: m.metadata,
              createdAt: m.createdAt,
              updatedAt: m.updatedAt,
            };
            controller.addMessage(defaultThread.threadId, message);
          }

          if (execution?.state === 'waitingforinput') {
            const pending = await client.runs.fetchPendingHil(executionId).catch(() => undefined);
            const first = pending?.requests[0];
            if (first) {
              controller.setHilGate({
                requestId: first.requestId,
                threadId: defaultThread.threadId,
                question: typeof first.question === 'string' ? first.question : '',
                title: 'Your input needed',
              });
            }
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    })();
  }, [executionId, client, controller, solution.id]);

  // A Workflow usually opens with its own message (a welcome/instructions node), so start it as soon
  // as the chat opens instead of making the user type first to trigger it. Only for a brand-new
  // conversation — one resumed from History already has its own executionId/messages.
  const autoStartedRef = useRef(false);
  useEffect(() => {
    if (solution.kind !== 'workflow' || executionId || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void handleSend('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrapped in retryWithBackoff: a real device hits transient blips routinely (a mobile network
  // handoff, a momentary backend hiccup) and a single one of those shouldn't surface as a hard
  // failure for something this central to the flow — retry a few times, transparently, first.
  async function handleSend(text: string) {
    setError(undefined);
    try {
      const session = await retryWithBackoff(() => client.runs.startExecution({ entityId: solution.id, input: text, executionId, enableHil: true }));
      onExecutionStarted(session.executionId);
      setStreamUrl(session.streamUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleHilResponse(gate: ChatHilGate, text: string, source: string) {
    if (!executionId) return;
    setError(undefined);
    try {
      await retryWithBackoff(() => client.runs.submitHilResponse({ executionId, requestId: gate.requestId, response: text, source }));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  // The chat input's stop button: cancels the run that is working. Rejecting leaves the button available to retry.
  async function handleStop() {
    if (!executionId) return;
    setError(undefined);
    try {
      await client.runs.cancelExecution(executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  return (
    <div className="portal-chat-shell">
      <div className="portal-chat-shell__header">
        <h1 className="portal-title" style={{ fontSize: 17, margin: 0, maxWidth: 'none' }}>
          {solution.displayName}
        </h1>
      </div>

      {!panelScreen && (
        <div className="portal-chat-pane">
          <ChatDiscussion
            controller={controller}
            onSend={(text) => void handleSend(text)}
            onHilResponse={(gate, text, source) => handleHilResponse(gate, text, source)}
            showActiveMemberIndicator
            showSpeakerLabels
            resolveMemberAvatar={resolveMemberAvatar}
            widgetRegistry={widgetRegistry}
            running={running}
            onStop={executionId ? () => handleStop() : undefined}
            inputHint="Type a message…"
            hilInputHint="Type your answer…"
          />
        </div>
      )}

      {panelScreen && <div className="portal-team-inline">{panel}</div>}

      {streamUrl && <ConnectionStatusBanner state={connectionState} renderMessage={connectionMessage} />}
      {error && <p style={{ fontSize: 11, color: 'var(--attention)' }}>{error}</p>}
    </div>
  );
}
