import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Bell, MessageCircle, MessageSquare, Send } from 'lucide-react';
import { NotificationPreferences } from '../types/notification';
import { useUpdateNotificationPreferences, useSendTestNotification } from '../services/notificationService';
import { toast } from 'sonner';

interface NotificationPreferencesProps {
  preferences: NotificationPreferences;
  isLoading?: boolean;
}

const categories = [
  { key: 'quoteUpdates', label: 'Mises à jour des devis', description: 'Notifications sur les changements de statut de vos devis' },
  { key: 'policyRenewals', label: 'Renouvellements de contrats', description: 'Rappels avant expiration de vos contrats' },
  { key: 'paymentReminders', label: 'Rappels de paiement', description: 'Notifications pour les échéances de paiement' },
  { key: 'marketing', label: 'Marketing', description: 'Offres promotionnelles et communications marketing' },
  { key: 'systemAlerts', label: 'Alertes système', description: 'Notifications importantes sur le système' },
];

const channels = [
  { key: 'email', label: 'Email', icon: Mail, color: 'bg-blue-100 text-blue-800' },
  { key: 'push', label: 'Push', icon: Bell, color: 'bg-green-100 text-green-800' },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, color: 'bg-green-100 text-green-800' },
  { key: 'sms', label: 'SMS', icon: MessageSquare, color: 'bg-purple-100 text-purple-800' },
];

export const NotificationPreferencesComponent: React.FC<NotificationPreferencesProps> = ({
  preferences,
  isLoading = false,
}) => {
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(() => ({
    email: {
      quoteUpdates: preferences?.email?.quoteUpdates ?? false,
      policyRenewals: preferences?.email?.policyRenewals ?? false,
      paymentReminders: preferences?.email?.paymentReminders ?? false,
      marketing: preferences?.email?.marketing ?? false,
      systemAlerts: preferences?.email?.systemAlerts ?? false,
    },
    push: {
      quoteUpdates: preferences?.push?.quoteUpdates ?? false,
      policyRenewals: preferences?.push?.policyRenewals ?? false,
      paymentReminders: preferences?.push?.paymentReminders ?? false,
      marketing: preferences?.push?.marketing ?? false,
      systemAlerts: preferences?.push?.systemAlerts ?? false,
    },
    whatsapp: {
      quoteUpdates: preferences?.whatsapp?.quoteUpdates ?? false,
      policyRenewals: preferences?.whatsapp?.policyRenewals ?? false,
      paymentReminders: preferences?.whatsapp?.paymentReminders ?? false,
      marketing: preferences?.whatsapp?.marketing ?? false,
      systemAlerts: preferences?.whatsapp?.systemAlerts ?? false,
    },
    sms: {
      quoteUpdates: preferences?.sms?.quoteUpdates ?? false,
      policyRenewals: preferences?.sms?.policyRenewals ?? false,
      paymentReminders: preferences?.sms?.paymentReminders ?? false,
      systemAlerts: preferences?.sms?.systemAlerts ?? false,
    },
  }));
  const { mutate: updatePreferences, isPending: isUpdating } = useUpdateNotificationPreferences();
  const { mutate: sendTestNotification, isPending: isSending } = useSendTestNotification();

  const handlePreferenceChange = (channel: keyof NotificationPreferences, category: string, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      [channel]: {
        ...(prev[channel] || {}),
        [category]: value,
      },
    }));
  };

  const handleSave = () => {
    updatePreferences(localPreferences);
  };

  const handleSendTest = (channel: 'email' | 'push' | 'whatsapp') => {
    sendTestNotification(channel);
  };

  const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Préférences de notification</h2>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">
            Gérez comment vous souhaitez recevoir les notifications
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isUpdating || isLoading}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Send className="h-4 w-4" />
          {isUpdating ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>

      <Tabs defaultValue="email" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          {channels.slice(0, 4).map((channel) => (
            <TabsTrigger key={channel.key} value={channel.key} className="flex items-center gap-1 sm:gap-2 py-2 px-2 sm:px-4 text-xs sm:text-sm">
              <channel.icon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>{channel.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {channels.map((channel) => (
          <TabsContent key={channel.key} value={channel.key} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <channel.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-sm sm:text-base">Notifications par {channel.label}</span>
                  </CardTitle>
                  <Badge className={channel.color}>
                    {channel.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6">
                <div className="grid gap-3 sm:gap-4">
                  {categories.map((category) => (
                    <div
                      key={`${channel.key}-${category.key}`}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm sm:text-base">{category.label}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                          {category.description}
                        </div>
                      </div>
                      <Switch
                        checked={localPreferences[channel.key as keyof NotificationPreferences]?.[category.key as keyof typeof localPreferences.email] ?? false}
                        onCheckedChange={(checked) =>
                          handlePreferenceChange(
                            channel.key as keyof NotificationPreferences,
                            category.key,
                            checked
                          )
                        }
                        disabled={isLoading}
                      />
                    </div>
                  ))}
                </div>

                {channel.key !== 'sms' && (
                  <div className="pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => handleSendTest(channel.key as 'email' | 'push' | 'whatsapp')}
                      disabled={isSending}
                      className="w-full"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSending ? 'Envoi...' : `Envoyer une notification test par ${channel.label}`}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Résumé des préférences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {channels.map((channel) => {
              const channelPrefs = localPreferences[channel.key as keyof NotificationPreferences] || {};
              const enabledCount = Object.values(channelPrefs).filter(Boolean).length;
              const totalCount = Object.keys(channelPrefs).length;

              return (
                <div key={channel.key} className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <channel.icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{channel.label}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {enabledCount} sur {totalCount} activées
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-200"
                      style={{ width: `${(enabledCount / totalCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};