"use client";

import { Shield, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { saveBtnClass, type SettingsCardProps } from "./settings-types";

export function SettingsSecurityTab({
  getSetting,
  setSettingLocal,
  saveCategory,
  savingCategory,
}: SettingsCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand" />
          Politique de sécurité
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Mot de passe
        </p>

        <div className="grid gap-2">
          <Label htmlFor="min-length">
            Longueur minimale du mot de passe
          </Label>
          <Input
            id="min-length"
            type="number"
            min={6}
            max={32}
            value={getSetting("security", "password_min_length", "8")}
            onChange={(e) =>
              setSettingLocal(
                "security",
                "password_min_length",
                e.target.value
              )
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Requérir des majuscules</Label>
          <Switch
            checked={
              getSetting("security", "password_require_uppercase") ===
              "true"
            }
            onCheckedChange={(v) =>
              setSettingLocal(
                "security",
                "password_require_uppercase",
                String(v)
              )
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Requérir des minuscules</Label>
          <Switch
            checked={
              getSetting("security", "password_require_lowercase") ===
              "true"
            }
            onCheckedChange={(v) =>
              setSettingLocal(
                "security",
                "password_require_lowercase",
                String(v)
              )
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Requérir des chiffres</Label>
          <Switch
            checked={
              getSetting("security", "password_require_numbers") ===
              "true"
            }
            onCheckedChange={(v) =>
              setSettingLocal(
                "security",
                "password_require_numbers",
                String(v)
              )
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Requérir des caractères spéciaux</Label>
          <Switch
            checked={
              getSetting("security", "password_require_special") ===
              "true"
            }
            onCheckedChange={(v) =>
              setSettingLocal(
                "security",
                "password_require_special",
                String(v)
              )
            }
          />
        </div>

        <Separator />

        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Connexion et sessions
        </p>

        <div className="grid gap-2">
          <Label htmlFor="max-attempts">
            Tentatives de connexion max avant verrouillage
          </Label>
          <Input
            id="max-attempts"
            type="number"
            value={getSetting("security", "max_login_attempts", "5")}
            onChange={(e) =>
              setSettingLocal(
                "security",
                "max_login_attempts",
                e.target.value
              )
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="lockout-duration">
            Durée de verrouillage (minutes)
          </Label>
          <Input
            id="lockout-duration"
            type="number"
            value={getSetting("security", "lockout_duration", "30")}
            onChange={(e) =>
              setSettingLocal(
                "security",
                "lockout_duration",
                e.target.value
              )
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="session-expiry">
            Délai d&apos;expiration de session (minutes)
          </Label>
          <Input
            id="session-expiry"
            type="number"
            value={getSetting(
              "security",
              "session_expiry_minutes",
              "60"
            )}
            onChange={(e) =>
              setSettingLocal(
                "security",
                "session_expiry_minutes",
                e.target.value
              )
            }
          />
        </div>

        <div className="pt-2">
          <Button
            className={saveBtnClass}
            disabled={savingCategory === "security"}
            onClick={() => saveCategory("security")}
          >
            {savingCategory === "security" && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
