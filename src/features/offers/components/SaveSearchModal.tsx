import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Search } from "lucide-react";

interface SaveSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  searchName: string;
  onSearchNameChange: (name: string) => void;
  currentResults: number;
}

const SaveSearchModal = ({
  open,
  onOpenChange,
  onSave,
  searchName,
  onSearchNameChange,
  currentResults
}: SaveSearchModalProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchName.trim()) {
      onSave(searchName);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-md relative animate-in fade-in-90 zoom-in-90">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5" />
        </button>

        <CardHeader className="text-center pb-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Save className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-xl">Sauvegarder la recherche</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enregistrez vos filtres actuels pour y revenir plus tard
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="searchName" className="text-sm font-medium">
                Nom de la recherche
              </Label>
              <Input
                id="searchName"
                value={searchName}
                onChange={(e) => onSearchNameChange(e.target.value)}
                placeholder="Ma recherche d'assurance"
                className="mt-1"
                autoFocus
              />
            </div>

            {/* Search Summary */}
            <div className="bg-muted/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Résumé de la recherche</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentResults} offres correspondent à vos critères actuels
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!searchName.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Sauvegarder
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SaveSearchModal;