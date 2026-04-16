const SESSION_ID_LENGTH = 8;
const SESSION_ID_REGEX = /^[a-z0-9_-]{6,32}$/;
const SESSION_ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

export function randomSessionId(): string {
  return Array.from({ length: SESSION_ID_LENGTH }, () => {
    const index = Math.floor(Math.random() * SESSION_ALPHABET.length);
    return SESSION_ALPHABET[index] ?? 'a';
  }).join('');
}

export function isValidSessionId(id: string): boolean {
  return SESSION_ID_REGEX.test(id);
}

export function getDefaultMermaidText(): string {
  return ['flowchart LR', '  Human[Human] --> Editor[Editor]', '  Editor --> Preview[Preview]', '  Agent[Agent] --> MCP[MCP write]'].join('\n');
}

export function getServerHttpUrl(): string {
  return (process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000').replace(/\/$/u, '');
}

export function getWebsocketServerUrl(): string {
  return `${(process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000').replace(/\/$/u, '')}/ws`;
}

export function getSessionPath(sessionId: string): string {
  return `/s/${sessionId}`;
}
