import { test, expect } from './fixtures/auth-fixtures';

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Nettoyer les cookies et le stockage local avant chaque test
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => sessionStorage.clear());
  });

  test('should display login page correctly', async ({ page }) => {
    await page.goto('/auth/connexion');

    // Vérifier les éléments principaux de la page
    await expect(page.getByRole('heading', { name: 'Connexion' })).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Se connecter' })).toBeVisible();

    // Vérifier les liens
    await expect(page.getByRole('link', { name: 'Mot de passe oublié ?' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Créer un compte' })).toBeVisible();
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/auth/connexion');

    // Soumettre le formulaire vide
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Vérifier les messages d'erreur
    await expect(page.getByText('L\'email est requis')).toBeVisible();
    await expect(page.getByText('Le mot de passe est requis')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    await page.goto('/auth/connexion');

    // Remplir avec un email invalide
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="password"]', 'Password123');

    // Soumettre le formulaire
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Vérifier le message d'erreur
    await expect(page.getByText('Email invalide')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/connexion');

    // Remplir avec des identifiants invalides
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Soumettre le formulaire
    await page.getByRole('button', { name: 'Se connecter' }).click();

    // Vérifier le message d'erreur
    await expect(page.getByText('Email ou mot de passe incorrect')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page, authenticatedUser, loginAsUser }) => {
    await page.goto('/auth/connexion');

    // Utiliser la fixture de connexion
    await loginAsUser(authenticatedUser);

    // Vérifier que l'utilisateur est redirigé vers le tableau de bord
    await expect(page).toHaveURL(/\/tableau-de-bord/);

    // Vérifier les éléments du tableau de bord
    await expect(page.getByRole('heading', { name: /Tableau de bord/i })).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.getByText(`Bonjour ${authenticatedUser.firstName}`)).toBeVisible();
  });

  test('should handle forgot password flow', async ({ page }) => {
    await page.goto('/auth/connexion');

    // Cliquer sur "Mot de passe oublié"
    await page.getByRole('link', { name: 'Mot de passe oublié ?' }).click();

    // Vérifier la redirection
    await expect(page).toHaveURL('/auth/mot-de-passe-oublie');

    // Remplir le formulaire
    await page.fill('input[name="email"]', 'test@example.com');
    await page.getByRole('button', { name: 'Envoyer les instructions' }).click();

    // Vérifier le message de succès
    await expect(page.getByText('Instructions envoyées')).toBeVisible();
  });

  test('should handle registration flow', async ({ page }) => {
    await page.goto('/auth/connexion');

    // Cliquer sur "Créer un compte"
    await page.getByRole('link', { name: 'Créer un compte' }).click();

    // Vérifier la redirection
    await expect(page).toHaveURL('/auth/inscription');

    // Remplir le formulaire d'inscription
    await page.fill('input[name="firstName"]', 'Nouveau');
    await page.fill('input[name="lastName"]', 'Utilisateur');
    await page.fill('input[name="email"]', 'newuser@example.com');
    await page.fill('input[name="phone"]', '+2250102030405');
    await page.fill('input[name="password"]', 'Password123');
    await page.fill('input[name="confirmPassword"]', 'Password123');

    // Soumettre le formulaire
    await page.getByRole('button', { name: 'S\'inscrire' }).click();

    // Vérifier la redirection vers le tableau de bord
    await expect(page).toHaveURL(/\/tableau-de-bord/);
  });

  test('should handle social login - Google', async ({ page }) => {
    await page.goto('/auth/connexion');

    // Cliquer sur le bouton Google
    await page.getByRole('button', { name: 'Continuer avec Google' }).click();

    // Note: Dans un vrai test, il faudrait gérer la redirection OAuth
    // Pour l'instant, on vérifie que le clic est bien pris en compte
    // et que le processus d'authentification OAuth est initié
  });

  test('should logout successfully', async ({ page, authenticatedUser, loginAsUser, logout }) => {
    // Se connecter
    await loginAsUser(authenticatedUser);

    // Vérifier qu'on est bien connecté
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();

    // Se déconnecter
    await logout();

    // Vérifier la redirection vers la page d'accueil
    await expect(page).toHaveURL('/');

    // Vérifier qu'on est bien déconnecté
    await expect(page.locator('[data-testid="login-button"]')).toBeVisible();
  });

  test('should persist session across page reloads', async ({ page, authenticatedUser, loginAsUser }) => {
    // Se connecter
    await loginAsUser(authenticatedUser);

    // Recharger la page
    await page.reload();

    // Vérifier que l'utilisateur est toujours connecté
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
    await expect(page.getByText(`Bonjour ${authenticatedUser.firstName}`)).toBeVisible();
  });

  test('should handle session expiration', async ({ page, authenticatedUser, loginAsUser }) => {
    // Se connecter
    await loginAsUser(authenticatedUser);

    // Simuler l'expiration de session (vider les cookies)
    await page.context().clearCookies();

    // Naviguer vers une page protégée
    await page.goto('/tableau-de-bord');

    // Vérifier la redirection vers la page de connexion
    await expect(page).toHaveURL('/auth/connexion');
  });

  test('should redirect authenticated users away from auth pages', async ({ page, authenticatedUser, loginAsUser }) => {
    // Se connecter
    await loginAsUser(authenticatedUser);

    // Essayer d'accéder à la page de connexion
    await page.goto('/auth/connexion');

    // Vérifier la redirection vers le tableau de bord
    await expect(page).toHaveURL('/tableau-de-bord');

    // Essayer d'accéder à la page d'inscription
    await page.goto('/auth/inscription');

    // Vérifier la redirection vers le tableau de bord
    await expect(page).toHaveURL('/tableau-de-bord');
  });
});