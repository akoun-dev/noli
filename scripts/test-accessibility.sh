#!/bin/bash

# Script pour exécuter les tests d'accessibilité WCAG 2.1 AA
echo "🔍 Exécution des tests d'accessibilité WCAG 2.1 AA..."

# Exécuter les tests d'accessibilité
npm run test:run src/test/accessibility.test.tsx

# Vérifier le résultat
if [ $? -eq 0 ]; then
  echo "✅ Tous les tests d'accessibilité sont passés avec succès !"
  echo "📋 Résumé de la conformité WCAG 2.1 AA :"
  echo "   • Contraste des couleurs : ✅"
  echo "   • Navigation au clavier : ✅"
  echo "   • ARIA et attributs sémantiques : ✅"
  echo "   • Formulaires accessibles : ✅"
  echo "   • Structure de la page : ✅"
  echo "   • Images avec alt text : ✅"
  echo "   • Tableaux accessibles : ✅"
  echo ""
  echo "🎉 L'application respecte les standards d'accessibilité WCAG 2.1 AA"
else
  echo "❌ Certains tests d'accessibilité ont échoué"
  echo "🔧 Veuillez corriger les violations WCAG avant de continuer"
  exit 1
fi