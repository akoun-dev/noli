import { test, expect } from './fixtures/auth-fixtures';

test.describe('Insurance Comparison E2E Tests', () => {
  test.beforeEach(async ({ page, authenticatedUser, loginAsUser }) => {
    // Se connecter avant chaque test
    await loginAsUser(authenticatedUser);
  });

  test('should complete full comparison flow', async ({ page }) => {
    // Commencer la comparaison depuis la page d'accueil
    await page.goto('/');

    // Cliquer sur le bouton de comparaison
    await page.getByRole('button', { name: 'Comparer les assurances' }).click();

    // Étape 1: Informations personnelles
    await expect(page).toHaveURL('/comparer');

    // Remplir les informations personnelles
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+2250102030405');
    await page.check('input[name="isWhatsapp"]');

    // Passer à l'étape suivante
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 2: Informations véhicule
    await expect(page).toHaveURL('/comparer/vehicle');

    // Remplir les informations du véhicule
    await page.selectOption('select[name="make"]', 'Toyota');
    await page.fill('input[name="model"]', 'Yaris');
    await page.fill('input[name="year"]', '2020');
    await page.selectOption('select[name="fuel"]', 'Essence');
    await page.fill('input[name="fiscalPower"]', '7');
    await page.fill('input[name="seats"]', '5');
    await page.fill('input[name="circulationDate"]', '2020-01-15');
    await page.fill('input[name="newValue"]', '4500000');
    await page.fill('input[name="currentValue"]', '3500000');
    await page.selectOption('select[name="vehicleUsage"]', 'personnel');

    // Passer à l'étape suivante
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 3: Besoins en assurance
    await expect(page).toHaveURL('/comparer/besoins');

    // Remplir les besoins en assurance
    await page.selectOption('select[name="coverageType"]', 'tous_risques');
    await page.fill('input[name="effectiveDate"]', '2024-02-01');
    await page.selectOption('select[name="contractDuration"]', '1 an');
    await page.check('input[name="options"][value="assistance"]');
    await page.check('input[name="options"][value="vehicle-replacement"]');

    // Lancer la comparaison
    await page.getByRole('button', { name: 'Comparer les offres' }).click();

    // Attendre les résultats
    await expect(page).toHaveURL('/offres');
    await expect(page.getByRole('heading', { name: 'Résultats de votre comparaison' })).toBeVisible();
  });

  test('should validate personal information step', async ({ page }) => {
    await page.goto('/comparer');

    // Soumettre le formulaire vide
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Vérifier les erreurs de validation
    await expect(page.getByText('Le prénom est requis')).toBeVisible();
    await expect(page.getByText('Le nom est requis')).toBeVisible();
    await expect(page.getByText('L\'email est requis')).toBeVisible();
    await expect(page.getByText('Le téléphone est requis')).toBeVisible();

    // Remplir avec un email invalide
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="phone"]', '+2250102030405');

    await page.getByRole('button', { name: 'Continuer' }).click();

    // Vérifier l'erreur de format d'email
    await expect(page.getByText('Email invalide')).toBeVisible();
  });

  test('should validate vehicle information step', async ({ page }) => {
    // Remplir l'étape 1 pour passer à l'étape 2
    await page.goto('/comparer');
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+2250102030405');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Soumettre le formulaire véhicule vide
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Vérifier les erreurs de validation
    await expect(page.getByText('La marque est requise')).toBeVisible();
    await expect(page.getByText('Le modèle est requis')).toBeVisible();
    await expect(page.getByText('Le type de carburant est requis')).toBeVisible();
    await expect(page.getByText('L\'usage du véhicule est requis')).toBeVisible();
  });

  test('should validate insurance needs step', async ({ page }) => {
    // Remplir les étapes 1 et 2
    await page.goto('/comparer');

    // Étape 1
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+2250102030405');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Étape 2
    await page.selectOption('select[name="make"]', 'Toyota');
    await page.fill('input[name="model"]', 'Yaris');
    await page.fill('input[name="year"]', '2020');
    await page.selectOption('select[name="fuel"]', 'Essence');
    await page.fill('input[name="fiscalPower"]', '7');
    await page.fill('input[name="seats"]', '5');
    await page.fill('input[name="circulationDate"]', '2020-01-15');
    await page.fill('input[name="newValue"]', '4500000');
    await page.fill('input[name="currentValue"]', '3500000');
    await page.selectOption('select[name="vehicleUsage"]', 'personnel');
    await page.getByRole('button', { name: 'Continuer' }).click();

    // Soumettre le formulaire de besoins vide
    await page.getByRole('button', { name: 'Comparer les offres' }).click();

    // Vérifier les erreurs de validation
    await expect(page.getByText('Le type de couverture est requis')).toBeVisible();
    await expect(page.getByText('La date d\'effet est requise')).toBeVisible();
    await expect(page.getByText('La durée du contrat est requise')).toBeVisible();
  });

  test('should display comparison results correctly', async ({ page }) => {
    // Compléter le flux de comparaison
    await page.goto('/comparer');

    // Remplir rapidement toutes les étapes
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+2250102030405');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.selectOption('select[name="make"]', 'Toyota');
    await page.fill('input[name="model"]', 'Yaris');
    await page.fill('input[name="year"]', '2020');
    await page.selectOption('select[name="fuel"]', 'Essence');
    await page.fill('input[name="fiscalPower"]', '7');
    await page.fill('input[name="seats"]', '5');
    await page.fill('input[name="circulationDate"]', '2020-01-15');
    await page.fill('input[name="newValue"]', '4500000');
    await page.fill('input[name="currentValue"]', '3500000');
    await page.selectOption('select[name="vehicleUsage"]', 'personnel');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.selectOption('select[name="coverageType"]', 'tous_risques');
    await page.fill('input[name="effectiveDate"]', '2024-02-01');
    await page.selectOption('select[name="contractDuration"]', '1 an');
    await page.getByRole('button', { name: 'Comparer les offres' }).click();

    // Attendre les résultats
    await expect(page.getByRole('heading', { name: 'Résultats de votre comparaison' })).toBeVisible();

    // Vérifier les éléments des résultats
    await expect(page.locator('[data-testid="total-offers"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-range"]')).toBeVisible();
    await expect(page.locator('[data-testid="offer-cards"]')).toBeVisible();

    // Vérifier qu'il y a au moins une offre
    await expect(page.locator('[data-testid="offer-card"]')).toHaveCount.greaterThan(0);
  });

  test('should allow filtering and sorting results', async ({ page }) => {
    // Accéder directement à une page de résultats (en supposant qu'une comparaison existe)
    await page.goto('/offres');

    // Vérifier les filtres
    await expect(page.locator('[data-testid="price-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="insurer-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="coverage-filter"]')).toBeVisible();

    // Appliquer un filtre de prix
    await page.fill('[data-testid="price-min"]', '50000');
    await page.fill('[data-testid="price-max"]', '100000');
    await page.getByRole('button', { name: 'Appliquer' }).click();

    // Vérifier que les résultats sont filtrés
    await expect(page.locator('[data-testid="offer-card"]')).toHaveCount.greaterThan(0);

    // Trier par prix croissant
    await page.selectOption('[data-testid="sort-select"]', 'price-asc');
    await expect(page.locator('[data-testid="offer-card"]').first()).toContainText('50');
  });

  test('should save favorite offers', async ({ page }) => {
    // Accéder aux résultats
    await page.goto('/offres');

    // Ajouter une offre aux favoris
    await page.locator('[data-testid="offer-card"]').first().locator('[data-testid="favorite-button"]').click();

    // Vérifier que le bouton est activé
    await expect(page.locator('[data-testid="offer-card"]').first().locator('[data-testid="favorite-button"]')).toHaveClass(/active/);

    // Vérifier que l'offre apparaît dans les favoris
    await page.goto('/tableau-de-bord?tab=favorites');
    await expect(page.locator('[data-testid="favorite-offers"]')).toBeVisible();
  });

  test('should show comparison details', async ({ page }) => {
    await page.goto('/offres');

    // Cliquer sur une offre pour voir les détails
    await page.locator('[data-testid="offer-card"]').first().click();

    // Vérifier la modal ou page de détails
    await expect(page.locator('[data-testid="offer-details"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Détails de l\'offre' })).toBeVisible();

    // Vérifier les informations de l'offre
    await expect(page.locator('[data-testid="insurer-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="coverage-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="benefits-list"]')).toBeVisible();
  });

  test('should handle comparison history', async ({ page }) => {
    // Accéder à l'historique des comparaisons
    await page.goto('/tableau-de-bord?tab=history');

    // Vérifier que l'historique s'affiche
    await expect(page.locator('[data-testid="comparison-history"]')).toBeVisible();

    // Cliquer sur une comparaison précédente
    if (await page.locator('[data-testid="history-item"]').count() > 0) {
      await page.locator('[data-testid="history-item"]').first().click();

      // Vérifier que les détails de la comparaison s'affichent
      await expect(page.locator('[data-testid="comparison-details"]')).toBeVisible();
    }
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Simuler une erreur réseau lors de la soumission
    await page.route('/api/comparisons', route => route.abort());

    await page.goto('/comparer');

    // Remplir toutes les étapes rapidement
    await page.fill('input[name="firstName"]', 'John');
    await page.fill('input[name="lastName"]', 'Doe');
    await page.fill('input[name="email"]', 'john.doe@example.com');
    await page.fill('input[name="phone"]', '+2250102030405');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.selectOption('select[name="make"]', 'Toyota');
    await page.fill('input[name="model"]', 'Yaris');
    await page.fill('input[name="year"]', '2020');
    await page.selectOption('select[name="fuel"]', 'Essence');
    await page.getByRole('button', { name: 'Continuer' }).click();

    await page.selectOption('select[name="coverageType"]', 'tous_risques');
    await page.fill('input[name="effectiveDate"]', '2024-02-01');
    await page.selectOption('select[name="contractDuration"]', '1 an');
    await page.getByRole('button', { name: 'Comparer les offres' }).click();

    // Vérifier que le message d'erreur s'affiche
    await expect(page.getByText(/Erreur lors de la comparaison/)).toBeVisible();
  });
});