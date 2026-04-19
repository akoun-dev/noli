import { test as base, expect } from '@playwright/test';

// Types pour les fixtures
type UserCredentials = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

type AuthFixtures = {
  authenticatedUser: UserCredentials;
  insurerUser: UserCredentials;
  adminUser: UserCredentials;
  loginAsUser: (user: UserCredentials) => Promise<void>;
  logout: () => Promise<void>;
};

// Extension des fixtures de base avec les fixtures d'authentification
export const test = base.extend<AuthFixtures>({
  // Données de test pour différents types d'utilisateurs
  authenticatedUser: [
    {
      email: 'user.test@example.com',
      password: 'Password123',
      firstName: 'Utilisateur',
      lastName: 'Test',
    },
    { scope: 'worker' }
  ],

  insurerUser: [
    {
      email: 'insurer.test@example.com',
      password: 'Password123',
      firstName: 'Assureur',
      lastName: 'Test',
    },
    { scope: 'worker' }
  ],

  adminUser: [
    {
      email: 'admin.test@example.com',
      password: 'Password123',
      firstName: 'Admin',
      lastName: 'Test',
    },
    { scope: 'worker' }
  ],

  // Fixture pour se connecter en tant qu'utilisateur
  loginAsUser: async ({ page }, use) => {
    const login = async (user: UserCredentials) => {
      // Aller à la page de connexion
      await page.goto('/auth/connexion');

      // Remplir le formulaire de connexion
      await page.fill('input[name="email"]', user.email);
      await page.fill('input[name="password"]', user.password);

      // Soumettre le formulaire
      await page.click('button[type="submit"]');

      // Attendre la redirection vers le tableau de bord
      await expect(page).toHaveURL(/\/tableau-de-bord/, { timeout: 10000 });

      // Vérifier que l'utilisateur est connecté
      await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    };

    await use(login);
  },

  // Fixture pour se déconnecter
  logout: async ({ page }, use) => {
    const logoutUser = async () => {
      // Ouvrir le menu utilisateur
      await page.click('[data-testid="user-menu"]');

      // Cliquer sur le bouton de déconnexion
      await page.click('[data-testid="logout-button"]');

      // Attendre la redirection vers la page d'accueil
      await expect(page).toHaveURL('/', { timeout: 10000 });

      // Vérifier que l'utilisateur n'est plus connecté
      await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
    };

    await use(logoutUser);
  },
});

export { expect };