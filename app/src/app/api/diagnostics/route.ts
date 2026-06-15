import { NextResponse } from 'next/server';

export async function GET() {
  const clientKey = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY || '';
  const apiKey = process.env.CIRCLE_API_KEY || '';

  const clientKeyParts = clientKey.split(':');
  const apiKeyParts = apiKey.split(':');

  const clientTenant = clientKeyParts.length >= 2 ? clientKeyParts[1] : '';
  const apiTenant = apiKeyParts.length >= 2 ? apiKeyParts[1] : '';

  const mismatch = clientTenant && apiTenant ? clientTenant !== apiTenant : false;

  return NextResponse.json({
    clientKeyConfigured: !!clientKey,
    apiKeyConfigured: !!apiKey,
    tenantMismatch: mismatch,
    clientTenant: clientTenant ? `${clientTenant.substring(0, 6)}...` : '',
    apiTenant: apiTenant ? `${apiTenant.substring(0, 6)}...` : '',
  });
}
