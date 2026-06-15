import { NextRequest, NextResponse } from 'next/server';

const CIRCLE_UPSTREAM = process.env.CIRCLE_MODULAR_SDK_URL || 'https://w3s-sdk.circle.com/v1/rpc/w3s';

/**
 * Proxy POST requests from the browser to Circle's w3s-sdk RPC endpoint.
 * This avoids CORS issues since w3s-sdk.circle.com does not send
 * Access-Control-Allow-Origin headers for browser requests.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathSegment = path.join('/');
  const targetUrl = `${CIRCLE_UPSTREAM}/${pathSegment}`;

  try {
    const body = await request.text();

    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the authorization header if the SDK sets one
        ...(request.headers.get('authorization')
          ? { Authorization: request.headers.get('authorization')! }
          : {}),
        // Forward the x-client-key header used by Circle SDK
        ...(request.headers.get('x-client-key')
          ? { 'x-client-key': request.headers.get('x-client-key')! }
          : {}),
      },
      body,
    });

    const data = await upstreamRes.text();

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
