import { useState, useRef, useEffect } from 'react';
import {
  MessageCircle,
  Phone,
  Mail,
  Send,
  Paperclip,
  Calendar,
  Clock,
  User,
  MapPin,
  TrendingUp,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useClientCommunication } from '../hooks/useClientCommunication';
import { Client, Communication } from '../services/clientCommunicationService';

interface ClientContactPanelProps {
  client: Client;
  insurerId: string;
}

export const ClientContactPanel: React.FC<ClientContactPanelProps> = ({
  client,
  insurerId,
}) => {
  const {
    communications,
    sendCommunication,
    isLoading,
  } = useClientCommunication(insurerId);

  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<'email' | 'whatsapp' | 'phone'>('email');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [communications]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await sendCommunication(
        client.id,
        selectedChannel,
        message,
        subject || undefined
      );
      setMessage('');
      setSubject('');
    } catch (error) {
      logger.error('Erreur envoi message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR');
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'whatsapp':
        return <MessageCircle className="h-4 w-4" />;
      case 'phone':
        return <Phone className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-blue-600';
      case 'delivered':
        return 'text-green-600';
      case 'read':
        return 'text-purple-600';
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const preferredChannelIcon = () => {
    switch (client.preferredContactMethod) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-600" />;
      case 'phone':
        return <Phone className="h-5 w-5 text-green-600" />;
      case 'whatsapp':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Mail className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Informations client */}
      <div className="lg:col-span-1 space-y-4">
        <Card className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={client.avatar} />
              <AvatarFallback>
                {client.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{client.name}</h3>
              <Badge
                variant={client.status === 'active' ? 'default' : 'secondary'}
                className="mt-1"
              >
                {client.status === 'active' ? 'Client actif' :
                 client.status === 'prospect' ? 'Prospect' : 'Inactif'}
              </Badge>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{client.phone}</span>
            </div>
            {client.location && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{client.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Inscrit le {formatDate(client.registrationDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              {preferredChannelIcon()}
              <span>Préfère {client.preferredContactMethod === 'email' ? 'l\'email' :
                        client.preferredContactMethod === 'phone' ? 'le téléphone' : 'WhatsApp'}</span>
            </div>
          </div>
        </Card>

        {/* Statistiques */}
        <Card className="p-6">
          <h4 className="font-semibold mb-4">Statistiques</h4>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Devis demandés</span>
              <span className="font-medium">{client.totalQuotes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Devis convertis</span>
              <span className="font-medium">{client.convertedQuotes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Taux conversion</span>
              <span className="font-medium">
                {client.totalQuotes > 0
                  ? Math.round((client.convertedQuotes / client.totalQuotes) * 100)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Revenu total</span>
              <span className="font-medium">
                {client.totalRevenue.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>
        </Card>

        {/* Besoins d'assurance */}
        {client.insuranceNeeds && (
          <Card className="p-6">
            <h4 className="font-semibold mb-4">Besoins identifiés</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type véhicule</span>
                <span>{client.insuranceNeeds.vehicleType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Couverture</span>
                <span>{client.insuranceNeeds.coverageType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Budget</span>
                <span>{client.insuranceNeeds.budget.toLocaleString('fr-FR')} FCFA/an</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Communication */}
      <div className="lg:col-span-2">
        <Card className="h-[600px] flex flex-col">
          <Tabs defaultValue="messages" className="flex-1 flex flex-col">
            <div className="p-4 border-b">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="compose">Nouveau message</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="messages" className="flex-1 flex flex-col m-0">
              {/* Historique des messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {communications.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune communication avec ce client</p>
                  </div>
                ) : (
                  communications.map((comm) => (
                    <div
                      key={comm.id}
                      className={`flex gap-3 ${
                        comm.direction === 'outgoing' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div className={`max-w-[70%] ${
                        comm.direction === 'outgoing' ? 'order-2' : ''
                      }`}>
                        <div
                          className={`rounded-lg p-3 ${
                            comm.direction === 'outgoing'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {comm.subject && (
                            <p className="font-medium text-sm mb-1">{comm.subject}</p>
                          )}
                          <p className="text-sm">{comm.content}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            {getChannelIcon(comm.type)}
                          </div>
                          <span>{formatTime(comm.timestamp)}</span>
                          <div className={`flex items-center gap-1 ${getStatusColor(comm.status)}`}>
                            {comm.status === 'read' ? (
                              <div className="w-2 h-2 bg-current rounded-full" />
                            ) : comm.status === 'delivered' ? (
                              <div className="w-2 h-2 border-2 border-current rounded-full" />
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </TabsContent>

            <TabsContent value="compose" className="flex-1 p-4 m-0">
              <div className="space-y-4">
                {/* Canal de communication */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Canal de communication</label>
                  <Select value={selectedChannel} onValueChange={(value: any) => setSelectedChannel(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email
                        </div>
                      </SelectItem>
                      <SelectItem value="whatsapp">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </div>
                      </SelectItem>
                      <SelectItem value="phone">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Appel téléphonique
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sujet (pour email) */}
                {selectedChannel === 'email' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Sujet</label>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Sujet du message"
                    />
                  </div>
                )}

                {/* Message */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      selectedChannel === 'phone'
                        ? 'Notes pour l\'appel téléphonique...'
                        : 'Tapez votre message...'
                    }
                    rows={6}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                    disabled
                  >
                    <Paperclip className="h-4 w-4" />
                    Pièce jointe
                  </Button>

                  <Button
                    onClick={handleSendMessage}
                    disabled={!message.trim() || isSending}
                    className="flex items-center gap-2"
                  >
                    {isSending ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {selectedChannel === 'phone' ? 'Enregistrer les notes' : 'Envoyer'}
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};