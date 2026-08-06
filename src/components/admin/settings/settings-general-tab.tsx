"use client";

import { Settings, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { saveBtnClass, type SettingsCardProps } from "./settings-types";

export function SettingsGeneralTab({
  getSetting,
  setSettingLocal,
  saveCategory,
  savingCategory,
}: SettingsCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand" />
          Paramètres généraux
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2">
          <Label htmlFor="site-name">Nom du site</Label>
          <Input
            id="site-name"
            value={getSetting("general", "site_name", "NOLI Assurance")}
            onChange={(e) =>
              setSettingLocal("general", "site_name", e.target.value)
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="site-email">Email du site</Label>
          <Input
            id="site-email"
            type="email"
            value={getSetting("general", "site_email", "contact@noli.ci")}
            onChange={(e) =>
              setSettingLocal("general", "site_email", e.target.value)
            }
          />
        </div>

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <Label>Mode maintenance</Label>
            <p className="text-sm text-muted-foreground">
              Activez pour afficher un message aux visiteurs
            </p>
          </div>
          <Switch
            checked={getSetting("general", "maintenance_mode") === "true"}
            onCheckedChange={(v) =>
              setSettingLocal("general", "maintenance_mode", String(v))
            }
          />
        </div>

        {getSetting("general", "maintenance_mode") === "true" && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-400 bg-amber-50 dark:bg-amber-950/40 p-4 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              Le site est actuellement en mode maintenance. Les visiteurs
              verront un message d&apos;avertissement.
            </p>
          </div>
        )}

        <div className="pt-2">
          <Button
            className={saveBtnClass}
            disabled={savingCategory === "general"}
            onClick={() => saveCategory("general")}
          >
            {savingCategory === "general" && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
