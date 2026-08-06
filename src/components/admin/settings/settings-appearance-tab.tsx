"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Palette, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveBtnClass, type SettingsCardProps } from "./settings-types";

export function SettingsAppearanceTab({
  getSetting,
  setSettingLocal,
  saveCategory,
  savingCategory,
}: SettingsCardProps) {
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-brand" />
          Apparence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-2 w-full">
          <Label htmlFor="theme-select">Thème</Label>
          <Select
            value={mounted ? (theme ?? "system") : "system"}
            onValueChange={(v) => {
              setTheme(v);
              setSettingLocal("appearance", "theme", v);
            }}
          >
            <SelectTrigger id="theme-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Clair</SelectItem>
              <SelectItem value="dark">Sombre</SelectItem>
              <SelectItem value="system">Système</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full">
          <Label htmlFor="lang-select">Langue</Label>
          <Select
            value={getSetting("appearance", "language", "fr")}
            onValueChange={(v) =>
              setSettingLocal("appearance", "language", v)
            }
          >
            <SelectTrigger id="lang-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full">
          <Label htmlFor="date-format-select">Format de date</Label>
          <Select
            value={getSetting(
              "appearance",
              "date_format",
              "dd/MM/yyyy"
            )}
            onValueChange={(v) =>
              setSettingLocal("appearance", "date_format", v)
            }
          >
            <SelectTrigger id="date-format-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dd/MM/yyyy">dd/MM/yyyy</SelectItem>
              <SelectItem value="MM/dd/yyyy">MM/dd/yyyy</SelectItem>
              <SelectItem value="yyyy-MM-dd">yyyy-MM-dd</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-2 w-full">
          <Label htmlFor="tz-select">Fuseau horaire</Label>
          <Select
            value={getSetting(
              "appearance",
              "timezone",
              "Africa/Abidjan"
            )}
            onValueChange={(v) =>
              setSettingLocal("appearance", "timezone", v)
            }
          >
            <SelectTrigger id="tz-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Africa/Abidjan">
                Africa/Abidjan
              </SelectItem>
              <SelectItem value="Africa/Lagos">Africa/Lagos</SelectItem>
              <SelectItem value="UTC">UTC</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-2">
          <Button
            className={saveBtnClass}
            disabled={savingCategory === "appearance"}
            onClick={() => saveCategory("appearance")}
          >
            {savingCategory === "appearance" && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Enregistrer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
