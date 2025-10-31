import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Mail, Bell, MessageCircle, MessageSquare, Send } from 'lucide-react';
import { NotificationPreferences } from '../../notifications/services/notificationService';
import { useUpdateNotificationPreferences } from '../../notifications/services/notificationService';
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
  const userId = preferences?.userId || '1'; // Get userId from preferences or use default
  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(() => ({
    ...preferences,
    channels: {
      email: preferences?.channels?.email ?? false,
      sms: preferences?.channels?.sms ?? false,
      whatsapp: preferences?.channels?.whatsapp ?? false,
      push: preferences?.channels?.push ?? false,
      inApp: preferences?.channels?.inApp ?? false,
    },
    categories: preferences?.categories || {
      quotes: { enabled: true, channels: ['in_app', 'email'] },
      payments: { enabled: true, channels: ['in_app', 'email'] },
      policies: { enabled: true, channels: ['in_app', 'email', 'sms'] },
      account: { enabled: true, channels: ['in_app', 'email'] },
      security: { enabled: true, channels: ['in_app', 'email', 'sms'] },
      system: { enabled: true, channels: ['in_app'] },
      marketing: { enabled: false, channels: [] },
      support: { enabled: true, channels: ['in_app', 'email'] },
    },
    quietHours: preferences?.quietHours || {
      enabled: true,
      startTime: '22:00',
      endTime: '08:00',
    },
    frequency: preferences?.frequency || 'immediate',
  }));
  const { mutate: updatePreferences, isPending: isUpdating } = useUpdateNotificationPreferences();
  const isSending = false;

  const handlePreferenceChange = (channel: string, category: string, value: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: value,
      },
    }));
  };

  const handleSave = () => {
    updatePreferences({
      userId,
      preferences: localPreferences
    });
  };

  const handleSendTest = (channel: 'email' | 'push' | 'whatsapp') => {
    // sendTestNotification(channel);
    console.log(`Test notification sent to ${channel}`);
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Préférences de notification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <div className="grid gap-3 sm:gap-4">
            {channels.map((channel) => (
              <div
                key={channel.key}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 sm:p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-sm sm:text-base">
                    <channel.icon className="h-4 w-4" />
                    <span>Notifications par {channel.label}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Recevoir des notifications via {channel.label}
                  </div>
                </div>
                <Switch
                  checked={localPreferences.channels[channel.key as keyof typeof localPreferences.channels] ?? false}
                  onCheckedChange={(checked) =>
                    handlePreferenceChange(channel.key, '', checked)
                  }
                  disabled={isLoading}
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => handleSendTest('email')}
              disabled={isSending}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? 'Envoi...' : 'Envoyer une notification test par email'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Résumé des préférences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {channels.map((channel) => {
              const isEnabled = localPreferences.channels[channel.key as keyof typeof localPreferences.channels] ?? false;

              return (
                <div key={channel.key} className="p-3 sm:p-4 border rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <channel.icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{channel.label}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-muted-foreground">
                    {isEnabled ? 'Activé' : 'Désactivé'}
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 mt-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-200"
                      style={{ width: isEnabled ? '100%' : '0%' }}
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