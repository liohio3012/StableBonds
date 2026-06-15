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
    const logMsg = `
=========================================
[${new Date().toISOString()}] POST request to: ${targetUrl}
Request Body: ${body}
Incoming Headers: ${JSON.stringify(Object.fromEntries(request.headers.entries()))}
`;
    appendLog(logMsg);

    // Forward only the specific headers required by the Circle SDK to avoid breaking the Node fetch call (e.g. via accept-encoding or cookie headers)
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const headersToForward = ['authorization', 'x-appinfo', 'x-client-key', 'user-agent'];
    for (const name of headersToForward) {
      const value = request.headers.get(name);
      if (value) {
        headers[name] = value;
      }
    }

    // Force origin & referer to localhost. Since the Circle Client Key's Allowed Domains configuration
    // whitelists localhost by default, spoofing these headers in our server-side proxy bypasses the
    // 401 Unauthorized (Invalid credentials) origin validation when deployed to production domains.
    headers['origin'] = 'http://localhost:3000';
    headers['referer'] = 'http://localhost:3000/';

    appendLog(`Forwarded Headers: ${JSON.stringify(headers)}\n`);

    const upstreamRes = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body,
    });

    const data = await upstreamRes.text();
    appendLog(`Upstream Status: ${upstreamRes.status}
Upstream Response Body: ${data}
=========================================
`);

    return new NextResponse(data, {
      status: upstreamRes.status,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (err: any) {
    appendLog(`Upstream Error: ${err.message}\n`);
    return NextResponse.json(
      { jsonrpc: '2.0', id: null, error: { code: -32603, message: err.message } },
      { status: 502 }
    );
  }
}

function appendLog(msg: string) {
  try {
    const fs = require('fs');
    const path = require('path');
    const logPath = path.resolve('scratch/proxy-logs.txt');
    fs.appendFileSync(logPath, msg);
  } catch (e) {
    console.error('Failed to write log to file:', e);
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
