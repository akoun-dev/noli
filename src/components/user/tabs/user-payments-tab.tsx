"use client";

import { motion } from "framer-motion";
import { CreditCard, Smartphone, Building2, Wifi } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const paymentMethods = [
  {
    icon: Smartphone,
    name: "Mobile Money",
    description: "Orange Money, MTN MoMo, Moov Money",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    icon: Wifi,
    name: "Wave",
    description: "Paiement instantané via Wave",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  {
    icon: Smartphone,
    name: "Orange Money",
    description: "Paiement par code USSD ou app",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    icon: CreditCard,
    name: "Carte bancaire",
    description: "Visa, Mastercard",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  },
];

export function UserPaymentsTab() {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-xl font-bold">Paiements</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez vos paiements et consultez l&apos;historique.
        </p>
      </motion.div>

      {/* Empty state */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="text-center py-16"
      >
        <div className="rounded-full bg-muted p-5 mx-auto w-fit mb-5">
          <CreditCard className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">Aucun paiement enregistré</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Vos paiements apparaîtront ici après la souscription d&apos;un contrat d&apos;assurance.
        </p>
      </motion.div>

      {/* Payment methods */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <h3 className="text-base font-semibold mb-4">Moyens de paiement acceptés</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            return (
              <Card key={method.name} className="rounded-xl border bg-card">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`rounded-lg p-2.5 ${method.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{method.name}</p>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </motion.div>

      {/* Upcoming payments */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <h3 className="text-base font-semibold mb-4">Prochains paiements</h3>
        <Card className="rounded-xl border bg-card">
          <CardContent className="p-8 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Aucun paiement à venir. Les échéances de vos primes apparaîtront ici.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}