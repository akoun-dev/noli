"use client";

import { SearchX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface EmptyResultsStateProps {
  onGoBack: () => void;
}

export function EmptyResultsState({ onGoBack }: EmptyResultsStateProps) {
  return (
    <section className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="rounded-full bg-muted/40 p-6 mb-6">
        <SearchX className="size-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Aucune offre trouvée</h2>
      <p className="text-muted-foreground mb-8 max-w-md">
        Aucune offre ne correspond à vos critères. Essayez de modifier
        vos paramètres de recherche.
      </p>
      <Button
        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full"
        onClick={onGoBack}
      >
        <ArrowLeft className="size-4 mr-2" />
        Modifier mes critères
      </Button>
    </section>
  )
}
