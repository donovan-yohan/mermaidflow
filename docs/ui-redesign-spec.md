# UI Redesign + MCP Integration Spec

Reference mockup: `docs/design-mockup.html` (open in browser to see the target layout)

## Problem

The current session workspace reads like a tutorial/dashboard. Every panel has an `<h2>` title and `<p>` explanation ("CodeMirror 6 + Yjs keeps the canonical Mermaid text synchronized across tabs"). There's a separate Share URL card, a separate Presence card, all stacked vertically above the editor. The actual workspace is pushed below the fold.

The mockup is a dense, IDE-like layout that fits entirely in one viewport with zero explanatory text. It's just the tool.

## Target Layout (from mockup)

```
+-----------------------------------------------------------------------+
| TOPBAR (48px, single row)                                             |
| [Logo]  [session-url + copy]  [MCP status]     [avatars]  [Share]     |
+-----------------------------------------------------------------------+
| EDITOR PANE (40%)          | DIAGRAM PANE (60%)                       |
| +---------+                | +---------+                              |
| |pane-hdr |                | |pane-hdr |                              |
| | "mermaid source" "synced"| | "preview" "live"                       |
| +---------+                | +---------+                              |
| |                          | |                                        |
| | CodeMirror               | | Mermaid SVG                            |
| | with line numbers        | | rendered diagram                       |
| | collaborative cursors    | |                                        |
| |                          | |                                        |
| |                          | |                                        |
| +---------+                | +---------+                              |
+-----------------------------------------------------------------------+
| ACTIVITY FEED (120px max, docked bottom, full width)                  |
| [pane-hdr: "activity" / "3 collaborators"]                            |
| [timestamp] [dot] [actor] [action]                                    |
| [timestamp] [dot] [actor] [action]                                    |
+-----------------------------------------------------------------------+
```

## What Changes

### 1. Kill the tutorial chrome

Remove from `session-workspace.tsx`:
- The `session-topbar` card with hero-sized "Session xyz" heading and "New session" link
- The `share-card` section (Share URL card with explanation text)
- The `presence-strip` section (Presence card with explanation text)
- All `<p>` descriptions inside panel headers ("CodeMirror 6 + Yjs keeps...", "Renders from canonical text...", "Events are read directly...")

### 2. Add a compact topbar

Single 48px row containing:
- **Left group:** Logo text ("ArielCharts"), session URL in a bordered chip with copy button, MCP connection status (green dot + "MCP: N agents connected" or hidden when 0)
- **Right group:** Presence avatars (stacked circles with initials, dashed border for agents), Share button

The topbar replaces the session-topbar, share-card, and presence-strip entirely.

### 3. Restructure the workspace layout

Current: vertically stacked cards (topbar card, share card, presence card, then a grid of editor + preview/activity)

Target: full-viewport layout
- Topbar: fixed 48px
- Main: `flex: 1`, horizontal split (40% editor / 60% preview), fills remaining height
- Activity: docked at bottom, full width, max-height 120px, scrollable

### 4. Compact pane headers

Each pane (editor, preview, activity) gets a minimal header row:
- Left: label text ("mermaid source", "preview", "activity")
- Right: status text ("synced", "live", "3 collaborators")
- No `<h2>`, no `<p>` descriptions

### 5. Presence as avatars, not pills

Current: full-width card with name pills listing every participant
Target: stacked circular avatars in the topbar (24px, overlapping, colored, with 2-letter initials). Humans get solid border, agents get dashed green border with "AI" text.

### 6. Activity feed at the bottom

Current: activity is in a sidebar panel stacked with the preview
Target: full-width bottom panel, max 120px, compact rows: `[time] [colored dot] [actor name / agent badge] [action text]`

## What Stays the Same

- All Yjs/CRDT/collaboration logic (untouched)
- All state management (identity, connection, participants, activity, mermaid text, SVG rendering)
- CodeMirror 6 editor configuration
- Mermaid rendering logic (parse + render + last-valid-SVG fallback)
- Error banner for parse failures
- The landing page (`landing-page-client.tsx`) is not part of this pass

## Component Structure After

```tsx
<main className="workspace">
  {/* Topbar */}
  <div className="topbar">
    <div className="topbar-left">
      <span className="logo">ArielCharts</span>
      <div className="session-url">
        <span>{shareUrl}</span>
        <button onClick={handleCopyShareUrl}>Copy</button>
      </div>
      {/* MCP status - show when agents connected */}
    </div>
    <div className="topbar-right">
      <div className="presence-avatars">
        {participants.map(...)}  {/* stacked circles */}
      </div>
      <button className="share-btn">Share</button>
    </div>
  </div>

  {/* Main workspace */}
  <div className="main">
    {/* Editor pane (40%) */}
    <div className="editor-pane">
      <div className="pane-header">
        <span>mermaid source</span>
        <span>{connectionLabels[connectionState]}</span>
      </div>
      <div className="editor-host" ref={editorHostRef} />
    </div>

    {/* Diagram pane (60%) */}
    <div className="diagram-pane">
      <div className="pane-header">
        <span>preview</span>
        <span>live</span>
      </div>
      {renderError && <div className="error-banner">...</div>}
      <div className="preview-surface">
        {/* SVG or empty state */}
      </div>
    </div>
  </div>

  {/* Activity feed (bottom, full width) */}
  <div className="activity-pane">
    <div className="pane-header">
      <span>activity</span>
      <span>{activeParticipantCount} collaborators</span>
    </div>
    <div className="activity-content">
      {activity.map((event) => (
        <div className="activity-item">
          <span className="activity-time">{formatTimestamp(event.timestamp)}</span>
          <span className="activity-dot" style={{backgroundColor: ...}} />
          <span className="activity-text">
            {event.actor.type === 'agent' && <span className="agent-badge">{event.actor.name}</span>}
            {event.actor.type === 'human' && <strong>{event.actor.name}</strong>}
            {' '}{describeActivity(event)}
          </span>
        </div>
      ))}
    </div>
  </div>
</main>
```

## CSS Direction

- Full viewport height: `html, body { height: 100vh; overflow: hidden; }`
- Workspace: `display: flex; flex-direction: column; height: 100vh;`
- Topbar: `height: 48px; flex: none;`
- Main: `flex: 1; display: flex; overflow: hidden;`
- Editor pane: `width: 40%; border-right: 1px solid var(--panel-border);`
- Diagram pane: `flex: 1;`
- Activity pane: `flex: none; max-height: 120px; overflow-y: auto; border-top: 1px solid var(--panel-border);`
- Color scheme: keep the existing dark theme variables, but adopt the mockup's GitHub-dark palette (`#0d1117`, `#161b22`, `#30363d`) for the workspace chrome
- The "card" styling with rounded corners and backdrop blur is for the landing page. The workspace should feel like an IDE, not a dashboard.

---

## Part 2: MCP Server Integration

### Problem

The design doc specifies that agents connect via the MCP protocol (Streamable HTTP transport) so that Claude Code, Cursor, or any MCP client can add ArielCharts as an MCP server and use `read_diagram`, `write_diagram`, `list_sessions` as tools.

The tool logic already exists in `apps/server/src/lib/mcp.ts` (`handleMcpToolCall` handles all three operations). But it's wired up as a raw `POST /mcp` JSON endpoint in `apps/server/src/index.ts`. This is a custom protocol, not MCP. No MCP client can connect to it.

### What Exists

- `apps/server/src/lib/mcp.ts` — `handleMcpToolCall(manager, payload)` dispatches `read_diagram`, `write_diagram`, `list_sessions` and returns results. All business logic is here and tested.
- `apps/server/src/lib/mcp.test.ts` — unit tests for the tool handlers.
- `apps/server/src/index.ts` — `POST /mcp` route that calls `handleMcpToolCall` and returns `{ result }` or `{ error }`.
- `@modelcontextprotocol/sdk` is NOT in dependencies.

### What Needs to Happen

1. **Add `@modelcontextprotocol/sdk` as a dependency** to `apps/server/package.json`. Look up the latest version from npm (`npm info @modelcontextprotocol/sdk version`), do not guess.

2. **Create an MCP server instance** that registers the three tools with proper JSON Schema input definitions:

   ```
   read_diagram:
     input: { session_id: string (required) }
     output: { mermaid_text: string, participants: Participant[] }

   write_diagram:
     input: { session_id: string (required), mermaid_text: string (required), actor_name?: string, actor_type?: "human"|"agent", detail?: string }
     output: { success: boolean }

   list_sessions:
     input: {} (no required fields)
     output: { sessions: { id, title, participants }[] }
   ```

3. **Wire up `StreamableHTTPServerTransport`** on the existing `/mcp` route. The SDK handles the protocol (initialization, tool listing via `tools/list`, tool calls via `tools/call`, streaming responses). Replace the current raw POST handler with the SDK transport.

4. **Keep the existing `handleMcpToolCall` logic** as the implementation behind each registered tool. The tool handler functions should delegate to the same `manager.readSession()`, `manager.writeDiagram()`, `manager.listSessions()` calls.

5. **Origin validation**: The current `/mcp` route checks `isOriginAllowed()`. Keep this. MCP over Streamable HTTP uses standard HTTP, so CORS/origin checks still apply. Apply them before handing off to the SDK transport.

6. **Update or add tests** for the MCP protocol layer (initialization handshake, tool listing, tool call round-trip). The existing `mcp.test.ts` tests the business logic and can stay as-is. New tests should verify the SDK transport integration.

### What the Agent Setup Looks Like After

Claude Code `~/.claude.json` or project `.mcp.json`:
```json
{
  "mcpServers": {
    "arielcharts": {
      "type": "streamable-http",
      "url": "https://arielcharts-server.fly.dev/mcp"
    }
  }
}
```

Then from Claude Code: "read the diagram in session abc123" triggers `read_diagram({ session_id: "abc123" })` through the MCP protocol.

### Implementation Notes

- The MCP SDK's `StreamableHTTPServerTransport` expects to handle the full request/response lifecycle. The current pattern of `readJsonBody` + `sendJson` in `index.ts` won't work. The SDK transport needs access to the raw `req`/`res` objects.
- The SDK handles session management (MCP sessions, not ArielCharts sessions) internally. Each connected agent gets an MCP session. Don't conflate these with Yjs document sessions.
- Stateless mode (no MCP session persistence) is fine for MVP. Agents reconnect and re-initialize.
- The SDK may need the HTTP server to NOT parse the body before passing to the transport. Check the SDK docs for the expected integration pattern.

### Dependency between Part 1 and Part 2

These are independent. The UI redesign touches `apps/web/` only. The MCP integration touches `apps/server/` only. They can be done in parallel.

---

## Acceptance Criteria

### UI (Part 1)
1. Session workspace fills the full viewport, no scrolling needed
2. All info (session URL, presence, connection status, share) lives in the topbar
3. Editor and preview are side-by-side, filling the viewport between topbar and activity feed
4. Activity feed is docked at the bottom, compact, scannable
5. Zero explanatory text anywhere in the workspace
6. All existing functionality works: editing, preview, presence, activity, copy URL, connection status
7. Landing page is unchanged

### MCP (Part 2)
8. `@modelcontextprotocol/sdk` is used for the MCP server, not a custom protocol
9. An MCP client can connect to `https://<server>/mcp` and discover tools via `tools/list`
10. `read_diagram`, `write_diagram`, `list_sessions` work through the MCP protocol
11. Agent edits via MCP appear in the browser (existing Yjs sync, just verify it still works)
12. Origin validation still applies to the `/mcp` endpoint
13. Existing server tests still pass, new MCP protocol tests added
