// Edge Function: API Proxy
// Proxy les requêtes vers l'API externe https://api.noliassurance.ci

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Configuration
const API_BASE_URL = 'https://api.noliassurance.ci';
const API_VERSION = 'v1';

// Types pour les requêtes
interface ProxyRequest {
  method: string;
  path: string;
  headers?: Record<string, string>;
  body?: any;
  queryParams?: Record<string, string>;
}

interface ProxyResponse {
  success: boolean;
  data?: any;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

// Fonction utilitaire pour construire l'URL avec query params
function buildUrl(path: string, queryParams?: Record<string, string>): string {
  const url = new URL(`${API_BASE_URL}${API_VERSION}${path}`);

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  return url.toString();
}

// Fonction utilitaire pour transformer les headers
function transformHeaders(
  requestHeaders: Headers,
  customHeaders?: Record<string, string>
): Headers {
  const headers = new Headers();

  // Copier les headers de la requête (sauf host et auth)
  for (const [key, value] of requestHeaders.entries()) {
    if (!['host', 'authorization'].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  }

  // Headers par défaut
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');

  // Ajouter les headers personnalisés
  if (customHeaders) {
    Object.entries(customHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  return headers;
}

// Fonction utilitaire pour créer la réponse JSON
function createJsonResponse(
  data: ProxyResponse,
  status: number = 200
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Fonction utilitaire pour gérer les erreurs
function handleError(error: Error, status: number = 500): Response {
  const errorResponse: ProxyResponse = {
    success: false,
    message: error.message || 'Une erreur est survenue',
    timestamp: new Date().toISOString(),
  };

  return createJsonResponse(errorResponse, status);
}

// Fonction CORS pour les options pré-flight
function handleCorsRequest(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// Handler principal
serve(async (req: Request) => {
  console.log(`[API Proxy] ${req.method} ${req.url}`);

  // Gérer les requêtes CORS pré-flight
  if (req.method === 'OPTIONS') {
    return handleCorsRequest();
  }

  try {
    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return handleError(new Error('Non authentifié'), 401);
    }

    // Initialiser le client Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier le token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return handleError(new Error('Token invalide'), 401);
    }

    // Extraire le chemin et la méthode
    const url = new URL(req.url);
    const pathname = url.pathname.replace('/functions/v1/api-proxy', '');

    // Extraire les query params
    const queryParams: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });

    // Préparer les headers pour la requête proxy
    const proxyHeaders = new Headers();
    proxyHeaders.set('Content-Type', 'application/json');
    proxyHeaders.set('Accept', 'application/json');
    proxyHeaders.set('User-Agent', 'NOLI-Edge-Function/1.0');

    // Ajouter l'auth token si nécessaire pour l'API externe
    const externalApiToken = Deno.env.get('EXTERNAL_API_TOKEN');
    if (externalApiToken) {
      proxyHeaders.set('Authorization', `Bearer ${externalApiToken}`);
    }

    // Préparer le corps de la requête
    let body: BodyInit | undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const contentType = req.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        body = JSON.stringify(await req.json());
      } else if (contentType?.includes('multipart/form-data')) {
        body = await req.blob();
      }
    }

    // Construire l'URL de l'API externe (inclut le segment /v1)
    const versionedPath = pathname.startsWith(`/${API_VERSION}`) ? pathname : `/${API_VERSION}${pathname}`;
    const externalUrl = `${API_BASE_URL}${versionedPath}`;

    console.log(`[API Proxy] Forwarding to: ${externalUrl}`);
    console.log(`[API Proxy] Method: ${req.method}`);
    console.log(`[API Proxy] User: ${user.id}`);

    // Faire la requête à l'API externe
    const response = await fetch(externalUrl, {
      method: req.method,
      headers: proxyHeaders,
      body,
    });

    // Récupérer la réponse
    const responseData = await response.text();
    let data: any;
    const contentType = response.headers.get('content-type') || '';

    // Parser la réponse selon le type de contenu
    if (contentType.includes('application/json')) {
      try {
        data = JSON.parse(responseData);
      } catch {
        data = responseData;
      }
    } else {
      data = responseData;
    }

    // Préparer la réponse proxy
    const proxyResponse: ProxyResponse = {
      success: response.ok,
      data: response.ok ? data : undefined,
      message: !response.ok ? (data?.message || 'Erreur API externe') : undefined,
      errors: data?.errors,
      timestamp: new Date().toISOString(),
    };

    // Retourner la réponse avec le statut approprié
    return createJsonResponse(proxyResponse, response.status);

  } catch (error) {
    console.error('[API Proxy] Error:', error);

    // Gérer les erreurs de parsing JSON
    if (error instanceof SyntaxError) {
      return handleError(error, 400);
    }

    // Erreur générique
    return handleError(error as Error, 500);
  }
});
