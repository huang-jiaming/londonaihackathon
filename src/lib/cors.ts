import { NextRequest, NextResponse } from "next/server";

const DEFAULT_ALLOWED_ORIGIN_PATTERNS = [
  /^https?:\/\/localhost(?::\d+)?$/i,
  /^https:\/\/[a-z0-9-]+\.github\.io$/i
];

function getConfiguredOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isOriginAllowed(request: NextRequest, origin: string): boolean {
  if (origin === request.nextUrl.origin) return true;

  const configuredOrigins = getConfiguredOrigins();
  if (configuredOrigins.includes(origin)) return true;

  return DEFAULT_ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin));
}

function attachCorsHeaders(request: NextRequest, response: NextResponse): NextResponse {
  const origin = request.headers.get("origin");
  if (!origin) return response;

  if (isOriginAllowed(request, origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Vary", "Origin");
  }

  response.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  response.headers.set("Access-Control-Max-Age", "86400");
  return response;
}

export function withCors(request: NextRequest, response: NextResponse): NextResponse {
  return attachCorsHeaders(request, response);
}

export function rejectDisallowedOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;
  if (isOriginAllowed(request, origin)) return null;

  return withCors(
    request,
    NextResponse.json({ error: "Origin is not allowed by CORS policy" }, { status: 403 })
  );
}

export function handleOptions(request: NextRequest): NextResponse {
  const rejected = rejectDisallowedOrigin(request);
  if (rejected) return rejected;
  return withCors(request, new NextResponse(null, { status: 204 }));
}
