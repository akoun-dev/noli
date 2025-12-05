// Test script pour vérifier que la migration IPT_PLACES_FORMULA fonctionne correctement
// Ce script simule la création d'une garantie avec la méthode IPT_PLACES_FORMULA

const { createClient } = require('@supabase/supabase-js');

// Configuration - à adapter avec vos vraies valeurs
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pmlmljfqxlpazabumgqf.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'votre-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testIPTPlacesFormula() {
  console.log('🧪 Test de création d\'une garantie avec IPT_PLACES_FORMULA...');
  
  try {
    // Test de création d'une garantie avec la méthode IPT_PLACES_FORMULA
    const testCoverage = {
      name: 'Test Individuelle Personnes Transportées (FORMULE 1)',
      code: 'TEST_IPT',
      calculation_type: 'IPT_PLACES_FORMULA',
      is_active: true,
      is_mandatory: false,
      description: 'Garantie de test pour vérifier la migration IPT_PLACES_FORMULA',
      metadata: {
        calculationMethod: 'IPT_PLACES_FORMULA',
        parameters: {
          iptConfig: {
            defaultFormula: 1,
            formulas: [
              {
                formula: 1,
                capitalDeces: 1000000,
                capitalInvalidite: 2000000,
                fraisMedicaux: 100000,
                prime: 0,
                label: 'Formule 1',
                placesTariffs: [
                  { places: 5, prime: 16000, label: '5 places' }
                ]
              }
            ]
          }
        }
      }
    };

    console.log('📝 Données de test:', testCoverage);
    
    const { data, error } = await supabase
      .from('coverages')
      .insert(testCoverage)
      .select('id, name, calculation_type')
      .single();

    if (error) {
      console.error('❌ Erreur lors de la création:', error);
      if (error.code === '22P02') {
        console.error('💥 L\'erreur 22P02 persiste ! La valeur IPT_PLACES_FORMULA n\'est toujours pas reconnue.');
        console.error('🔧 Vérifiez que la migration a bien été appliquée sur la base de données.');
      }
      return false;
    }

    console.log('✅ Succès ! Garantie créée avec IPT_PLACES_FORMULA');
    console.log('📋 Détails de la garantie créée:', data);
    
    // Nettoyage : suppression de la garantie de test
    console.log('🧹 Nettoyage : suppression de la garantie de test...');
    const { error: deleteError } = await supabase
      .from('coverages')
      .delete()
      .eq('id', data.id);
      
    if (deleteError) {
      console.warn('⚠️ Impossible de supprimer la garantie de test:', deleteError);
    } else {
      console.log('✅ Garantie de test supprimée avec succès');
    }
    
    return true;
    
  } catch (err) {
    console.error('💥 Erreur inattendue:', err);
    return false;
  }
}

// Vérification de la valeur actuelle de l'énumération
async function checkEnumValues() {
  console.log('🔍 Vérification des valeurs de l\'énumération coverage_calculation_type...');
  
  try {
    const { data, error } = await supabase
      .rpc('get_enum_values', { 
        enum_name: 'coverage_calculation_type' 
      });
      
    if (error) {
      console.warn('⚠️ Impossible de vérifier les valeurs de l\'enum:', error);
      return;
    }
    
    console.log('📋 Valeurs actuelles de l\'enum:', data);
    
    if (data && data.includes('IPT_PLACES_FORMULA')) {
      console.log('✅ IPT_PLACES_FORMULA est bien présent dans l\'énumération');
    } else {
      console.log('❌ IPT_PLACES_FORMULA est MANQUANT dans l\'énumération');
      console.log('🔧 La migration n\'a probablement pas été appliquée');
    }
    
  } catch (err) {
    console.warn('⚠️ Erreur lors de la vérification de l\'enum:', err);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Démarrage du test de migration IPT_PLACES_FORMULA\n');
  
  await checkEnumValues();
  console.log('\n');
  
  const success = await testIPTPlacesFormula();
  
  console.log('\n📊 Résultat du test:');
  if (success) {
    console.log('✅ La migration IPT_PLACES_FORMULA fonctionne correctement !');
    console.log('🎉 L\'erreur "invalid input value for enum coverage_calculation_type" devrait être résolue.');
  } else {
    console.log('❌ La migration a échoué ou n\'a pas été appliquée.');
    console.log('🔧 Vérifiez:');
    console.log('   1. Que la migration SQL a été exécutée sur Supabase');
    console.log('   2. Que la connexion à la base de données fonctionne');
    console.log('   3. Les permissions de l\'utilisateur Supabase');
  }
}

// Exécution du test
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testIPTPlacesFormula, checkEnumValues };