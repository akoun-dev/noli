#!/bin/bash

# Script pour tester l'authentification des utilisateurs avec curl
# Utilise l'API REST de Supabase pour tester les comptes créés

echo "=== TEST D'AUTHENTIFICATION DES UTILISATEURS ==="
echo ""

# URL de l'API Supabase (remplacez par votre URL)
SUPABASE_URL="${SUPABASE_URL:-https://your-project.supabase.co}"
# Clé API anonyme (remplacez par votre clé)
ANON_KEY="${SUPABASE_ANON_KEY:-your-anon-key-here}"

# Vérifier que les variables sont configurées
if [[ "$SUPABASE_URL" == "https://your-project.supabase.co" ]] || [[ "$ANON_KEY" == "your-anon-key-here" ]]; then
    echo "❌ Erreur: Veuillez configurer les variables d'environnement:"
    echo "   export SUPABASE_URL='https://votre-projet.supabase.co'"
    echo "   export SUPABASE_ANON_KEY='votre-clé-anonyme'"
    echo ""
    echo "Ou créez un fichier .env.local avec ces variables."
    exit 1
fi

# Fonction pour tester la connexion d'un utilisateur
test_user() {
    local email=$1
    local password=$2
    local role=$3

    echo "Test de l'utilisateur: $email ($role)"

    response=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/token?grant_type=password" \
        -H "apikey: ${ANON_KEY}" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"${password}\"}")

    # Vérifier si la réponse contient un token d'accès
    if echo "$response" | grep -q "access_token"; then
        echo "✅ Connexion réussie pour $email"

        # Extraire l'ID utilisateur
        user_id=$(echo "$response" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo "   ID: $user_id"

        # Extraire le rôle
        user_role=$(echo "$response" | grep -o '"role":"[^"]*' | cut -d'"' -f4)
        echo "   Rôle: $user_role"
    else
        echo "❌ Erreur de connexion pour $email"
        echo "   Réponse: $response"
    fi

    echo ""
}

# Tester les trois types d'utilisateurs avec le mot de passe standardisé
test_user "user@noli.com" "NoliTest2024!" "USER"
test_user "insurer@noli.com" "NoliTest2024!" "INSURER"
test_user "admin@noli.com" "NoliTest2024!" "ADMIN"

echo "=== TEST TERMINÉ ==="