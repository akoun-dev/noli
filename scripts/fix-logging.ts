#!/usr/bin/env tsx

/**
 * Script pour remplacer les console.log par des appels au logger structuré
 */

import { readFileSync, writeFileSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ConsoleLogReplacement {
  pattern: RegExp;
  replacement: string;
  description: string;
}

const replacements: ConsoleLogReplacement[] = [
  {
    pattern: /console\.log\(\s*['"`]🔐['"`](.+?)\)/gs,
    replacement: 'logger.auth($1)',
    description: 'Console logs authentification'
  },
  {
    pattern: /console\.log\(\s*['"`]🌐['"`](.+?)\)/gs,
    replacement: 'logger.api($1)',
    description: 'Console logs API'
  },
  {
    pattern: /console\.log\(\s*['"`]⚡['"`](.+?)\)/gs,
    replacement: 'logger.perf($1)',
    description: 'Console logs performance'
  },
  {
    pattern: /console\.log\(\s*['"`]❌['"`](.+?)\)/gs,
    replacement: 'logger.error($1)',
    description: 'Console logs erreurs'
  },
  {
    pattern: /console\.log\(\s*['"`]⚠️['"`](.+?)\)/gs,
    replacement: 'logger.warn($1)',
    description: 'Console logs warnings'
  },
  {
    pattern: /console\.log\(\s*['"`]ℹ️['"`](.+?)\)/gs,
    replacement: 'logger.info($1)',
    description: 'Console logs info'
  },
  {
    pattern: /console\.log\(\s*['"`]🔍['"`](.+?)\)/gs,
    replacement: 'logger.debug($1)',
    description: 'Console logs debug'
  },
  // Cas génériques
  {
    pattern: /console\.error\(/gs,
    replacement: 'logger.error(',
    description: 'Console.error générique'
  },
  {
    pattern: /console\.warn\(/gs,
    replacement: 'logger.warn(',
    description: 'Console.warn générique'
  },
  {
    pattern: /console\.info\(/gs,
    replacement: 'logger.info(',
    description: 'Console.info générique'
  },
  {
    pattern: /console\.debug\(/gs,
    replacement: 'logger.debug(',
    description: 'Console.debug générique'
  }
];

function fixFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    let modifiedContent = content;
    let hasChanges = false;

    for (const replacement of replacements) {
      const before = modifiedContent;
      modifiedContent = modifiedContent.replace(replacement.pattern, replacement.replacement);

      if (before !== modifiedContent) {
        hasChanges = true;
        console.log(`✅ ${replacement.description} dans ${filePath}`);
      }
    }

    // Gérer les console.log restants
    const remainingConsoleLogs = modifiedContent.match(/console\.log\(/g);
    if (remainingConsoleLogs) {
      // Remplacer les console.log restants par logger.info
      modifiedContent = modifiedContent.replace(/console\.log\(/g, 'logger.info(');
      hasChanges = true;
      console.log(`✅ Console.log génériques remplacés dans ${filePath}`);
    }

    if (hasChanges) {
      writeFileSync(filePath, modifiedContent);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`❌ Erreur en traitant ${filePath}:`, error);
    return false;
  }
}

function findFilesWithConsoleLogs(): string[] {
  try {
    const result = execSync(
      'find src -name "*.ts" -o -name "*.tsx" | xargs grep -l "console\\.log\\|console\\.error\\|console\\.warn\\|console\\.info\\|console\\.debug"',
      { encoding: 'utf-8', cwd: join(__dirname, '..') }
    );

    return result.trim().split('\n').filter(Boolean);
  } catch (error) {
    console.log('ℹ️ Aucun fichier avec console.log trouvé');
    return [];
  }
}

function main() {
  console.log('🔧 Correction des logs dans le codebase...\n');

  const files = findFilesWithConsoleLogs();

  if (files.length === 0) {
    console.log('✅ Aucun fichier à corriger');
    return;
  }

  console.log(`📁 ${files.length} fichier(s) à traiter:\n`);

  let totalFixed = 0;

  for (const file of files) {
    const wasFixed = fixFile(file);
    if (wasFixed) {
      totalFixed++;
    }
  }

  console.log(`\n🎉 Terminé! ${totalFixed} fichier(s) modifié(s)`);

  if (totalFixed > 0) {
    console.log('\n💡 N\'oubliez pas d\'exécuter "npm run lint:fix" pour finaliser le formatage');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}