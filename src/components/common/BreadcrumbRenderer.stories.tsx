import type { Meta, StoryObj } from '@storybook/react';
import { BreadcrumbRenderer, ComparisonBreadcrumb, UserBreadcrumb, AdminBreadcrumb, InsurerBreadcrumb } from './BreadcrumbRenderer';
import { MemoryRouter } from 'react-router-dom';

const meta: Meta<typeof BreadcrumbRenderer> = {
  title: 'Common/BreadcrumbRenderer',
  component: BreadcrumbRenderer,
  parameters: {
    layout: 'centered',
    tags: ['autodocs'],
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div className="w-full max-w-4xl p-4">
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  argTypes: {
    businessType: {
      control: { type: 'select' },
      options: ['comparison', 'user', 'admin', 'insurer'],
    },
    maxItems: {
      control: { type: 'number' },
      min: 2,
      max: 10,
    },
    showHome: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    items: [
      { label: 'Accueil', href: '/' },
      { label: 'Produits', href: '/products' },
      { label: 'Assurances', href: '/products/insurance' },
      { label: 'Assurance voiture' },
    ],
  },
};

export const BusinessTypes: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Flux de comparaison</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Page d'accueil comparaison</p>
            <MemoryRouter initialEntries={['/comparer']}>
              <ComparisonBreadcrumb />
            </MemoryRouter>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Informations personnelles</p>
            <MemoryRouter initialEntries={['/comparer/informations']}>
              <ComparisonBreadcrumb />
            </MemoryRouter>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Informations véhicule</p>
            <MemoryRouter initialEntries={['/comparer/informations/vehicule']}>
              <ComparisonBreadcrumb />
            </MemoryRouter>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Espace utilisateur</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tableau de bord</p>
            <MemoryRouter initialEntries={['/tableau-de-bord']}>
              <UserBreadcrumb />
            </MemoryRouter>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Mes devis</p>
            <MemoryRouter initialEntries={['/mes-devis']}>
              <UserBreadcrumb />
            </MemoryRouter>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Détail d'un devis</p>
            <MemoryRouter initialEntries={['/mes-devis/12345']}>
              <UserBreadcrumb />
            </MemoryRouter>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Administration</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tableau de bord admin</p>
            <MemoryRouter initialEntries={['/admin']}>
              <AdminBreadcrumb />
            </MemoryRouter>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Gestion des utilisateurs</p>
            <MemoryRouter initialEntries={['/admin/utilisateurs']}>
              <AdminBreadcrumb />
            </MemoryRouter>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Détail utilisateur</p>
            <MemoryRouter initialEntries={['/admin/utilisateurs/123']}>
              <AdminBreadcrumb />
            </MemoryRouter>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Espace assureur</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Tableau de bord assureur</p>
            <MemoryRouter initialEntries={['/assureur']}>
              <InsurerBreadcrumb />
            </MemoryRouter>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Mes offres</p>
            <MemoryRouter initialEntries={['/assureur/offres']}>
              <InsurerBreadcrumb />
            </MemoryRouter>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-2">Détail d'une offre</p>
            <MemoryRouter initialEntries={['/assureur/offres/789']}>
              <InsurerBreadcrumb />
            </MemoryRouter>
          </div>
        </div>
      </div>
    </div>
  ),
};

export const LongPath: Story = {
  args: {
    maxItems: 4,
    items: [
      { label: 'Accueil', href: '/' },
      { label: 'Administration', href: '/admin' },
      { label: 'Utilisateurs', href: '/admin/users' },
      { label: 'Actifs', href: '/admin/users/active' },
      { label: 'Profils détaillés', href: '/admin/users/active/profiles' },
      { label: 'John Doe - ID 12345' },
    ],
  },
};

export const CustomItems: Story = {
  args: {
    items: [
      { label: '🏠 Accueil', href: '/' },
      { label: '📊 Analytics', href: '/analytics' },
      { label: '📈 Rapports', href: '/analytics/reports' },
      { label: 'Rapport mensuel - Octobre 2024' },
    ],
    maxItems: 5,
  },
};

export const WithoutHome: Story = {
  args: {
    showHome: false,
    items: [
      { label: 'Produits', href: '/products' },
      { label: 'Assurances', href: '/products/insurance' },
      { label: 'Assurance voiture' },
    ],
  },
};

export const SingleItem: Story = {
  args: {
    items: [
      { label: 'Accueil' },
    ],
  },
};

export const ManyItems: Story = {
  args: {
    maxItems: 3,
    items: [
      { label: 'Accueil', href: '/' },
      { label: 'Catégorie', href: '/category' },
      { label: 'Sous-catégorie', href: '/category/sub' },
      { label: 'Produits', href: '/category/sub/products' },
      { label: 'Type de produit', href: '/category/sub/products/type' },
      { label: 'Modèle spécifique', href: '/category/sub/products/type/model' },
      { label: 'Configuration finale', href: '/category/sub/products/type/model/config' },
      { label: 'Page actuelle' },
    ],
  },
};

export const Mobile: Story = {
  render: () => (
    <div className="w-full max-w-sm">
      <h3 className="text-lg font-semibold mb-4">Version mobile</h3>
      <div className="space-y-4">
        <BreadcrumbRenderer
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Produits', href: '/products' },
            { label: 'Assurance voiture' },
          ]}
        />

        <BreadcrumbRenderer
          maxItems={3}
          items={[
            { label: 'Accueil', href: '/' },
            { label: 'Administration', href: '/admin' },
            { label: 'Utilisateurs', href: '/admin/users' },
            { label: 'Gestion', href: '/admin/users/management' },
            { label: 'Page actuelle très longue' },
          ]}
        />
      </div>
    </div>
  ),
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-background text-foreground p-6 rounded-lg space-y-4">
      <h3 className="text-lg font-semibold mb-4">Mode sombre</h3>
      <BreadcrumbRenderer
        items={[
          { label: 'Accueil', href: '/' },
          { label: 'Produits', href: '/products' },
          { label: 'Assurances', href: '/products/insurance' },
          { label: 'Assurance voiture' },
        ]}
      />

      <BreadcrumbRenderer
        businessType="comparison"
      />
    </div>
  ),
};

export const Accessibility: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Tests d'accessibilité</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Les breadcrumbs sont optimisés pour l'accessibilité avec une navigation clavier et un support lecteur d'écran.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Navigation clavier</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Utilisez Tab pour naviguer entre les liens du fil d'Ariane
          </p>
          <BreadcrumbRenderer
            items={[
              { label: 'Accueil', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Support technique' },
            ]}
          />
        </div>

        <div>
          <h4 className="font-medium mb-2">Structure sémantique</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Utilisation correcte des éléments nav, ol, li et des attributs ARIA
          </p>
          <BreadcrumbRenderer
            items={[
              { label: 'Accueil', href: '/' },
              { label: 'À propos', href: '/about' },
              { label: 'Notre équipe' },
            ]}
          />
        </div>

        <div>
          <h4 className="font-medium mb-2">Contraste et lisibilité</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Les liens respectent les ratios de contraste WCAG AA
          </p>
          <BreadcrumbRenderer
            items={[
              { label: 'Accueil', href: '/' },
              { label: 'Contact', href: '/contact' },
              { label: 'Formulaire de contact' },
            ]}
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground mt-6 p-4 bg-muted rounded-lg">
        <p><strong>Points d'accessibilité vérifiés :</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Navigation au clavier complète</li>
          <li>Lecteur d'écran compatible</li>
          <li>Contraste WCAG AA respecté</li>
          <li>Structure sémantique HTML5</li>
          <li>Attributs ARIA appropriés</li>
          <li>Focus visible clair</li>
        </ul>
      </div>
    </div>
  ),
};