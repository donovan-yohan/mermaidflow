import type { IncomingMessage, OutgoingHttpHeaders, ServerResponse } from 'node:http';

export async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return {};
  }

  return JSON.parse(raw);
}

export function sendJson(
  response: ServerResponse,
  statusCode: number,
  payload: unknown,
  headers: OutgoingHttpHeaders = {},
): void {
  response.statusCode = statusCode;

  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      response.setHeader(key, value);
    }
  }

  response.setHeader('content-type', 'application/json');
  response.end(JSON.stringify(payload));
}

export function sendEmpty(response: ServerResponse, statusCode: number, headers: OutgoingHttpHeaders = {}): void {
  response.statusCode = statusCode;

  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      response.setHeader(key, value);
    }
  }

  response.end();
}

export function createCorsHeaders(
  origin: string | undefined,
  allowedOrigins: readonly string[],
  requestedHeaders: string | undefined,
): OutgoingHttpHeaders {
  const allowOrigin = allowedOrigins.length === 0 || allowedOrigins.includes('*') ? '*' : origin;

  return {
    'access-control-allow-headers': requestedHeaders?.trim() ? requestedHeaders : 'content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-origin': allowOrigin,
    'access-control-max-age': '86400',
    vary: allowOrigin === '*' ? 'Access-Control-Request-Headers' : 'Origin, Access-Control-Request-Headers',
  };
}
