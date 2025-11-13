// Test script pour vérifier le chargement des garanties
import { coverageTarificationService } from './src/services/coverageTarificationService.js';

async function testCoverageLoading() {
  console.log('Test de chargement des garanties...');

  try {
    const vehicleData = {
      category: '401',
      vehicle_value: 5000000,
      fiscal_power: 6,
      fuel_type: 'essence'
    };

    console.log('Appel à getAvailableCoverages avec:', vehicleData);
    const coverages = await coverageTarificationService.getAvailableCoverages(vehicleData);

    console.log('Garanties chargées:', coverages.length);
    console.log('Détail des garanties:', coverages);

  } catch (error) {
    console.error('Erreur lors du chargement:', error);
  }
}

testCoverageLoading();