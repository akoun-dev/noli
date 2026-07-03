import { db } from './src/lib/db'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 NOLI Assurance — Seed Script (User Interface Test Data)\n')
  console.log('='.repeat(60))

  // ── 1. TEST USER ──────────────────────────────────────────────
  console.log('\n📋 [1/4] Test User (user@test.ci)')

  const existingUser = await db.profile.findUnique({
    where: { email: 'user@test.ci' },
  })

  let testUser
  if (existingUser) {
    console.log('   ✅ Utilisateur existant trouvé, mise à jour...')
    const hashedPassword = await bcrypt.hash('test123', 10)
    testUser = await db.profile.update({
      where: { email: 'user@test.ci' },
      data: {
        firstName: 'Kouamé',
        lastName: 'Amadou',
        phone: '+225 07 12 34 56',
        password: hashedPassword,
        role: 'USER',
        isActive: true,
      },
    })
    console.log(`   ✅ Profil mis à jour : ${testUser.firstName} ${testUser.lastName}`)
  } else {
    console.log('   🆕 Création du profil test...')
    const hashedPassword = await bcrypt.hash('test123', 10)
    testUser = await db.profile.create({
      data: {
        email: 'user@test.ci',
        password: hashedPassword,
        firstName: 'Kouamé',
        lastName: 'Amadou',
        phone: '+225 07 12 34 56',
        role: 'USER',
        isActive: true,
      },
    })
    console.log(`   ✅ Profil créé : ${testUser.firstName} ${testUser.lastName}`)
  }

  // ── 2. INSURERS ───────────────────────────────────────────────
  console.log('\n🏢 [2/4] Assureurs')

  let noliaInsurer = await db.insurer.findUnique({
    where: { code: 'NOLIA' },
  })

  if (noliaInsurer) {
    console.log(`   ⏭️  NOLIA existe déjà (${noliaInsurer.name}) — ignoré`)
  } else {
    console.log('   🆕 Création assureur NOLI Assurance...')
    noliaInsurer = await db.insurer.create({
      data: {
        code: 'NOLIA',
        name: 'NOLI Assurance',
        isActive: true,
        contactEmail: 'contact@nolia.ci',
        phone: '+225 27 20 30 40 50',
        website: 'https://www.nolia.ci',
      },
    })
    console.log(`   ✅ NOLI Assurance créé (id: ${noliaInsurer.id})`)
  }

  let sunuInsurer = await db.insurer.findUnique({
    where: { code: 'SUNU' },
  })

  if (sunuInsurer) {
    console.log(`   ⏭️  SUNU existe déjà (${sunuInsurer.name}) — ignoré`)
  } else {
    console.log('   🆕 Création assureur SUNU Assurances IARD CI...')
    sunuInsurer = await db.insurer.create({
      data: {
        code: 'SUNU',
        name: 'SUNU Assurances IARD CI',
        isActive: true,
        contactEmail: 'contact@sunu.ci',
        phone: '+225 27 20 00 00 00',
        website: 'https://www.sunu.com/ci',
      },
    })
    console.log(`   ✅ SUNU Assurances IARD CI créé (id: ${sunuInsurer.id})`)
  }

  // ── 3. CATEGORY + OFFERS ──────────────────────────────────────
  console.log('\n📂 [3/4] Catégorie Automobile & Offres')

  let autoCategory = await db.insuranceCategory.findFirst({
    where: { name: 'Automobile', icon: 'car' },
  })

  if (autoCategory) {
    console.log(`   ⏭️  Catégorie "Automobile" existe déjà — ignoré`)
  } else {
    console.log('   🆕 Création catégorie Automobile...')
    autoCategory = await db.insuranceCategory.create({
      data: {
        name: 'Automobile',
        icon: 'car',
        description: 'Assurances automobiles pour véhicules particuliers et utilitaires',
        isActive: true,
      },
    })
    console.log(`   ✅ Catégorie "Automobile" créée (id: ${autoCategory.id})`)
  }

  // ── OFFERS FOR NOLIA ──────────────────────────────────────────
  console.log('\n   📦 Offres NOLI Assurance → Automobile')

  const noliaOffers = [
    {
      name: 'Tiers Simple',
      contractType: 'third_party' as const,
      description:
        'Formule de base couvrant la Responsabilité Civile obligatoire. Protection minimale conforme à la réglementation ivoirienne pour circuler en toute légalité.',
      priceMin: 25000,
      priceMax: 35000,
      coverageAmount: 50000000,
      deductible: 0,
      features: JSON.stringify([
        'RC obligatoire',
        'Assistance dépannage 24/7',
        'Défense pénale et recours',
        'Indemnisation des tiers jusqu\'à 50 000 000 FCFA',
      ]),
    },
    {
      name: 'Tiers Étendu',
      contractType: 'third_party_plus' as const,
      description:
        'Couverture élargie incluant la RC, les dommages par incendie, vol, catastrophe naturelle et bris de glace. Un excellent compromis prix/garanties.',
      priceMin: 65000,
      priceMax: 95000,
      coverageAmount: 50000000,
      deductible: 50000,
      features: JSON.stringify([
        'RC obligatoire',
        'Dommages par incendie',
        'Vol et tentative de vol',
        'Catastrophes naturelles',
        'Bris de glace',
        'Assistance dépannage 24/7',
        'Défense pénale et recours',
        'Véhicule de courtoisie 5 jours',
      ]),
    },
    {
      name: 'Tous Risques',
      contractType: 'all_risks' as const,
      description:
        'Protection complète incluant tous les sinistres, même ceux causés par votre faute. Indemnisation du véhicule à valeur de remplacement, plus les garanties étendues.',
      priceMin: 120000,
      priceMax: 180000,
      coverageAmount: 100000000,
      deductible: 100000,
      features: JSON.stringify([
        'RC obligatoire',
        'Dommages tous accidents',
        'Incendie et explosion',
        'Vol et tentative de vol',
        'Catastrophes naturelles et technologiques',
        'Bris de glace',
        'Assistance dépannage 24/7',
        'Défense pénale et recours',
        'Véhicule de courtoisie 10 jours',
        'Indemnisation à valeur à neuf (1ère année)',
        'Protection du conducteur',
        'Objets transportés',
      ]),
    },
  ]

  for (const offerData of noliaOffers) {
    const existing = await db.insuranceOffer.findFirst({
      where: {
        insurerId: noliaInsurer!.id,
        categoryId: autoCategory!.id,
        contractType: offerData.contractType,
      },
    })

    if (existing) {
      console.log(`   ⏭️  "${offerData.name}" (NOLIA) existe déjà — ignoré`)
    } else {
      const offer = await db.insuranceOffer.create({
        data: {
          insurerId: noliaInsurer!.id,
          categoryId: autoCategory!.id,
          ...offerData,
          isActive: true,
        },
      })
      console.log(
        `   ✅ "${offer.name}" créé — ${offer.contractType} — ${offer.priceMin?.toLocaleString('fr-FR')} - ${offer.priceMax?.toLocaleString('fr-FR')} FCFA`
      )
    }
  }

  // ── OFFERS FOR SUNU ──────────────────────────────────────────
  console.log('\n   📦 Offres SUNU Assurances IARD CI → Automobile')

  const sunuOffers = [
    {
      name: 'Tiers Simple',
      contractType: 'third_party' as const,
      description:
        'Couverture Responsabilité Civile conforme à l\'article 1 de l\'arrêté interministériel. Solution économique pour les véhicules anciens ou de faible valeur.',
      priceMin: 22000,
      priceMax: 32000,
      coverageAmount: 50000000,
      deductible: 0,
      features: JSON.stringify([
        'RC obligatoire',
        'Assistance dépannage 0-50 km',
        'Défense pénale',
        'Prise en charge tiers jusqu\'à 50M FCFA',
      ]),
    },
    {
      name: 'Tiers Étendu',
      contractType: 'third_party_plus' as const,
      description:
        'Formule intermédiaire idéale pour les véhicules de 3 à 7 ans. Ajoute les garanties incendie, vol, catastrophes naturelles et bris de glace à la RC de base.',
      priceMin: 58000,
      priceMax: 88000,
      coverageAmount: 50000000,
      deductible: 75000,
      features: JSON.stringify([
        'RC obligatoire',
        'Dommages par incendie',
        'Vol et tentative de vol',
        'Catastrophes naturelles',
        'Bris de glace',
        'Assistance 24h/24 et 7j/7',
        'Défense pénale et recours suite à accident',
        'Véhicule de courtoisie 3 jours',
      ]),
    },
    {
      name: 'Tous Risques Premium',
      contractType: 'all_risks' as const,
      description:
        'Notre offre phare. Couverture maximale avec prise en charge intégrale des dommages, y compris ceux causés par le conducteur. Tranquillité totale au quotidien.',
      priceMin: 135000,
      priceMax: 175000,
      coverageAmount: 150000000,
      deductible: 80000,
      features: JSON.stringify([
        'RC illimitée',
        'Dommages tous accidents y compris faute du conducteur',
        'Incendie, explosion, foudre',
        'Vol, tentative de vol, vandalisme',
        'Catastrophes naturelles et technologiques',
        'Bris de glace (pare-brise, lunettes)',
        'Assistance premium 24/7',
        'Défense pénale élargie',
        'Véhicule de courtoisie 15 jours',
        'Valeur à neuf 24 mois',
        'Protection corporelle du conducteur 10M FCFA',
        'Bagages et effets personnels 500 000 FCFA',
      ]),
    },
  ]

  for (const offerData of sunuOffers) {
    const existing = await db.insuranceOffer.findFirst({
      where: {
        insurerId: sunuInsurer!.id,
        categoryId: autoCategory!.id,
        contractType: offerData.contractType,
      },
    })

    if (existing) {
      console.log(`   ⏭️  "${offerData.name}" (SUNU) existe déjà — ignoré`)
    } else {
      const offer = await db.insuranceOffer.create({
        data: {
          insurerId: sunuInsurer!.id,
          categoryId: autoCategory!.id,
          ...offerData,
          isActive: true,
        },
      })
      console.log(
        `   ✅ "${offer.name}" créé — ${offer.contractType} — ${offer.priceMin?.toLocaleString('fr-FR')} - ${offer.priceMax?.toLocaleString('fr-FR')} FCFA`
      )
    }
  }

  // ── 4. QUOTES ─────────────────────────────────────────────────
  console.log('\n📝 [4/4] Devis pour le test user')

  // Get all offers linked to the Automobile category for both insurers
  const autoOffers = await db.insuranceOffer.findMany({
    where: {
      categoryId: autoCategory!.id,
      isActive: true,
    },
    include: {
      insurer: { select: { code: true, name: true } },
    },
  })

  // Check how many quotes already exist for this user
  const existingQuoteCount = await db.quote.count({
    where: { userId: testUser!.id },
  })

  if (existingQuoteCount >= 7) {
    console.log(`   ⏭️  ${existingQuoteCount} devis existent déjà — ignoré`)
  } else {
    const now = new Date()
    const quotesData = [
      // ── DRAFT ──
      {
        status: 'DRAFT' as const,
        vehicleData: JSON.stringify({
          marque: 'Toyota',
          modele: 'Corolla',
          immatriculation: 'CI-123-AB-456',
          puissance: '7CV',
          annee: '2022',
          carburant: 'ESSENCE',
          valeur: 8500000,
        }),
        personalData: JSON.stringify({
          nom: 'Kouamé',
          prenom: 'Amadou',
          tel: '+22507123456',
          email: 'user@test.ci',
        }),
        estimatedPrice: 32000,
        finalPrice: null,
        notes: 'Premier devis en cours de rédaction',
        daysAgo: 1,
        offerPicker: 'third_party',
        insurerCode: 'NOLIA',
      },
      {
        status: 'DRAFT' as const,
        vehicleData: JSON.stringify({
          marque: 'Hyundai',
          modele: 'Tucson',
          immatriculation: 'CI-987-CD-321',
          puissance: '9CV',
          annee: '2023',
          carburant: 'DIESEL',
          valeur: 14500000,
        }),
        personalData: JSON.stringify({
          nom: 'Kouamé',
          prenom: 'Amadou',
          tel: '+22507123456',
          email: 'user@test.ci',
        }),
        estimatedPrice: 68000,
        finalPrice: null,
        notes: 'Comparaison en cours — SUV familial',
        daysAgo: 0,
        offerPicker: 'third_party_plus',
        insurerCode: 'SUNU',
      },
      // ── PENDING ──
      {
        status: 'PENDING' as const,
        vehicleData: JSON.stringify({
          marque: 'Toyota',
          modele: 'RAV4',
          immatriculation: 'CI-456-EF-789',
          puissance: '8CV',
          annee: '2021',
          carburant: 'HYBRIDE',
          valeur: 12500000,
        }),
        personalData: JSON.stringify({
          nom: 'Kouamé',
          prenom: 'Amadou',
          tel: '+22507123456',
          email: 'user@test.ci',
        }),
        estimatedPrice: 125000,
        finalPrice: null,
        notes: 'En attente de validation par l\'assureur',
        daysAgo: 5,
        offerPicker: 'all_risks',
        insurerCode: 'NOLIA',
      },
      {
        status: 'PENDING' as const,
        vehicleData: JSON.stringify({
          marque: 'Peugeot',
          modele: '308',
          immatriculation: 'CI-111-GH-222',
          puissance: '6CV',
          annee: '2020',
          carburant: 'ESSENCE',
          valeur: 7200000,
        }),
        personalData: JSON.stringify({
          nom: 'Kouamé',
          prenom: 'Amadou',
          tel: '+22507123456',
          email: 'user@test.ci',
        }),
        estimatedPrice: 47000,
        finalPrice: null,
        notes: 'Documents complétés, en cours d\'étude',
        daysAgo: 12,
        offerPicker: 'third_party_plus',
        insurerCode: 'SUNU',
      },
      // ── APPROVED ──
      {
        status: 'APPROVED' as const,
        vehicleData: JSON.stringify({
          marque: 'Toyota',
          modele: 'Corolla',
          immatriculation: 'CI-123-AB-456',
          puissance: '7CV',
          annee: '2022',
          carburant: 'ESSENCE',
          valeur: 8500000,
        }),
        personalData: JSON.stringify({
          nom: 'Kouamé',
          prenom: 'Amadou',
          tel: '+22507123456',
          email: 'user@test.ci',
        }),
        estimatedPrice: 29000,
        finalPrice: 27550,
        notes: 'Devis approuvé — contrat envoyé par email',
        daysAgo: 25,
        offerPicker: 'third_party',
        insurerCode: 'NOLIA',
      },
      {
        status: 'APPROVED' as const,
        vehicleData: JSON.stringify({
          marque: 'Mercedes',
          modele: 'Classe C',
          immatriculation: 'CI-333-IJ-444',
          puissance: '11CV',
          annee: '2023',
          carburant: 'DIESEL',
          valeur: 22000000,
        }),
        personalData: JSON.stringify({
          nom: 'Kouamé',
          prenom: 'Amadou',
          tel: '+22507123456',
          email: 'user@test.ci',
        }),
        estimatedPrice: 165000,
        finalPrice: 157000,
        notes: 'Tous risques approuvé avec franchise réduite',
        daysAgo: 18,
        offerPicker: 'all_risks',
        insurerCode: 'SUNU',
      },
      // ── REJECTED ──
      {
        status: 'REJECTED' as const,
        vehicleData: JSON.stringify({
          marque: 'Renault',
          modele: 'Duster',
          immatriculation: 'CI-555-KL-666',
          puissance: '8CV',
          annee: '2019',
          carburant: 'DIESEL',
          valeur: 9800000,
        }),
        personalData: JSON.stringify({
          nom: 'Kouamé',
          prenom: 'Amadou',
          tel: '+22507123456',
          email: 'user@test.ci',
        }),
        estimatedPrice: 82000,
        finalPrice: null,
        notes: 'Rejeté — documents d\'immatriculation expirés, à renouveler',
        daysAgo: 20,
        offerPicker: 'third_party_plus',
        insurerCode: 'NOLIA',
      },
    ]

    // Determine how many new quotes we can create (max 7 total)
    const quotesToCreate = quotesData.slice(0, Math.max(0, 7 - existingQuoteCount))

    // Get the latest quote reference number
    const latestQuote = await db.quote.findFirst({
      where: { reference: { startsWith: 'DEV-' } },
      orderBy: { createdAt: 'desc' },
    })

    let nextRefNum = 1
    if (latestQuote?.reference) {
      const match = latestQuote.reference.match(/DEV-\d+-(\d+)/)
      if (match) {
        nextRefNum = parseInt(match[1], 10) + 1
      }
    }

    const currentYear = now.getFullYear()

    for (const qd of quotesToCreate) {
      const createdAt = new Date(now)
      createdAt.setDate(createdAt.getDate() - qd.daysAgo)
      createdAt.setHours(
        8 + Math.floor(Math.random() * 10),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60)
      )

      // Find matching offer
      const matchOffer = autoOffers.find(
        (o) =>
          o.contractType === qd.offerPicker &&
          o.insurer.code === qd.insurerCode
      )

      const reference = `DEV-${currentYear}-${String(nextRefNum).padStart(3, '0')}`
      nextRefNum++

      const quote = await db.quote.create({
        data: {
          reference,
          userId: testUser!.id,
          categoryId: autoCategory!.id,
          offerId: matchOffer?.id || null,
          status: qd.status,
          estimatedPrice: qd.estimatedPrice,
          finalPrice: qd.finalPrice,
          notes: qd.notes,
          vehicleData: qd.vehicleData,
          personalData: qd.personalData,
          coverageRequirements: JSON.stringify({}),
          createdAt,
        },
      })

      const statusEmoji =
        qd.status === 'DRAFT'
          ? '🗒️'
          : qd.status === 'PENDING'
          ? '⏳'
          : qd.status === 'APPROVED'
          ? '✅'
          : '❌'

      const priceInfo = qd.finalPrice
        ? `${qd.estimatedPrice.toLocaleString('fr-FR')} → ${qd.finalPrice.toLocaleString('fr-FR')} FCFA`
        : `${qd.estimatedPrice.toLocaleString('fr-FR')} FCFA`

      console.log(
        `   ${statusEmoji} ${reference} — ${qd.status.padEnd(9)} — ${priceInfo} — ${qd.insurerCode} ${qd.offerPicker} — il y a ${qd.daysAgo}j`
      )
    }
  }

  // ── SUMMARY ───────────────────────────────────────────────────
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ FINAL')

  const totalProfiles = await db.profile.count()
  const totalInsurers = await db.insurer.count()
  const totalCategories = await db.insuranceCategory.count()
  const totalOffers = await db.insuranceOffer.count()
  const totalQuotes = await db.quote.count()
  const userQuotes = await db.quote.count({ where: { userId: testUser!.id } })

  console.log(`   👤 Profils        : ${totalProfiles}`)
  console.log(`   🏢 Assureurs      : ${totalInsurers}`)
  console.log(`   📂 Catégories     : ${totalCategories}`)
  console.log(`   📦 Offres         : ${totalOffers}`)
  console.log(`   📝 Devis (total)  : ${totalQuotes}`)
  console.log(`   📝 Devis (user)   : ${userQuotes}`)
  console.log('\n✅ Seed terminé avec succès !')
  console.log('   Connexion test : user@test.ci / test123')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })