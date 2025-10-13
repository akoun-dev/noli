/**
 * Script de test pour valider le système d'authentification Supabase
 * À utiliser uniquement en développement pour tester les flux
 */

import { authService } from '@/data/api/authService';
import { supabaseHelpers, supabase } from '@/lib/supabase';

export interface TestResult {
  testName: string;
  success: boolean;
  error?: string;
  duration: number;
}

export class AuthTester {
  private results: TestResult[] = [];

  private async runTest(testName: string, testFn: () => Promise<void>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      const result: TestResult = {
        testName,
        success: true,
        duration,
      };
      this.results.push(result);
      console.log(`✅ ${testName} - ${duration}ms`);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const result: TestResult = {
        testName,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration,
      };
      this.results.push(result);
      console.error(`❌ ${testName} - ${duration}ms - ${result.error}`);
      return result;
    }
  }

  async testConnection(): Promise<void> {
    // Test de connexion à Supabase
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) throw new Error(`Connexion Supabase échouée: ${error.message}`);
  }

  async testRegistration(): Promise<void> {
    const testUser = {
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+2250712345678',
    };

    const result = await authService.register(testUser);
    if (!result.user) throw new Error('Inscription échouée: utilisateur non créé');
    if (!result.user.email) throw new Error('Inscription échouée: email manquant');
  }

  async testLogin(): Promise<void> {
    const testCredentials = {
      email: 'test@example.com', // Utiliser un compte de test existant
      password: 'TestPassword123!',
    };

    try {
      const result = await authService.login(testCredentials);
      if (!result.user) throw new Error('Connexion échouée: utilisateur non trouvé');
    } catch (error) {
      // Si le compte n'existe pas, on le crée d'abord
      if (error instanceof Error && error.message.includes('Invalid login credentials')) {
        await this.testRegistration();
        const result = await authService.login(testCredentials);
        if (!result.user) throw new Error('Connexion échouée après création');
      } else {
        throw error;
      }
    }
  }

  async testGetCurrentUser(): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('Récupération utilisateur échouée');
  }

  async testPermissions(): Promise<void> {
    const permissions = await authService.getUserPermissions();
    if (!Array.isArray(permissions)) throw new Error('Récupération permissions échouée');
  }

  async testHasPermission(): Promise<void> {
    const hasPermission = await authService.hasPermission('read:own_profile');
    if (typeof hasPermission !== 'boolean') throw new Error('Vérification permission échouée');
  }

  async testUpdateProfile(): Promise<void> {
    const updateData = {
      firstName: 'Test Updated',
      lastName: 'User Updated',
    };

    const updatedUser = await authService.updateProfile(updateData);
    if (!updatedUser) throw new Error('Mise à jour profil échouée');
    if (updatedUser.firstName !== updateData.firstName) throw new Error('Mise à jour profil incomplète');
  }

  async testForgotPassword(): Promise<void> {
    await authService.forgotPassword('test@example.com');
    // Le test réussit si aucune erreur n'est levée
  }

  async testUserSessions(): Promise<void> {
    const sessions = await authService.getUserSessions();
    if (!Array.isArray(sessions)) throw new Error('Récupération sessions échouée');
  }

  async testLogout(): Promise<void> {
    await authService.logout();
    // Vérifier que l'utilisateur est bien déconnecté
    const isAuthenticated = await authService.isAuthenticated();
    if (isAuthenticated) throw new Error('Déconnexion échouée');
  }

  async testOAuthProviders(): Promise<void> {
    // Test des providers OAuth (sans réellement se connecter)
    try {
      // Google
      await authService.loginWithOAuth('google');
    } catch (error) {
      // Erreur attendue car nous ne sommes pas dans un vrai navigateur
      if (error instanceof Error && !error.message.includes('popup')) {
        throw error;
      }
    }

    try {
      // Facebook
      await authService.loginWithOAuth('facebook');
    } catch (error) {
      // Erreur attendue
      if (error instanceof Error && !error.message.includes('popup')) {
        throw error;
      }
    }
  }

  async runAllTests(): Promise<TestResult[]> {
    console.log('🚀 Démarrage des tests d\'authentification Supabase...');
    console.log('='.repeat(50));

    this.results = [];

    // Tests de base
    await this.runTest('Connexion à Supabase', () => this.testConnection());
    await this.runTest('Inscription utilisateur', () => this.testRegistration());
    await this.runTest('Connexion utilisateur', () => this.testLogin());
    await this.runTest('Récupération utilisateur courant', () => this.testGetCurrentUser());
    await this.runTest('Récupération permissions', () => this.testPermissions());
    await this.runTest('Vérification permission', () => this.testHasPermission());
    await this.runTest('Mise à jour profil', () => this.testUpdateProfile());
    await this.runTest('Sessions utilisateur', () => this.testUserSessions());
    await this.runTest('Mot de passe oublié', () => this.testForgotPassword());
    await this.runTest('Déconnexion', () => this.testLogout());

    // Tests OAuth
    await this.runTest('Providers OAuth', () => this.testOAuthProviders());

    // Afficher les résultats
    this.printResults();

    return this.results;
  }

  private printResults(): void {
    console.log('='.repeat(50));
    console.log('📊 Résultats des tests:');
    
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const successRate = ((successCount / totalCount) * 100).toFixed(1);

    console.log(`✅ ${successCount}/${totalCount} tests réussis (${successRate}%)`);
    
    if (successCount < totalCount) {
      console.log('\n❌ Tests échoués:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.error}`);
        });
    }

    console.log('\n⏱️  Durée totale:', this.results.reduce((sum, r) => sum + r.duration, 0), 'ms');
  }

  // Test pour vérifier la configuration RLS
  async testRLSPolicies(): Promise<void> {
    // Test que l'utilisateur ne peut pas accéder aux profils des autres
    const { data, error } = await supabase
      .from('profiles')
      .select('*');

    if (error) {
      throw new Error(`RLS Policy test failed: ${error.message}`);
    }

    // Vérifier qu'on ne voit que notre propre profil (ou aucun si non connecté)
    if (data && data.length > 1) {
      throw new Error('RLS Policy failed: trop de profils visibles');
    }
  }

  // Test pour vérifier les permissions par rôle
  async testRoleBasedAccess(): Promise<void> {
    const user = await authService.getCurrentUser();
    if (!user) throw new Error('Utilisateur non connecté');

    const permissions = await authService.getUserPermissions();
    
    // Vérifier que les permissions correspondent au rôle
    const expectedPermissions = this.getExpectedPermissionsForRole(user.role);
    const hasAllExpectedPermissions = expectedPermissions.every(p => permissions.includes(p));
    
    if (!hasAllExpectedPermissions) {
      throw new Error(`Permissions manquantes pour le rôle ${user.role}`);
    }
  }

  private getExpectedPermissionsForRole(role: string): string[] {
    switch (role) {
      case 'USER':
        return ['read:own_profile', 'update:own_profile'];
      case 'INSURER':
        return ['read:own_profile', 'update:own_profile', 'read:own_offers', 'create:offers'];
      case 'ADMIN':
        return ['read:all_profiles', 'update:all_profiles', 'manage:system'];
      default:
        return [];
    }
  }
}

// Fonction utilitaire pour lancer les tests
export const runAuthTests = async (): Promise<TestResult[]> => {
  const tester = new AuthTester();
  return await tester.runAllTests();
};

// Fonction pour tester uniquement la configuration
export const testAuthConfig = async (): Promise<boolean> => {
  try {
    const tester = new AuthTester();
    await tester['runTest']('Configuration Supabase', () => tester.testConnection());
    return true;
  } catch (error) {
    console.error('❌ Configuration Supabase invalide:', error);
    return false;
  }
};

// Export pour utilisation dans la console de développement
if (typeof window !== 'undefined') {
  (window as any).authTest = {
    runAllTests: runAuthTests,
    testConfig: testAuthConfig,
    AuthTester,
  };
}
