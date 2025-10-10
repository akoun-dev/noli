#!/bin/bash

# ========================================
# 🚀 SCRIPT DE CONFIGURATION ENVIRONNEMENT
# ========================================

echo "🔧 Configuration de l'environnement NOLI Assurance..."

# Couleurs pour le output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonctions utilitaires
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Vérifier si Node.js est installé
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

print_success "Node.js est installé: $(node --version)"

# Vérifier si npm est installé
if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé. Veuillez l'installer d'abord."
    exit 1
fi

print_success "npm est installé: $(npm --version)"

# Créer les fichiers d'environnement s'ils n'existent pas
ENV_FILES=(".env.local" ".env.staging" ".env.production")

for env_file in "${ENV_FILES[@]}"; do
    if [ ! -f "$env_file" ]; then
        print_warning "Le fichier $env_file n'existe pas. Création d'un template..."

        case $env_file in
            ".env.local")
                cat > "$env_file" << EOF
# ======================================
# 🔒 CONFIGURATION DÉVELOPPEMENT - NOLI ASSURANCE
# ======================================

# 🔧 Configuration Supabase (Backend BaaS)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 🚀 Configuration de l'application
VITE_APP_NAME=NOLI Assurance
VITE_APP_VERSION=1.0.0
VITE_APP_DESCRIPTION=Plateforme de comparaison d'assurances auto
VITE_APP_URL=http://localhost:8080

# 📧 Configuration des emails
VITE_EMAIL_FROM=noreply@noli.ci
VITE_EMAIL_SUPPORT=support@noli.ci

# 🛡️ Configuration Sentry (Monitoring)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id
VITE_SENTRY_ENVIRONMENT=development

# 🌐 Mode de l'application
VITE_NODE_ENV=development
VITE_MODE=development
EOF
                ;;
            ".env.staging")
                cat > "$env_file" << EOF
# ======================================
# 🧪 CONFIGURATION STAGING - NOLI ASSURANCE
# ======================================

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=NOLI Assurance (Staging)
VITE_APP_VERSION=1.0.0-staging
VITE_APP_URL=https://staging.noli.ci
VITE_NODE_ENV=production
VITE_MODE=staging
VITE_SENTRY_ENVIRONMENT=staging
EOF
                ;;
            ".env.production")
                cat > "$env_file" << EOF
# ======================================
# 🚀 CONFIGURATION PRODUCTION - NOLI ASSURANCE
# ======================================

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=NOLI Assurance
VITE_APP_VERSION=1.0.0
VITE_APP_URL=https://noli.ci
VITE_NODE_ENV=production
VITE_MODE=production
VITE_SENTRY_ENVIRONMENT=production
EOF
                ;;
        esac

        print_success "Fichier $env_file créé avec succès"
    else
        print_success "Le fichier $env_file existe déjà"
    fi
done

# Installer les dépendances
print_info "Installation des dépendances..."
npm install

if [ $? -eq 0 ]; then
    print_success "Dépendances installées avec succès"
else
    print_error "Erreur lors de l'installation des dépendances"
    exit 1
fi

# Vérifier la configuration Sentry
print_info "Configuration de Sentry..."

if [ ! -f ".sentryclirc" ]; then
    cat > .sentryclirc << EOF
# Configuration Sentry pour NOLI Assurance
[defaults]
org = noli-assurance
project = noli-frontend

[auth]
token = \${SENTRY_AUTH_TOKEN}

[projects]
noli-frontend = \${SENTRY_PROJECT_ID}
EOF
    print_success "Configuration Sentry créée (.sentryclirc)"
else
    print_success "Configuration Sentry existe déjà"
fi

# Créer les scripts de déploiement
print_info "Création des scripts de déploiement..."

cat > scripts/deploy-staging.sh << 'EOF'
#!/bin/bash
echo "🚀 Déploiement en staging..."

# Build pour staging
npm run build

# Upload sur le serveur staging
echo "Upload du build sur le serveur staging..."
# rsync -avz dist/ user@staging-server:/var/www/noli-staging/

echo "✅ Déploiement staging terminé"
EOF

cat > scripts/deploy-production.sh << 'EOF'
#!/bin/bash
echo "🚀 Déploiement en production..."

# Build pour production
npm run build

# Upload sur le serveur production
echo "Upload du build sur le serveur production..."
# rsync -avz dist/ user@production-server:/var/www/noli/

echo "✅ Déploiement production terminé"
EOF

chmod +x scripts/deploy-staging.sh scripts/deploy-production.sh
print_success "Scripts de déploiement créés"

# Vérifier les tests
print_info "Vérification des tests..."
npm run test:run

if [ $? -eq 0 ]; then
    print_success "Tests passés avec succès"
else
    print_warning "Certains tests ont échoué. Veuillez les corriger avant le déploiement."
fi

# Afficher le résumé
echo ""
echo "🎉 Configuration terminée avec succès!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Configurez vos variables d'environnement dans .env.local"
echo "2. Configurez votre projet Sentry: https://sentry.io"
echo "3. Lancez le serveur de développement: npm run dev"
echo "4. Exécutez les tests: npm run test:run"
echo "5. Build de production: npm run build"
echo ""
echo "📚 Documentation:"
echo "- Guide de développement: docs/DEVELOPMENT.md"
echo "- Architecture technique: docs/ARCHITECTURE.md"
echo "- Tests: npm run test:coverage"
echo ""
echo "🚀 Bon développement! 🎯"