"use client";

export function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20 md:py-28">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <div className="animate-slide-up">
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-4xl font-bold tracking-tight text-foreground md:text-5xl">
              Mentions Légales
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Informations légales relatives à la plateforme NOLI
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <div className="prose prose-sm prose-gray dark:prose-invert max-w-none space-y-8">
          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground mb-3">
              Éditeur de la plateforme
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              La plateforme NOLI est éditée par la société <strong>NOLI SAS</strong>, société par actions simplifiée au capital de 10 000 000 FCFA, immatriculée au Registre du Commerce et du Crédit Mobilier (RCCM) sous le numéro CI-ABJ-2025-B-010101.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <li><strong>Siège social :</strong> Zone 4, Rue du Commerce, Abidjan, Côte d&apos;Ivoire</li>
              <li><strong>Email :</strong> contact@noli.ci</li>
              <li><strong>Téléphone :</strong> +225 27 00 00 00 00</li>
              <li><strong>Directeur de la publication :</strong> M. A. Koun</li>
            </ul>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground mb-3">
              Hébergement
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              La plateforme NOLI est hébergée par <strong>OVH SAS</strong>, 2 Rue Kellermann, 59100 Roubaix, France. Numéro de téléphone : +33 9 72 10 10 07.
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground mb-3">
              Propriété intellectuelle
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              L&apos;ensemble des contenus de la plateforme NOLI (textes, graphismes, logos, icônes, images, vidéos, etc.) est protégé par le droit d&apos;auteur et le droit des marques. Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite sans l&apos;autorisation écrite préalable de NOLI SAS.
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground mb-3">
              Protection des données personnelles
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Conformément à la Loi relative à la Protection des Données à Caractère Personnel (LPD) et au Règlement Général sur la Protection des Données (RGPD), vous disposez d&apos;un droit d&apos;accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant à l&apos;adresse email : contact@noli.ci.
            </p>
            <p className="mt-3 text-muted-foreground leading-relaxed">
              Les données collectées via la plateforme sont utilisées uniquement dans le cadre de la fourniture de nos services de comparaison d&apos;assurances et ne sont jamais cédées à des tiers sans votre consentement explicite.
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground mb-3">
              Cookies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              La plateforme NOLI utilise des cookies strictement nécessaires à son fonctionnement (session utilisateur, préférences d&apos;affichage). Aucun cookie publicitaire ou de traçage n&apos;est déposé sans votre consentement préalable. Vous pouvez à tout moment paramétrer vos préférences via les paramètres de votre navigateur.
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground mb-3">
              Responsabilité
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              NOLI SAS s&apos;efforce de fournir des informations aussi précises que possible. Toutefois, elle ne pourra être tenue responsable des omissions, inexactitudes ou carences dans les informations fournies par les assureurs partenaires. Les comparaisons et tarifs affichés sont fournis à titre indicatif et ne constituent en aucun cas un engagement contractuel.
            </p>
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-space-grotesk)] text-xl font-bold text-foreground mb-3">
              Droit applicable
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes mentions légales sont régies par le droit ivoirien. Tout litige relatif à leur interprétation ou à leur exécution relève de la compétence des tribunaux d&apos;Abidjan.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
