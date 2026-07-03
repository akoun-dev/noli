"use client";

import { motion } from "framer-motion";
import { Bell, AlertCircle, Calendar, FileText, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const notificationTypes = [
  {
    icon: FileText,
    title: "Alertes devis",
    description: "Mises à jour sur l'état de vos devis (approuvé, rejeté, en attente).",
  },
  {
    icon: Calendar,
    title: "Rappels d'échéance",
    description: "Rappels avant les dates limites de paiement de vos primes.",
  },
  {
    icon: Info,
    title: "Informations compte",
    description: "Notifications liées à votre compte (profil, sécurité, etc.).",
  },
  {
    icon: AlertCircle,
    title: "Alertes importantes",
    description: "Notifications urgentes concernant vos contrats ou documents.",
  },
];

export function UserNotificationsTab() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold">Notifications</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Restez informé de l&apos;actualité de vos demandes et contrats.
        </p>
      </motion.div>

      {/* Empty state */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-center py-20"
      >
        <div className="rounded-full bg-muted p-5 mx-auto w-fit mb-5">
          <Bell className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucune notification</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Vous n&apos;avez pas de notifications pour le moment. Vos alertes
          apparaîtront ici lorsque vos devis seront traités ou que des échéances
          approcheront.
        </p>
      </motion.div>

      {/* Notification types */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="text-base font-semibold mb-4">Types de notifications</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {notificationTypes.map((nt) => {
            const Icon = nt.icon;
            return (
              <Card key={nt.title} className="rounded-xl border bg-card">
                <CardContent className="p-5 flex items-start gap-4">
                  <div className="rounded-lg bg-muted p-2.5 shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{nt.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {nt.description}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}