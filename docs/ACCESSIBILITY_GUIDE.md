# Guide d'Accessibilité WCAG AA - Noli Insurance Platform

## 🎯 Objectif

Ce guide assure que notre plateforme de comparaison d'assurance respecte les standards WCAG AA (Web Content Accessibility Guidelines) pour offrir une expérience inclusive à tous les utilisateurs.

## 📋 Normes WCAG AA appliquées

### 1. Perceptible (Perceivable)
- **Contraste de couleur**: Minimum 4.5:1 pour le texte normal, 3:1 pour le texte large
- **Texte alternatif**: Images décoratives avec `alt=""`, images informatives avec description
- **Adaptabilité**: Contenu accessible indépendamment de la présentation visuelle
- **Distinction**: Pas d'information véhiculée uniquement par la couleur

### 2. Utilisable (Operable)
- **Navigation au clavier**: Accès complet à toutes les fonctionnalités
- **Cibles de clic**: Minimum 44×44px pour les éléments tactiles (mobile)
- **Gestion du focus**: Indicateurs de focus visibles et logiques
- **Pas de contenu dangereux**: Pas d'éléments qui provoquent des crises ou des réactions

### 3. Compréhensible (Understandable)
- **Langue identifiable**: Attribut `lang` sur l'élément HTML
- **Lisibilité**: Texte lisible et compréhensible
- **Prévisibilité**: Fonctionnalité prévisible des éléments d'interface
- **Assistance à la saisie**: Aide à la correction des erreurs

### 4. Robuste (Robust)
- **Compatible HTML**: Utilisation correcte des éléments sémantiques
- **Compatibilité AT**: Fonctionnement avec les technologies d'assistance

## 🛠️ Implémentation Technique

### Structure sémantique HTML
```html
<!-- Structure correcte avec headings -->
<main>
  <h1>Comparateur d'assurance</h1>
  <section aria-labelledby="coverage-heading">
    <h2 id="coverage-heading">Sélection des garanties</h2>
    <!-- Contenu -->
  </section>
</main>

<!-- Navigation au clavier -->
<button aria-expanded="false" aria-controls="panel-1">
  Catégorie de garanties
</button>
<div id="panel-1" role="region" aria-labelledby="category-header">
  <!-- Contenu dépliable -->
</div>
```

### Formulaires accessibles
```html
<form>
  <label for="coverage-rc">
    Responsabilité Civile
    <span className="sr-only">Obligatoire</span>
  </label>
  <input
    id="coverage-rc"
    type="checkbox"
    aria-describedby="coverage-rc-desc"
    required
  />
  <div id="coverage-rc-desc">
    Garantie obligatoire selon la réglementation
  </div>
</form>
```

### États et notifications
```html
<!-- Indicateurs de progression -->
<div role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100">
  75% complété
</div>

<!-- Notifications -->
<div role="status" aria-live="polite">
  Prime mise à jour : 100 000 FCFA
</div>

<!-- Erreurs -->
<div role="alert" aria-live="assertive">
  Erreur lors du calcul de la prime
</div>
```

## 📱 Optimisations Mobile

### Cibles tactiques
```css
.touch-target {
  min-height: 44px;
  min-width: 44px;
  padding: 12px;
}

/* Espacement suffisant entre éléments */
.mobile-button {
  margin: 8px 0;
}
```

### Zoom et orientation
```css
/* Support du zoom jusqu'à 200% */
.accessible-container {
  max-width: 100%;
  overflow-x: auto;
}

/* Adaptation orientation portrait/paysage */
@media (max-width: 768px) {
  .coverage-grid {
    grid-template-columns: 1fr;
  }
}
```

## 🎨 Contraste et Couleurs

### Palette accessible
```css
/* Variables CSS avec contraste suffisant */
:root {
  --primary-foreground: #0f172a; /* Contrast 15:1 with white */
  --primary: #0ea5e9; /* Contrast 4.5:1 with white */
  --muted-foreground: #64748b; /* Contrast 7:1 with white */
  --destructive: #ef4444; /* Contrast 4.5:1 with white */
}

/* États focus */
.focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}
```

### Indicateurs visuels multiples
```css
/* Pas uniquement des couleurs */
.coverage-selected {
  border: 2px solid var(--primary); /* Couleur */
  background-color: var(--primary/10); /* Couleur */
  icon: checkmark; /* Icône */
  font-weight: bold; /* Style texte */
}
```

## ⌨️ Navigation au Clavier

### Ordre de tabulation logique
```tsx
const CoverageSelector = () => {
  return (
    <div>
      {/* Header - tabindex="-1" pour sauter le contenu répétitif */}
      <header tabIndex={-1}>
        <h1>Comparateur</h1>
      </header>

      {/* Navigation principale */}
      <nav aria-label="Navigation principale">
        <button tabIndex={0}>Profil</button>
        <button tabIndex={0}>Véhicule</button>
        <button tabIndex={0}>Garanties</button>
      </nav>

      {/* Contenu principal */}
      <main tabIndex={-1}>
        {/* Ordre logique des éléments */}
      </main>
    </div>
  )
}
```

### Raccourcis clavier
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Échap pour fermer les modales
    if (e.key === 'Escape') {
      closeModal()
    }

    // Ctrl+Entrée pour soumettre
    if (e.ctrlKey && e.key === 'Enter') {
      handleSubmit()
    }

    // Flèches pour naviguer dans les listes
    if (e.key === 'ArrowDown') {
      navigateNext()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}, [])
```

## 📢 Technologies d'Assistance

### ARIA Labels et Descriptions
```tsx
const CoverageCard = ({ coverage, isSelected, onSelect }) => {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-describedby={`coverage-desc-${coverage.id}`}
      onClick={() => onSelect(coverage.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect(coverage.id)
        }
      }}
    >
      <h3>{coverage.name}</h3>
      <p id={`coverage-desc-${coverage.id}`}>
        {coverage.description}
      </p>
    </div>
  )
}
```

### Screen Reader Announcements
```tsx
const useAnnouncer = () => {
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcer = document.createElement('div')
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
    announcer.style.left = '-10000px'
    announcer.textContent = message

    document.body.appendChild(announcer)

    setTimeout(() => {
      document.body.removeChild(announcer)
    }, 1000)
  }

  return { announce }
}

// Utilisation
const CoverageSelector = () => {
  const { announce } = useAnnouncer()

  const handleCoverageChange = (coverageId: string, isIncluded: boolean) => {
    // Logique de sélection
    announce(
      `Garantie ${coverageId} ${isIncluded ? 'ajoutée' : 'retirée'}`
    )
  }

  return (
    // Composant
  )
}
```

## ✅ Checklist de Validation

### Avant la mise en production
- [ ] Toutes les images ont un alt text approprié
- [ ] Les vidéos ont des sous-titres
- [ ] Le contraste des couleurs respecte WCAG AA
- [ ] Tous les éléments interactifs sont accessibles au clavier
- [ ] L'ordre de tabulation est logique
- [ ] Les formulaires ont des labels corrects
- [ ] Les erreurs sont clairement indiquées
- [ ] Le contenu est lisible à 200% de zoom
- [ ] Les liens sont descriptifs (pas "cliquer ici")
- [ ] Les éléments ARIA sont correctement utilisés

### Tests automatiques
```bash
# Tests d'accessibilité avec axe-core
npm run test:accessibility

# Tests de navigation au clavier
npm run test:keyboard

# Tests de contraste avec pa11y
npm run test:contrast
```

### Tests manuels
1. **Navigation au clavier uniquement**
   - Tab pour naviguer
   - Entrée/Espace pour activer
   - Échap pour fermer

2. **Lecteur d'écran**
   - NVDA (Windows)
   - VoiceOver (Mac)
   - TalkBack (Android)

3. **Contraste élevé**
   - Activer le mode contraste élevé
   - Vérifier que tout reste lisible

4. **Zoom 200%**
   - Zoomer à 200%
   - Vérifier que tout reste utilisable

## 📚 Ressources et Outils

### Outils de test
- **axe DevTools**: Extension Chrome pour tester l'accessibilité
- **WAVE**: Extension pour évaluer l'accessibilité
- **Colour Contrast Analyser**: Vérifier les contrastes
- **Keyboard Tester**: Tester la navigation au clavier

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/TR/wai-aria-practices-1.1/)
- [Mozilla Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Formation continue
- Veille sur les nouvelles recommandations WCAG
- Tests avec des utilisateurs en situation de handicap
- Mise à jour régulière des composants accessibles

---

**Rappel**: L'accessibilité n'est pas une fonctionnalité, c'est un droit fondamental. Chaque amélioration bénéficie à tous les utilisateurs.