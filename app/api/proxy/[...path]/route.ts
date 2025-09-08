// app/api/[...path]/route.ts (Next.js App Router)
import { NextRequest, NextResponse } from 'next/server'

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1`

// Make sure this route is always dynamic (no caching of proxied results)
export const dynamic = 'force-dynamic'

function redactHeaders(h: Headers) {
  const clone: Record<string, string> = {}
  h.forEach((v, k) => {
    if (k.toLowerCase() === 'authorization') clone[k] = '[redacted]'
    else clone[k] = v
  })
  return clone
}

function getContentType(h: Headers) {
  const ct = h.get('content-type') || ''
  return ct.split(';')[0].trim().toLowerCase()
}

async function parseBodyByContentType(res: Response) {
  // 204 / 205 / 304 should not have a body
  if ([204, 205, 304].includes(res.status)) return null
  const ct = getContentType(res.headers)
  if (ct === 'application/json' || ct === 'application/problem+json') {
    try {
      return await res.json()
    } catch {
      // fallthrough: sometimes APIs set JSON but send empty
      const text = await res.text()
      return text ? { raw: text } : null
    }
  }
  // default to text for anything else
  const text = await res.text()
  return text || null
}

function formatFastAPIErrorPayload(payload: any) {
  // FastAPI validation errors look like: { detail: [{loc, msg, type, ...}, ...] }
  if (payload && typeof payload === 'object' && Array.isArray(payload.detail)) {
    return {
      message: 'Validation failed.',
      issues: payload.detail.map((d: any) => ({
        path: Array.isArray(d.loc) ? d.loc.join('.') : String(d.loc ?? ''),
        message: d.msg ?? 'Invalid value',
        type: d.type ?? 'validation_error',
      })),
    }
  }
  // OR: { detail: "..." }
  if (payload && typeof payload === 'object' && typeof payload.detail === 'string') {
    return { message: payload.detail }
  }
  return null
}

function friendlyMessage(status: number, formatted: any, raw: any) {
  // Provide a concise, user-friendly message; keep specifics in "details"
  if (formatted) return formatted
  if (status === 404) return { message: 'Not found.' }
  if (status === 401) return { message: 'Unauthorized. Please sign in or check your credentials.' }
  if (status === 403) return { message: 'Forbidden. You do not have access to this resource.' }
  if (status === 422) return { message: 'Validation failed.' }
  if (status >= 500) return { message: 'Upstream service error. Please try again later.' }
  // Fallback: include raw when it’s safe/simple
  if (typeof raw === 'string') return { message: raw.slice(0, 500) }
  return { message: 'Request failed.' }
}

async function proxy(request: NextRequest, method: 'GET' | 'POST' | 'PATCH' | 'PUT', params: { path: string[] }) {
  const p = await params
  const t0 = performance.now()
  // Reuse incoming request ID if provided; otherwise generate and log absence
  let reqId = request.headers.get('x-request-id') || ''
  if (!reqId) {
    reqId = crypto.randomUUID()
    console.warn('[proxy:reqId] Incoming request missing x-request-id header; generated new', { reqId })
  } else {
    console.info('[proxy:reqId] Reusing incoming request id', { reqId })
  }

  // Build URL
  const path = (p.path || []).join('/')
  const searchParams = request.nextUrl.searchParams
  const queryString = searchParams.toString()
  const url = `${API_BASE_URL}/${path}${path.endsWith('/') ? '' : '/'}${queryString ? `?${queryString}` : ''}`

  // Prepare headers
  const fetchHeaders: HeadersInit = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  // Get the JWT from the NextAuth session
  const { getToken } = await import("next-auth/jwt");
  const token = await getToken({
    req: request,
    secret: process.env.APP_JWT_SECRET || process.env.NEXTAUTH_SECRET
  });

  if (token?.appJwt) {
    // Use our custom JWT that's compatible with the backend
    fetchHeaders['Authorization'] = `Bearer ${token.appJwt}`;

    // Fallback to any provided Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
      fetchHeaders['Authorization'] = authHeader;
      console.log('[proxy:auth] Using provided Authorization header');
    } else {
      console.warn('[proxy:auth] No JWT found, request may fail auth');
    }
  }

  // Body (only for POST/PATCH)
  let body: string | undefined
  if (method !== 'GET') {
    // Pass through raw text so we don’t accidentally re-shape it
    body = await request.text()
  }

  // Logs disabled to reduce console noise
  // console.info(
  //   '[proxy:request]',
  //   JSON.stringify({
  //     reqId,
  //     method,
  //     to: url,
  //     query: Object.fromEntries(searchParams.entries()),
  //     headers: redactHeaders(new Headers(request.headers)),
  //     bodyPreview: body ? body.slice(0, 500) : undefined,
  //   })
  // )

  let upstream: Response
  try {
    upstream = await fetch(url, { method, headers: fetchHeaders, body, redirect: 'follow' })
  } catch (e) {
    const dt = Math.round(performance.now() - t0)
    // Keep error logging for network errors as these are important for troubleshooting
    console.error(
      '[proxy:network_error]',
      JSON.stringify({ reqId, method, to: url, ms: dt, error: e instanceof Error ? e.message : String(e) })
    )
    return NextResponse.json(
      { message: 'Could not reach the upstream service. Please try again.' },
      { status: 502, headers: { 'x-request-id': reqId } }
    )
  }

  const dt = Math.round(performance.now() - t0)
  const ct = getContentType(upstream.headers)
  const payload = await parseBodyByContentType(upstream)


  // Log structured response (truncate big bodies)
  const bodyPreview =
    typeof payload === 'string'
      ? payload.slice(0, 800)
      : payload && typeof payload === 'object'
        ? JSON.stringify(payload).slice(0, 800)
        : payload

  // Logs disabled to reduce console noise
  // console.info(
  //   '[proxy:response]',
  //   JSON.stringify({
  //     reqId,
  //     method,
  //     status: upstream.status,
  //     contentType: ct || 'none',
  //     ms: dt,
  //     headers: Object.fromEntries(upstream.headers.entries()),
  //     bodyPreview,
  //   })
  // )

  // Custom log: check for members in payload
  if (payload && typeof payload === 'object' && 'members' in payload) {
    console.warn('[proxy:members-debug]', JSON.stringify({ reqId, members: payload.members }))
  }

  // Error shaping for users, but keep details in logs
  if (!upstream.ok) {
    const formatted = formatFastAPIErrorPayload(payload)
    const userMessage = friendlyMessage(upstream.status, formatted, payload)

    // Include request id so users (or you) can correlate with logs
    return NextResponse.json(
      { ...userMessage, requestId: reqId, status: upstream.status },
      { status: upstream.status, headers: { 'x-request-id': reqId } }
    )
  }

  // Success: pass through JSON if JSON; otherwise text
  const passthroughHeaders: HeadersInit = {
    'x-request-id': reqId,
  }
  // You might want to propagate caching hints from upstream if present
  const cc = upstream.headers.get('cache-control')
  if (cc) passthroughHeaders['cache-control'] = cc

  if (ct === 'application/json' || ct === 'application/problem+json') {
    return NextResponse.json(payload ?? null, {
      status: upstream.status,
      headers: passthroughHeaders,
    })
  }

  // Non-JSON (e.g., plain text). Don’t force JSON content-type.
  return new NextResponse(typeof payload === 'string' ? payload : '', {
    status: upstream.status,
    headers: {
      ...passthroughHeaders,
      'content-type': ct || 'text/plain; charset=utf-8',
    },
  })
}

/** Handlers */
export async function GET(request: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(request, 'GET', ctx.params)
}

export async function POST(request: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(request, 'POST', ctx.params)
}

export async function PATCH(request: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(request, 'PATCH', ctx.params)
}

export async function PUT(request: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(request, 'PUT', ctx.params)
}
