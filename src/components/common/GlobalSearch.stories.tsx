import type { Meta, StoryObj } from '@storybook/react';
import { GlobalSearch } from './GlobalSearch';
import { MemoryRouter } from 'react-router-dom';

const meta: Meta<typeof GlobalSearch> = {
  title: 'Common/GlobalSearch',
  component: GlobalSearch,
  parameters: {
    layout: 'fullscreen',
    tags: ['autodocs'],
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="min-h-screen bg-background p-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Page de démonstration</h1>
            <p className="text-muted-foreground mb-8">
              Appuyez sur <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">⌘K</kbd> ou{' '}
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Ctrl+K</kbd> pour ouvrir la recherche globale.
            </p>
            <Story />
          </div>
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof GlobalSearch>;

export const Default: Story = {};

export const WithInstructions: Story = {
  render: () => (
    <div className="space-y-8">
      <GlobalSearch />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Raccourcis clavier</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Ouvrir la recherche</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">⌘K</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Ouvrir la recherche (Windows)</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Ctrl+K</kbd>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Fermer la recherche</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">Echap</kbd>
            </div>
          </div>
        </div>

        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Catégories disponibles</h3>
          <ul className="space-y-2 text-sm">
            <li>📍 Navigation - Pages principales</li>
            <li>⚡ Actions rapides - Actions courantes</li>
            <li>💡 Aide et support - Documentation et aide</li>
            <li>👤 Compte - Actions utilisateur</li>
          </ul>
        </div>
      </div>

      <div className="p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Recherche intelligente</h3>
        <p className="text-sm text-muted-foreground mb-4">
          La recherche globale vous permet de trouver rapidement des pages, des actions et de l'aide.
          Tapez simplement ce que vous cherchez et sélectionnez le résultat souhaité.
        </p>
        <div className="space-y-2">
          <div className="p-3 bg-muted rounded text-sm">
            <strong>Exemples de recherche :</strong>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>• "devis" pour trouver Mes devis</li>
              <li>• "admin" pour accéder à l'administration</li>
              <li>• "aide" pour obtenir du support</li>
              <li>• "profil" pour modifier vos informations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  render: () => (
    <div className="space-y-6">
      <GlobalSearch />

      <div className="p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Version mobile</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Sur mobile, utilisez le bouton flottant en bas à droite pour accéder à la recherche globale.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-sm text-blue-800">
            <strong>Note :</strong> Le raccourci clavier ⌘K fonctionne également sur mobile si vous avez un clavier physique.
          </p>
        </div>
      </div>
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-6">
      <GlobalSearch />

      <div className="p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Accessibilité</h3>
        <p className="text-sm text-muted-foreground mb-4">
          La recherche globale est entièrement accessible et optimisée pour les lecteurs d'écran et la navigation au clavier.
        </p>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Navigation au clavier</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Utilisez Tab pour naviguer entre les résultats</li>
              <li>• Utilisez les flèches haut/bas pour sélectionner</li>
              <li>• Appuyez sur Entrée pour valider un choix</li>
              <li>• Appuyez sur Échap pour fermer</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Lecteur d'écran</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Les résultats sont correctement annoncés</li>
              <li>• Les descriptions des actions sont lues</li>
              <li>• Le nombre de résultats est communiqué</li>
              <li>• L'état actif est clairement indiqué</li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium mb-2">Contraste et lisibilité</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ratios de contraste WCAG AA respectés</li>
              <li>• Focus visible clair et net</li>
              <li>• Texte lisible en toutes circonstances</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
  },
  render: () => (
    <div className="space-y-6 dark">
      <GlobalSearch />

      <div className="p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Mode sombre</h3>
        <p className="text-sm text-muted-foreground mb-4">
          La recherche globale s'adapte automatiquement au thème sombre pour une expérience visuelle cohérente.
        </p>
        <div className="space-y-2">
          <div className="p-3 bg-muted rounded text-sm">
            Le composant utilise les variables CSS du thème pour garantir une intégration parfaite avec les modes clair et sombre.
          </div>
        </div>
      </div>
    </div>
  ),
};

export const Performance: Story = {
  render: () => (
    <div className="space-y-6">
      <GlobalSearch />

      <div className="p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-3">Optimisations de performance</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Recherche rapide</h4>
            <p className="text-sm text-muted-foreground">
              La recherche est effectuée localement pour des résultats instantanés.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Lazy loading</h4>
            <p className="text-sm text-muted-foreground">
              Le composant n'est monté que lorsque nécessaire.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">Mémoire optimisée</h4>
            <p className="text-sm text-muted-foreground">
              Les écouteurs d'événements sont correctement nettoyés.
            </p>
          </div>
        </div>
      </div>
    </div>
  ),
};