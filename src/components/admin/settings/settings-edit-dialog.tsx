"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveBtnClass, type Profile } from "./settings-types";

export interface EditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  edit: Profile | null;
  setEdit: (p: Profile | null) => void;
  onSave: () => void;
  saving: boolean;
}

export function SettingsEditDialog({
  open,
  onOpenChange,
  edit,
  setEdit,
  onSave,
  saving,
}: EditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier le profil</DialogTitle>
          <DialogDescription>
            Mettez à jour les informations du profil.
          </DialogDescription>
        </DialogHeader>
        {edit && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Prénom</Label>
                <Input
                  className="w-full"
                  value={edit.firstName || ""}
                  onChange={(e) =>
                    setEdit({ ...edit, firstName: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Nom</Label>
                <Input
                  className="w-full"
                  value={edit.lastName || ""}
                  onChange={(e) =>
                    setEdit({ ...edit, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Téléphone</Label>
                <Input
                  className="w-full"
                  value={edit.phone || ""}
                  onChange={(e) =>
                    setEdit({ ...edit, phone: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Rôle</Label>
                <Select
                  value={edit.role}
                  onValueChange={(v) => setEdit({ ...edit, role: v })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">Utilisateur</SelectItem>
                    <SelectItem value="INSURER">Assureur</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Actif</Label>
              <Switch
                checked={edit.isActive}
                onCheckedChange={(v) => setEdit({ ...edit, isActive: v })}
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={onSave}
            disabled={saving}
            className={saveBtnClass}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
