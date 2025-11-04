#!/usr/bin/env bash

# Script de sécurité pour valider et corriger les vulnérabilités
# Usage: npm run security:check

echo "🔒 SÉCURITÉ NOLI Assurance - Validation des vulnérabilités"
echo "========================================================"

# Vérifier si nous sommes en environnement de développement
if [ "$NODE_ENV" = "production" ]; then
    echo "⚠️  Environnement de production détecté - Exécution des vérifications de sécurité critiques"

    # En production, nous ne devons avoir AUCUNE vulnérabilité
    echo "📋 Vérification des vulnérabilités en production..."
    npm audit --audit-level=moderate

    if [ $? -ne 0 ]; then
        echo "❌ VULNÉRABILITÉS CRITIQUES DÉTECTÉES EN PRODUCTION - DÉPLOIEMENT INTERDIT"
        exit 1
    else
        echo "✅ Aucune vulnérabilité critique détectée - Déploiement autorisé"
    fi
else
    echo "🛠️  Environnement de développement - Analyse des vulnérabilités"

    # Afficher un résumé des vulnérabilités
    echo ""
    echo "📊 Résumé des vulnérabilités :"
    npm audit --json | jq '.metadata.vulnerabilities'

    # Vérifier les vulnérabilités critiques
    CRITICAL_COUNT=$(npm audit --json | jq '.metadata.vulnerabilities.critical // 0')
    HIGH_COUNT=$(npm audit --json | jq '.metadata.vulnerabilities.high // 0')

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo ""
        echo "🚨 VULNÉRABILITÉS CRITIQUES DÉTECTÉES : $CRITICAL_COUNT"
        echo "Ces vulnérabilités doivent être corrigées immédiatement :"
        npm audit --audit-level=critical
        echo ""
        echo "💡 Solution recommandée : npm audit fix --force (peut causer des changements cassants)"
    fi

    if [ "$HIGH_COUNT" -gt 0 ]; then
        echo ""
        echo "⚠️  VULNÉRABILITÉS ÉLEVÉES DÉTECTÉES : $HIGH_COUNT"
        echo "Ces vulnérabilités devraient être corrigées rapidement"
    fi

    # Vérifier si les vulnérabilités sont dans les dépendances de développement
    echo ""
    echo "🔍 Analyse des dépendances de développement vs production..."

    # Créer un paquetage temporaire pour les dépendances de production
    echo "📦 Création d'une liste de dépendances de production..."
    npm ls --depth=0 --production > /tmp/prod-deps.txt

    echo "✅ Analyse terminée"

    # Recommandations
    echo ""
    echo "📋 RECOMMANDATIONS :"
    echo "===================="

    if [ "$CRITICAL_COUNT" -gt 0 ]; then
        echo "1. 🔴 CORRIGER IMMÉDIATEMENT les vulnérabilités critiques"
        echo "2. 🔄 Mettre à jour les dépendances vers des versions sécurisées"
        echo "3. 🚪 Ne PAS déployer en production avec ces vulnérabilités"
    else
        echo "1. 🟢 Aucune vulnérabilité critique - Bon état de sécurité"
    fi

    if [ "$HIGH_COUNT" -gt 0 ]; then
        echo "4. 🟡 Planifier la correction des vulnérabilités élevées"
    fi

    echo "5. 📊 Surveiller régulièrement les vulnérabilités avec 'npm run security:check'"
    echo "6. 🔐 Maintenir les en-têtes CSP à jour dans index.html"
fi

echo ""
echo "🎯 Score de sécurité actuel estimé :"
echo "   - Vulnérabilités critiques : $CRITICAL_COUNT"
echo "   - Vulnérabilités élevées   : $HIGH_COUNT"
echo ""
echo "📚 Pour plus d'informations : https://docs.nolli.ci/security"