/**
 * Script pour vérifier le budget de performance
 * S'assure que le bundle respecte les limites définies
 */

const fs = require('fs');
const path = require('path');

// Configuration du budget de performance
const PERFORMANCE_BUDGET = {
  // Taille maximale du bundle total (KB)
  totalBundleSize: 500,

  // Taille maximale des chunks principaux (KB)
  chunks: {
    vendor: 300,
    router: 50,
    ui: 200,
    charts: 50,
    forms: 50,
    utils: 30,
    pdf: 100,
    supabase: 50,
    query: 30,
  },

  // Score minimum Lighthouse
  lighthouse: {
    performance: 80,
    accessibility: 90,
    bestPractices: 80,
    seo: 80,
  },

  // Web Vitals (ms)
  webVitals: {
    LCP: 2500,  // Largest Contentful Paint
    FID: 100,   // First Input Delay
    CLS: 0.1,   // Cumulative Layout Shift
    FCP: 1800,  // First Contentful Paint
    TTFB: 800,   // Time to First Byte
  },
};

// Analyser le fichier manifest.json généré par Vite
function analyzeBundleSize() {
  const manifestPath = path.join(process.cwd(), 'dist', '.vite', 'manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error('❌ manifest.json not found. Run `npm run build` first.');
    return { passed: false, errors: ['manifest.json not found'] };
  }

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const results = {
      passed: true,
      errors: [],
      warnings: [],
      chunks: [],
    };

    let totalSize = 0;

    // Analyser chaque chunk
    Object.entries(manifest).forEach(([entryName, entry]) => {
      if (entry.isEntry) return; // Ignorer les points d'entrée

      const chunkSize = entry.file ? fs.statSync(path.join(process.cwd(), 'dist', entry.file)).size / 1024 : 0;
      totalSize += chunkSize;

      // Vérifier le budget du chunk
      const budgetLimit = PERFORMANCE_BUDGET.chunks[entryName.replace('.js', '')] || PERFORMANCE_BUDGET.totalBundleSize;

      results.chunks.push({
        name: entryName,
        size: Math.round(chunkSize),
        budget: budgetLimit,
        passed: chunkSize <= budgetLimit,
      });

      if (chunkSize > budgetLimit) {
        results.errors.push(
          `❌ ${entryName}: ${Math.round(chunkSize)}KB (limit: ${budgetLimit}KB)`
        );
        results.passed = false;
      } else if (chunkSize > budgetLimit * 0.8) {
        results.warnings.push(
          `⚠️ ${entryName}: ${Math.round(chunkSize)}KB (close to limit: ${budgetLimit}KB)`
        );
      }
    });

    // Vérifier le budget total
    results.totalSize = Math.round(totalSize);
    results.totalPassed = totalSize <= PERFORMANCE_BUDGET.totalBundleSize;

    if (totalSize > PERFORMANCE_BUDGET.totalBundleSize) {
      results.errors.push(
        `❌ Total bundle size: ${Math.round(totalSize)}KB (limit: ${PERFORMANCE_BUDGET.totalBundleSize}KB)`
      );
      results.passed = results.passed && results.totalPassed;
    } else if (totalSize > PERFORMANCE_BUNDLE_BUDGET.totalBundleSize * 0.8) {
      results.warnings.push(
        `⚠️ Total bundle size: ${Math.round(totalSize)}KB (close to limit: ${PERFORMANCE_BUDGET.totalBundleSize}KB)`
      );
    }

    return results;

  } catch (error) {
      console.error('❌ Error analyzing bundle size:', error.message);
      return { passed: false, errors: [error.message] };
    }
  }

// Analyser les dépendances pour détecter les paquets lourds
function analyzeDependencies() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  if (!fs.existsSync(packageJsonPath)) {
    return [];
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // Analyser la taille des dépendances installées
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    const heavyDeps = [];

    Object.entries(allDeps).forEach(([name, version]) => {
      try {
        const packagePath = path.join(nodeModulesPath, name, 'package.json');
        if (fs.existsSync(packagePath)) {
          const packageInfo = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

          // Estimer la taille (approximation)
          let estimatedSize = 0;
          if (packageInfo.browser || packageInfo.main) {
            const mainFile = path.join(nodeModulesPath, name, packageInfo.browser || packageInfo.main || 'index.js');
            if (fs.existsSync(mainFile)) {
              estimatedSize = fs.statSync(mainFile).size / 1024;
            }
          }

          if (estimatedSize > 50) { // Plus de 50KB
            heavyDeps.push({
              name,
              version,
              estimatedSize: Math.round(estimatedSize),
            });
          }
        }
      } catch (error) {
        // Ignorer les erreurs d'analyse de dépendances
      }
    });

    // Trier par taille décroissante
    return heavyDeps.sort((a, b) => b.estimatedSize - a.estimatedSize);
  } catch (error) {
    console.error('❌ Error analyzing dependencies:', error.message);
    return [];
  }
}

// Afficher un rapport détaillé
function printReport(results) {
  console.log('\n📊 Performance Budget Report\n');
  console.log('=====================================');

  // Rapport des chunks
  console.log('\n📦 Bundle Analysis');
  console.log('-----------------------------------');
  console.log(`Total bundle size: ${results.totalSize}KB (limit: ${PERFORMANCE_BUDGET.totalBundleSize}KB)`);
  console.log(`Status: ${results.totalPassed ? '✅' : '❌'} Passed\n`);

  if (results.chunks.length > 0) {
    console.log('Chunks:');
    results.chunks.forEach(chunk => {
      const status = chunk.passed ? '✅' : '❌';
      const usage = `${chunk.size}KB/${chunk.budget}KB`;
      console.log(`  ${status} ${chunk.name}: ${usage} (${Math.round((chunk.size / chunk.budget) * 100)}%)`);
    });
  }

  // Afficher les erreurs
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => {
      console.log(`  ${error}`);
    });
  }

  // Afficher les avertissements
  if (results.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    results.warnings.forEach(warning => {
      console.log(`  ${warning}`);
    });
  }

  // Afficher les dépendances lourdes
  const heavyDeps = analyzeDependencies();
  if (heavyDeps.length > 0) {
    console.log('\n📦 Heavy Dependencies (>50KB)');
    console.log('--------------------------------');
    heavyDeps.slice(0, 10).forEach(dep => {
      console.log(`  ${dep.name}@${dep.version}: ~${dep.estimatedSize}KB`);
    });
    if (heavyDeps.length > 10) {
      console.log(`  ... and ${heavyDeps.length - 10} more`);
    }
  }

  // Recommandations
  console.log('\n💡 Recommendations');
  console.log('-----------------------------------');

  if (results.errors.length > 0) {
    console.log('1. Reduce bundle size:');
    console.log('   - Use dynamic imports for large libraries');
    console.log('   - Remove unused dependencies');
    console.log('   - Optimize image assets');
    console.log('   - Enable compression');
  }

  if (heavyDeps.length > 5) {
    console.log('2. Optimize dependencies:');
    console.log('   - Consider lighter alternatives for heavy packages');
    console.log('   - Use tree-shaking more effectively');
    console.log('   - Import only needed functions');
  }

  console.log('3. Performance optimizations:');
  console.log('   - Enable code splitting');
  console.log('   - Use lazy loading for routes');
  console.log('   - Implement image optimization');
  console.log('   - Enable service worker caching');

  console.log('\n📈 Budget Limits:');
  console.log(`- Total bundle: ${PERFORMANCE_BUDGET.totalBundleSize}KB`);
  Object.entries(PERFORMANCE_BUDGET.chunks).forEach(([name, limit]) => {
    console.log(`- ${name}: ${limit}KB`);
  });

  console.log('\n🎯 Lighthouse Scores:');
  Object.entries(PERFORMANCE_BUDGET.lighthouse).forEach(([metric, target]) => {
    console.log(`- ${metric}: ${target}`);
  });
}

// Fonction principale
function main() {
  console.log('🔍 Checking Performance Budget...\n');

  const results = analyzeBundleSize();
  printReport(results);

  if (results.passed) {
    console.log('\n✅ Performance budget passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Performance budget failed!');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  analyzeBundleSize,
  analyzeDependencies,
  PERFORMANCE_BUDGET,
};