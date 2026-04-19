# Supabase Edge Functions

Ce dossier contient les Edge Functions Supabase qui servent de proxy vers l'API externe `https://api.noliassurance.ci`.

## Architecture

Les Edge Functions permettent de :
- **Masquer les clés API** côté serveur
- **Éviter les problèmes CORS**
- **Avoir un meilleur contrôle** sur les requêtes
- **Ajouter une couche d'authentification** avec Supabase
- **Loguer les requêtes** pour le debugging

## Fonctions disponibles

| Fonction | Description | Auth requise |
|----------|-------------|--------------|
| `api-proxy` | Proxy générique pour tous les endpoints | Oui |
| `quotes` | Gestion des devis | Oui |
| `offers` | Gestion des offres d'assurance | Non (public) |
| `categories` | Catégories d'assurance | Non (public) |
| `tarification` | Calcul des tarifs | Oui |

## Déploiement local

```bash
# Démarrer Supabase en local
supabase start

# Déployer les Edge Functions
supabase functions deploy api-proxy
supabase functions deploy quotes
supabase functions deploy offers
supabase functions deploy categories
supabase functions deploy tarification
```

## Déploiement en production

```bash
# Lier le projet Supabase
supabase link --project-ref YOUR_PROJECT_REF

# Déployer toutes les fonctions
supabase functions deploy --all

# Déployer une fonction spécifique
supabase functions deploy api-proxy
```

## Variables d'environnement

Les Edge Functions utilisent les variables d'environnement suivantes (à configurer dans le dashboard Supabase) :

```bash
EXTERNAL_API_TOKEN=your-external-api-token  # Token pour l'API externe (optionnel)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Ajouter une variable d'environnement

```bash
supabase secrets set EXTERNAL_API_TOKEN=your-token
```

### Lister les variables d'environnement

```bash
supabase secrets list
```

## Utilisation dans l'application

Le client API `src/api/edgeApiClient.ts` fournit des instances préconfigurées :

```typescript
import { edgeApiClients } from '@/api/edgeApiClient';

// Client générique
const response = await edgeApiClients.generic.get('/some-endpoint');

// Devis
const quotes = await edgeApiClients.quotes.get('/');
const newQuote = await edgeApiClients.quotes.post('/', quoteData);

// Offres
const offers = await edgeApiClients.offers.get('/?category=auto');

// Catégories
const categories = await edgeApiClients.categories.get('/');

// Tarification
const price = await edgeApiClients.tarification.post('/calculate', {
  category: 'auto',
  coverage: 'all-risk',
  vehicleValue: 5000000,
});
```

## Mode de configuration

Dans `.env.local`, configurez le mode API :

```bash
# Mode par défaut (recommandé)
VITE_API_MODE=edge

# Mode direct (fallback)
# VITE_API_MODE=direct
```

## Logs

Les logs des Edge Functions sont disponibles via :

```bash
# Logs en temps réel
supabase functions logs api-proxy

# Logs avec suivi
supabase functions logs api-proxy --follow
```

## Structure d'une Edge Function

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req: Request) => {
  // 1. Gestion CORS
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

  // 2. Authentification Supabase (optionnel)
  // 3. Forwarding vers l'API externe
  // 4. Transformation de la réponse
});
```

## Ajouter une nouvelle Edge Function

1. Créer un dossier dans `supabase/functions/` :
   ```bash
   mkdir supabase/functions/my-function
   ```

2. Créer `supabase/functions/my-function/index.ts`

3. Déployer :
   ```bash
   supabase functions deploy my-function
   ```

4. Ajouter une instance dans `src/api/edgeApiClient.ts` :
   ```typescript
   myFunction: new EdgeApiClient('my-function'),
   ```
