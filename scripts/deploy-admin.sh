#!/bin/bash

# ============================================
# SCRIPT DE DÉPLOIEMENT MODULE ADMIN
# ============================================

set -e  # Arrêter le script en cas d'erreur

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log() {
    echo -e "${NC}$1${NC}"
}

log_step() {
    echo -e "\n${CYAN}📋 ÉTAPE $1${NC}"
    echo -e "${CYAN}================================================${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

log_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

log_header() {
    echo -e "\n${MAGENTA}🚀 DÉPLOIEMENT MODULE ADMIN NOLI ASSURANCE${NC}"
    echo -e "${MAGENTA}================================================${NC}"
}

# Vérification des prérequis
check_prerequisites() {
    log_step 1
    log "Vérification des prérequis..."

    # Vérifier Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js n'est pas installé"
        exit 1
    fi
    log_success "Node.js $(node --version) trouvé"

    # Vérifier npm
    if ! command -v npm &> /dev/null; then
        log_error "npm n'est pas installé"
        exit 1
    fi
    log_success "npm $(npm --version) trouvé"

    # Vérifier les variables d'environnement
    if [ ! -f ".env.local" ]; then
        log_warning "Fichier .env.local non trouvé"
        if [ -f ".env.example" ]; then
            log_info "Copie de .env.example vers .env.local"
            cp .env.example .env.local
            log_warning "Veuillez configurer les variables Supabase dans .env.local"
            exit 1
        else
            log_error "Fichier .env.example non trouvé"
            exit 1
        fi
    fi

    # Vérifier les variables Supabase
    source .env.local
    if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
        log_error "Variables Supabase manquantes dans .env.local"
        exit 1
    fi
    log_success "Variables d'environnement configurées"
}

# Installation des dépendances
install_dependencies() {
    log_step 2
    log "Installation des dépendances..."

    npm ci
    log_success "Dépendances installées"
}

# Vérification du code
check_code() {
    log_step 3
    log "Vérification du code..."

    # ESLint
    log_info "Exécution d'ESLint..."
    npm run lint || {
        log_warning "ESLint a détecté des erreurs"
        read -p "Continuer quand même? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }

    # TypeScript
    log_info "Vérification TypeScript..."
    npx tsc --noEmit || {
        log_error "Erreurs TypeScript détectées"
        exit 1
    }

    log_success "Code vérifié"
}

# Build de l'application
build_application() {
    log_step 4
    log "Build de l'application..."

    npm run build
    log_success "Build terminé"
}

# Tests
run_tests() {
    log_step 5
    log "Exécution des tests..."

    # Tests unitaires
    log_info "Tests unitaires..."
    npm run test:run || {
        log_warning "Certains tests unitaires ont échoué"
        read -p "Continuer quand même? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }

    # Tests d'intégration admin
    log_info "Tests d'intégration admin..."
    node scripts/test-admin-integration.js || {
        log_error "Tests d'intégration admin échoués"
        exit 1
    }

    log_success "Tests réussis"
}

# Migration de la base de données
migrate_database() {
    log_step 6
    log "Migration de la base de données..."

    # Vérifier si nous avons les fichiers de migration
    if [ -f "migrations/admin_rpc_functions.sql" ]; then
        log_info "Application des migrations RPC admin..."
        log_warning "Cette étape nécessite un accès admin à Supabase"
        log_info "Veuillez appliquer manuellement les fichiers suivants dans la console Supabase:"
        log_info "  1. migrations/admin_audit_tables.sql"
        log_info "  2. migrations/admin_rpc_functions.sql"

        read -p "Les migrations ont-elles été appliquées? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "Veuillez appliquer les migrations avant de continuer"
            exit 1
        fi
    else
        log_warning "Fichiers de migration non trouvés"
    fi

    log_success "Migration terminée"
}

# Backup avant déploiement
create_backup() {
    log_step 7
    log "Création d'une sauvegarde..."

    BACKUP_DIR="backups/admin-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    # Backup des fichiers importants
    cp -r src/features/admin "$BACKUP_DIR/"
    cp -r src/pages/admin "$BACKUP_DIR/"
    cp -r src/layouts/AdminLayout.tsx "$BACKUP_DIR/" 2>/dev/null || true
    cp src/types/admin.d.ts "$BACKUP_DIR/" 2>/dev/null || true

    log_success "Sauvegarde créée dans $BACKUP_DIR"
}

# Déploiement
deploy_application() {
    log_step 8
    log "Déploiement de l'application..."

    # Simulation de déploiement (remplacer par votre logique de déploiement réelle)
    log_info "Préparation du déploiement..."

    # Vérifier que le build est présent
    if [ ! -d "dist" ]; then
        log_error "Dossier dist non trouvé. Le build a échoué."
        exit 1
    fi

    log_info "Application optimisée pour la production"
    log_info "Dashboard admin prêt à être déployé"

    log_success "Déploiement simulé réussi"
    log_info "Pour un déploiement réel, adaptez cette section avec:"
    log_info "  - Upload vers votre serveur"
    log_info "  - Configuration du reverse proxy"
    log_info "  - Configuration SSL"
    log_info "  - Redémarrage des services"
}

# Validation du déploiement
validate_deployment() {
    log_step 9
    log "Validation du déploiement..."

    # Vérifier que les fichiers essentiels sont présents
    ESSENTIAL_FILES=(
        "dist/index.html"
        "dist/assets"
        "src/features/admin"
        "src/pages/admin"
    )

    for file in "${ESSENTIAL_FILES[@]}"; do
        if [ -e "$file" ]; then
            log_success "$file trouvé"
        else
            log_error "$file manquant"
            exit 1
        fi
    done

    # Vérifier la taille du build
    BUILD_SIZE=$(du -sh dist | cut -f1)
    log_info "Taille du build: $BUILD_SIZE"

    log_success "Déploiement validé"
}

# Nettoyage
cleanup() {
    log_step 10
    log "Nettoyage..."

    # Nettoyer les fichiers temporaires
    rm -rf node_modules/.cache
    rm -rf .nyc_output
    rm -rf coverage

    log_success "Nettoyage terminé"
}

# Affichage des instructions post-déploiement
post_deployment_instructions() {
    log_header
    log "🎉 DÉPLOIEMENT ADMIN TERMINÉ AVEC SUCCÈS!", 'green'
    log "================================================", 'green'

    log "\n📋 Prochaines étapes:", 'blue'
    log "1. Redémarrez votre serveur web", 'blue'
    log "2. Accédez au dashboard admin: /admin", 'blue'
    log "3. Vérifiez que toutes les fonctionnalités fonctionnent", 'blue'
    log "4. Testez les notifications temps réel", 'blue'
    log "5. Vérifiez les graphiques analytics", 'blue'

    log "\n🔧 Configuration recommandée:", 'yellow'
    log "- Configurez un cron job pour les sauvegardes automatiques", 'yellow'
    log "- Mettez en place le monitoring des performances", 'yellow'
    log "- Configurez les alertes email pour les admins", 'yellow'
    log "- Activez le logging des erreurs", 'yellow'

    log "\n📚 Documentation:", 'magenta'
    log "- Docs API: /docs/api", 'magenta'
    log "- Dashboard Admin: /admin", 'magenta'
    log "- Monitoring: /admin/supervision", 'magenta'

    log "\n✨ Bonne utilisation du module Admin NOLI!", 'green'
}

# Gestion des erreurs
handle_error() {
    log_error "Une erreur est survenue pendant le déploiement"
    log_error "Arrêt du script"

    # Afficher le dernier message d'erreur
    if [ $? -ne 0 ]; then
        log_error "Code de sortie: $?"
    fi

    exit 1
}

# Piéger les erreurs
trap handle_error ERR

# Fonction principale
main() {
    log_header

    check_prerequisites
    install_dependencies
    check_code
    build_application
    run_tests
    migrate_database
    create_backup
    deploy_application
    validate_deployment
    cleanup

    post_deployment_instructions
}

# Exécution
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi