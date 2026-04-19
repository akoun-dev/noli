// Edge Function: Categories
// Gestion des catégories d'assurance

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const API_BASE_URL = 'https://api.noliassurance.ci/v1';

serve(async (req: Request) => {
  console.log(`[Categories] ${req.method} ${req.url}`);

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
    // Extract path and query params
    const url = new URL(req.url);
    const pathname = url.pathname.replace('/functions/v1/categories', '');
    const queryString = url.search;

    // Prepare headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('Accept', 'application/json');
    headers.set('User-Agent', 'NOLI-Categories/1.0');

    const externalApiToken = Deno.env.get('EXTERNAL_API_TOKEN');
    if (externalApiToken) {
      headers.set('Authorization', `Bearer ${externalApiToken}`);
    }

    // Forward request (GET only for categories)
    const externalUrl = `${API_BASE_URL}/categories${pathname}${queryString}`;
    console.log(`[Categories] Forwarding to: ${externalUrl}`);

    const response = await fetch(externalUrl, {
      method: req.method,
      headers,
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
    console.error('[Categories] Error:', error);
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
