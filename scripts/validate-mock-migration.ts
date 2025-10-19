#!/usr/bin/env tsx

/**
 * Script de validation de la migration des données mockées
 * Vérifie que l'application n'utilise plus de données fictives
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, dirname } from 'path';
import { fileURLToPath } from 'url';
// Simplified logger for scripts
const scriptLogger = {
  error: (message: string, ...args: any[]) => console.error(`❌ ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`⚠️ ${message}`, ...args),
  info: (message: string, ...args: any[]) => console.log(`ℹ️ ${message}`, ...args),
};

interface ValidationResult {
  success: boolean;
  mockDataFiles: string[];
  mockDataUsage: string[];
  recommendations: string[];
}

class MockDataValidator {
  private srcDir: string;
  private mockDir: string;

  constructor() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    this.srcDir = join(__dirname, '../src');
    this.mockDir = join(this.srcDir, 'data/mock');
  }

  /**
   * Valide que la migration des données mockées est complète
   */
  async validateMigration(): Promise<ValidationResult> {
    console.log('🔍 Validation de la migration des données mockées...\n');

    const result: ValidationResult = {
      success: true,
      mockDataFiles: [],
      mockDataUsage: [],
      recommendations: []
    };

    // 1. Vérifier les fichiers de données mockées
    console.log('📁 Étape 1: Recherche des fichiers de données mockées...');
    await this.checkMockDataFiles(result);

    // 2. Vérifier l'utilisation des données mockées dans le code
    console.log('🔎 Étape 2: Recherche de l\'utilisation de données mockées...');
    await this.checkMockDataUsage(result);

    // 3. Générer les recommandations
    console.log('💡 Étape 3: Génération des recommandations...');
    this.generateRecommendations(result);

    // 4. Afficher les résultats
    this.displayResults(result);

    return result;
  }

  /**
   * Vérifie les fichiers de données mockées
   */
  private async checkMockDataFiles(result: ValidationResult): Promise<void> {
    try {
      statSync(this.mockDir);
    } catch (error) {
      console.log('✅ Aucun répertoire data/mock trouvé');
      return;
    }

    const files = this.getAllFiles(this.mockDir);

    for (const file of files) {
      if (extname(file) === '.ts' || extname(file) === '.js') {
        result.mockDataFiles.push(file);
        console.log(`  📄 ${file}`);
      }
    }

    if (result.mockDataFiles.length === 0) {
      console.log('✅ Aucun fichier de données mockées trouvé');
    } else {
      console.log(`⚠️ ${result.mockDataFiles.length} fichier(s) de données mockées trouvé(s)`);
    }
  }

  /**
   * Vérifie l'utilisation des données mockées dans le code source
   */
  private async checkMockDataUsage(result: ValidationResult): Promise<void> {
    const sourceFiles = this.getAllFiles(this.srcDir);

    const mockPatterns = [
      /mockData/i,
      /MOCK_DATA/i,
      /mockUsers/i,
      /mockOffers/i,
      /mockPolicies/i,
      /from.*data\/mock/,
      /import.*mock/i,
      /\.mock\./,
      /fakeData/i,
      /testData/i
    ];

    for (const file of sourceFiles) {
      if (file.includes('__tests__') || file.includes('.test.') || file.includes('.spec.')) {
        continue; // Ignorer les fichiers de test
      }

      try {
        const content = readFileSync(file, 'utf-8');

        for (const pattern of mockPatterns) {
          if (pattern.test(content) && !file.includes('fallback.ts') && !file.includes('features.ts')) {
            result.mockDataUsage.push({
              file,
              pattern: pattern.source,
              line: this.findLineNumber(content, pattern)
            });
            break;
          }
        }
      } catch (error) {
        console.warn(`  ⚠️ Impossible de lire le fichier: ${file}`);
      }
    }

    if (result.mockDataUsage.length === 0) {
      console.log('✅ Aucune utilisation de données mockées trouvée dans le code source');
    } else {
      console.log(`⚠️ ${result.mockDataUsage.length} utilisation(s) de données mockées trouvée(s)`);
    }
  }

  /**
   * Génère les recommandations basées sur les résultats
   */
  private generateRecommendations(result: ValidationResult): void {
    if (result.mockDataFiles.length > 0) {
      result.recommendations.push(
        `Supprimer les ${result.mockDataFiles.length} fichier(s) de données mockées inutilisés`
      );
      result.recommendations.push(
        'Conserver uniquement les fichiers de mock pour les tests unitaires'
      );
    }

    if (result.mockDataUsage.length > 0) {
      result.recommendations.push(
        `Remplacer les ${result.mockDataUsage.length} utilisation(s) de données mockées par des appels API réels`
      );
      result.recommendations.push(
        'Utiliser le service FallbackService pour gérer les erreurs API'
      );
    }

    if (result.mockDataFiles.length === 0 && result.mockDataUsage.length === 0) {
      result.recommendations.push(
        '✅ La migration des données mockées est complète !'
      );
      result.recommendations.push(
        'Assurez-vous que VITE_MOCK_DATA=false dans tous les environnements'
      );
    }

    result.success = result.mockDataFiles.length === 0 && result.mockDataUsage.length === 0;
  }

  /**
   * Affiche les résultats de la validation
   */
  private displayResults(result: ValidationResult): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RÉSULTATS DE LA VALIDATION');
    console.log('='.repeat(60));

    if (result.success) {
      console.log('✅ SUCCÈS: La migration des données mockées est complète !');
    } else {
      console.log('⚠️ ATTENTION: Des actions sont encore nécessaires');
    }

    if (result.mockDataFiles.length > 0) {
      console.log('\n📁 Fichiers de données mockées trouvés:');
      result.mockDataFiles.forEach(file => console.log(`  - ${file}`));
    }

    if (result.mockDataUsage.length > 0) {
      console.log('\n🔎 Utilisations de données mockées trouvées:');
      result.mockDataUsage.forEach((usage: any) => {
        console.log(`  - ${usage.file}:${usage.line} (${usage.pattern})`);
      });
    }

    console.log('\n💡 Recommandations:');
    result.recommendations.forEach(rec => console.log(`  ${rec}`));

    console.log('\n' + '='.repeat(60));
  }

  /**
   * Récupère tous les fichiers d'un répertoire récursivement
   */
  private getAllFiles(dir: string): string[] {
    const files: string[] = [];

    try {
      const items = readdirSync(dir);

      for (const item of items) {
        const fullPath = join(dir, item);
        const stat = statSync(fullPath);

        if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          files.push(...this.getAllFiles(fullPath));
        } else if (stat.isFile() && ['.ts', '.tsx', '.js', '.jsx'].includes(extname(item))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignorer les erreurs de lecture
    }

    return files;
  }

  /**
   * Trouve la ligne d'un motif dans un fichier
   */
  private findLineNumber(content: string, pattern: RegExp): number {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        return i + 1;
      }
    }
    return 0;
  }
}

// Fonction principale
async function main() {
  const validator = new MockDataValidator();

  try {
    const result = await validator.validateMigration();

    if (!result.success) {
      console.log('\n❌ La validation a échoué. Veuillez corriger les problèmes identifiés.');
      process.exit(1);
    } else {
      console.log('\n🎉 La validation est réussie !');
      console.log('✅ L\'application n\'utilise plus de données mockées');
    }
  } catch (error) {
    scriptLogger.error('Erreur lors de la validation:', error);
    console.error('❌ Erreur critique lors de la validation:', error);
    process.exit(1);
  }
}

// Exécuter uniquement si le script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}