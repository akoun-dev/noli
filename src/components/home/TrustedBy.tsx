const TrustedBy = () => {
  const brands = ["SUNU", "NSIA", "SAHAM", "ATLANTIQUE", "ALLIANZ", "LA LOYALE"];

  return (
    <section className="py-10 px-4 bg-background">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center text-sm text-muted-foreground mb-6">
          Des assureurs partenaires de confiance
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center">
          {brands.map((b) => (
            <div key={b} className="h-10 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity">
              <span className="font-semibold tracking-wide text-foreground/70">{b}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBy;

