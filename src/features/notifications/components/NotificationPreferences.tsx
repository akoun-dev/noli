import { useState, useEffect } from 'react';
import { X, Save, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotifications } from '../hooks/useNotifications';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface NotificationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  isOpen,
  onClose,
}) => {
  const { preferences, updatePreferences, isSupported } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  // Reset local preferences when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalPreferences(preferences);
    }
  }, [isOpen, preferences]);

  const handleSave = () => {
    updatePreferences(localPreferences);
    onClose();
  };

  const handleCancel = () => {
    setLocalPreferences(preferences);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Préférences de notification</DialogTitle>
          <DialogDescription>
            Choisissez comment vous souhaitez être notifié
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Canaux de notification */}
          <div>
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Canaux de notification
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="push-notifications" className="text-sm font-medium cursor-pointer">
                    Notifications push
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications dans le navigateur
                  </p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={localPreferences.push && isSupported}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, push: checked }))
                  }
                  disabled={!isSupported}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="email-notifications" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications par email
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={localPreferences.email}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, email: checked }))
                  }
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="whatsapp-notifications" className="text-sm font-medium flex items-center gap-2 cursor-pointer">
                    <MessageSquare className="h-4 w-4" />
                    WhatsApp
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Notifications via WhatsApp
                  </p>
                </div>
                <Switch
                  id="whatsapp-notifications"
                  checked={localPreferences.whatsapp}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, whatsapp: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Types de notifications */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Types de notifications
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="quote-notifications" className="text-sm font-medium cursor-pointer">
                    Devis et comparaisons
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Nouveaux devis et résultats de comparaison
                  </p>
                </div>
                <Switch
                  id="quote-notifications"
                  checked={localPreferences.quotes}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, quotes: checked }))
                  }
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="policy-notifications" className="text-sm font-medium cursor-pointer">
                    Contrats d'assurance
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Mises à jour et renouvellements de contrats
                  </p>
                </div>
                <Switch
                  id="policy-notifications"
                  checked={localPreferences.policies}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, policies: checked }))
                  }
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="payment-notifications" className="text-sm font-medium cursor-pointer">
                    Paiements
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Échéances et confirmations de paiement
                  </p>
                </div>
                <Switch
                  id="payment-notifications"
                  checked={localPreferences.payments}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, payments: checked }))
                  }
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="space-y-0.5 flex-1">
                  <Label htmlFor="promotion-notifications" className="text-sm font-medium cursor-pointer">
                    Promotions et offres
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Offres spéciales et promotions
                  </p>
                </div>
                <Switch
                  id="promotion-notifications"
                  checked={localPreferences.promotions}
                  onCheckedChange={(checked) =>
                    setLocalPreferences(prev => ({ ...prev, promotions: checked }))
                  }
                />
              </div>
            </div>
          </div>

          {!isSupported && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Les notifications push ne sont pas supportées par ce navigateur.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={handleCancel}
            className="w-full sm:flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            className="w-full sm:flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Enregistrer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
