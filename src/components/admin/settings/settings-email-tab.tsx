"use client";

import { Mail, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveBtnClass, type SettingsCardProps } from "./settings-types";

export function SettingsEmailTab({
  getSetting,
  setSettingLocal,
  saveCategory,
  savingCategory,
}: SettingsCardProps) {
  const { toast } = useToast();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-brand" />
          Configuration Email (SMTP)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Label>Activer l&apos;envoi d&apos;emails</Label>
            <p className="text-sm text-muted-foreground">
              Permet l&apos;envoi d&apos;emails via serveur SMTP
            </p>
          </div>
          <Switch
            checked={getSetting("email", "smtp_enabled") === "true"}
            onCheckedChange={(v) =>
              setSettingLocal("email", "smtp_enabled", String(v))
            }
          />
        </div>

        <Separator />

        <div className="grid gap-2">
          <Label htmlFor="smtp-host">Hôte SMTP</Label>
          <Input
            id="smtp-host"
            value={getSetting("email", "smtp_host")}
            onChange={(e) =>
              setSettingLocal("email", "smtp_host", e.target.value)
            }
            placeholder="smtp.exemple.com"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="smtp-port">Port SMTP</Label>
            <Input
              id="smtp-port"
              type="number"
              value={getSetting("email", "smtp_port", "587")}
              onChange={(e) =>
                setSettingLocal("email", "smtp_port", e.target.value)
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="smtp-encryption">Chiffrement</Label>
            <Select
              value={getSetting("email", "smtp_encryption", "tls")}
              onValueChange={(v) =>
                setSettingLocal("email", "smtp_encryption", v)
              }
            >
              <SelectTrigger id="smtp-encryption">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tls">TLS</SelectItem>
                <SelectItem value="ssl">SSL</SelectItem>
                <SelectItem value="none">Aucun</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="smtp-user">Utilisateur SMTP</Label>
          <Input
            id="smtp-user"
            value={getSetting("email", "smtp_user")}
            onChange={(e) =>
              setSettingLocal("email", "smtp_user", e.target.value)
            }
            placeholder="user@exemple.com"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="smtp-pass">Mot de passe SMTP</Label>
          <Input
            id="smtp-pass"
            type="password"
            value={getSetting("email", "smtp_password")}
            onChange={(e) =>
              setSettingLocal("email", "smtp_password", e.target.value)
            }
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="smtp-from">Email expéditeur</Label>
          <Input
            id="smtp-from"
            type="email"
            value={getSetting("email", "smtp_from", "noreply@noli.ci")}
            onChange={(e) =>
              setSettingLocal("email", "smtp_from", e.target.value)
            }
          />
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button
            className={saveBtnClass}
            disabled={savingCategory === "email"}
            onClick={() => saveCategory("email")}
          >
            {savingCategory === "email" && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Enregistrer
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              toast({ title: "Email de test envoyé" })
            }
          >
            <Send className="h-4 w-4 mr-2" />
            Envoyer un email test
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
