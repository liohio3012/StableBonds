import { NextRequest, NextResponse } from 'next/server';

const CIRCLE_UPSTREAM = process.env.CIRCLE_MODULAR_SDK_URL || 'https://modular-sdk.circle.com/v1/rpc/w3s/buidl';

/**
 * Proxy POST requests from the browser to Circle's modular-sdk RPC endpoint.
 * This avoids CORS issues since modular-sdk.circle.com does not send
 * Access-Control-Allow-Origin headers for browser requests.
 * Uses optional catch-all [[...path]] to handle both base calls (/api/circle-proxy)
 * and subpath calls (/api/circle-proxy/arcTestnet).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  try {
    const { path } = await params;
    const pathSegment = path ? path.join('/') : '';
    const targetUrl = pathSegment ? `${CIRCLE_UPSTREAM}/${pathSegment}` : CIRCLE_UPSTREAM;

    const body = await request.text();
    console.log(`[circle-proxy] POST request to: ${targetUrl}`);

    // Forward headers from incoming request, excluding host/origin/referer to avoid CDN/CORS issues
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    request.headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (!['host', 'origin', 'referer', 'content-length'].includes(lowerKey)) {
        headers[key] = value;
      }
    });

    console.log(`[circle-proxy] Forwarding headers: ${JSON.stringify(headers)}`);

    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body,
    });

    const data = await upstreamRes.text();
    console.log(`[circle-proxy] Upstream response status: ${upstreamRes.status}`);
    console.log(`[circle-proxy] Upstream response body: ${data}`);

    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    console.error('[circle-proxy] upstream error:', err.message);
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32603, message: err.message } },
      { status: 502 }
    );
  }
}

/**
 * Handle CORS preflight requests from the browser.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-client-key',
    },
  });
}
