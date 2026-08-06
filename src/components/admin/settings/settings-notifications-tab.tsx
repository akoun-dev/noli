"use client";

import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { saveBtnClass, type SettingsCardProps } from "./settings-types";

export function SettingsNotificationsTab({
  getSetting,
  setSettingLocal,
  saveCategory,
  savingCategory,
}: SettingsCardProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand" />
          Paramètres de notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Canaux de notification
        </p>

        <div className="flex items-center justify-between">
          <Label>Email</Label>
          <Switch
            checked={
              getSetting("notification", "channel_email") !== "false"
            }
            onCheckedChange={(v) =>
              setSettingLocal("notification", "channel_email", String(v))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>SMS</Label>
          <Switch
            checked={getSetting("notification", "channel_sms") === "true"}
            onCheckedChange={(v) =>
              setSettingLocal("notification", "channel_sms", String(v))
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Push</Label>
          <Switch
            checked={
              getSetting("notification", "channel_push") === "true"
            }
            onCheckedChange={(v) =>
              setSettingLocal("notification", "channel_push", String(v))
            }
          />
        </div>

        <Separator />

        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Événements
        </p>

        <div className="flex items-center justify-between">
          <Label>Nouveau devis</Label>
          <Switch
            checked={
              getSetting("notification", "event_new_quote") !== "false"
            }
            onCheckedChange={(v) =>
              setSettingLocal(
                "notification",
                "event_new_quote",
                String(v)
              )
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Inscription utilisateur</Label>
          <Switch
            checked={
              getSetting("notification", "event_user_signup") !== "false"
            }
            onCheckedChange={(v) =>
              setSettingLocal(
                "notification",
                "event_user_signup",
                String(v)
              )
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Changement de statut de devis</Label>
          <Switch
            checked={
              getSetting("notification", "event_quote_status") !==
              "false"
            }
            onCheckedChange={(v) =>
              setSettingLocal(
                "notification",
                "event_quote_status",
                String(v)
              )
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Alertes système</Label>
          <Switch
            checked={
              getSetting("notification", "event_system_alert") !== "false"
            }
            onCheckedChange={(v) =>
              setSettingLocal(
                "notification",
                "event_system_alert",
                String(v)
              )
            }
          />
        </div>

        <div className="pt-2">
          <Button
            className={saveBtnClass}
            disabled={savingCategory === "notification"}
            onClick={() => saveCategory("notification")}
          >
            {savingCategory === "notification" && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
