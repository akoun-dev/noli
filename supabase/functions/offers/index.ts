// Edge Function: Offers (Offres d'assurance)
// Gestion des offres d'assurance

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const API_BASE_URL = 'https://api.noliassurance.ci/v1';

serve(async (req: Request) => {
  console.log(`[Offers] ${req.method} ${req.url}`);

  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Auth (optional for public offers)
    const authHeader = req.headers.get('Authorization');

    // Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let user = null;
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
      if (!authError && authUser) {
        user = authUser;
      }
    }

    // Extract path and query params
    const url = new URL(req.url);
    const pathname = url.pathname.replace('/functions/v1/offers', '');
    const queryString = url.search;

    // Prepare headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('User-Agent', 'NOLI-Offers/1.0');

    const externalApiToken = Deno.env.get('EXTERNAL_API_TOKEN');
    if (externalApiToken) {
      headers.set('Authorization', `Bearer ${externalApiToken}`);
    }

    // Prepare body
    let body: BodyInit | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      body = JSON.stringify(await req.json());
    }

    // Forward request
    const externalUrl = `${API_BASE_URL}/offers${pathname}${queryString}`;
    console.log(`[Offers] Forwarding to: ${externalUrl}`);

    const response = await fetch(externalUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseData = await response.text();
    const data = response.headers.get('content-type')?.includes('application/json')
      ? JSON.parse(responseData)
      : responseData;

    const proxyResponse = {
      success: response.ok,
      data: response.ok ? data : undefined,
      message: !response.ok ? (data?.message || 'Erreur API') : undefined,
      errors: data?.errors,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(proxyResponse), {
      status: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('[Offers] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
