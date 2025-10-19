import { useState, useEffect, useRef } from 'react';
import {
  Send,
  Paperclip,
  MapPin,
  Phone,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Check,
  CheckCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChat } from '../hooks/useChat';
import { ChatMessage } from '../services/chatService';

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  roomId?: string;
  title?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  isOpen,
  onClose,
  roomId = 'room-1',
  title = 'Support NOLI',
}) => {
  const {
    messages,
    isConnected,
    isTyping,
    sendMessage,
    sendFile,
    sendLocation,
    markAllAsRead,
    sendTypingIndicator,
  } = useChat(roomId);

  const [message, setMessage] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollToBottom();
    markAllAsRead();
  }, [messages]);

  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !isConnected) return;

    const messageContent = message.trim();
    setMessage('');
    setIsTypingLocal(false);

    try {
      await sendMessage(messageContent);
    } catch (error) {
      logger.error('Erreur envoi message:', error);
      setMessage(messageContent); // Restaurer le message en cas d'erreur
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);
    if (!isTypingLocal && value.trim()) {
      setIsTypingLocal(true);
      sendTypingIndicator(true);
    } else if (isTypingLocal && !value.trim()) {
      setIsTypingLocal(false);
      sendTypingIndicator(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isConnected) {
      try {
        await sendFile(file);
      } catch (error) {
        logger.error('Erreur envoi fichier:', error);
      }
    }
  };

  const handleLocationShare = async () => {
    if (!navigator.geolocation) {
      alert('La géolocalisation n\'est pas supportée par votre navigateur');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        // Simuler l'adresse (remplacer par véritable géocodage)
        const address = 'Abidjan, Côte d\'Ivoire';

        try {
          await sendLocation({
            lat: latitude,
            lng: longitude,
            address,
          });
        } catch (error) {
          logger.error('Erreur envoi localisation:', error);
        }
      },
      (error) => {
        logger.error('Erreur géolocalisation:', error);
        alert('Impossible d\'obtenir votre localisation');
      }
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderMessage = (msg: ChatMessage) => {
    const isOwn = msg.senderRole === 'USER';
    const showStatus = isOwn && msg.type === 'text';

    return (
      <div
        key={msg.id}
        className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex max-w-[70%] ${isOwn ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
          {!isOwn && (
            <Avatar className="w-8 h-8 mt-1">
              <AvatarImage src="" />
              <AvatarFallback>
                {msg.senderName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          <div>
            <Card className={`p-3 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
              <p className="text-sm break-words">{msg.content}</p>
              {msg.type === 'file' && (
                <div className="flex items-center gap-2 mt-1">
                  <Paperclip className="h-3 w-3" />
                  <span className="text-xs opacity-70">
                    {msg.metadata?.fileName}
                  </span>
                </div>
              )}
              {msg.type === 'location' && (
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-3 w-3" />
                  <span className="text-xs opacity-70">
                    {msg.metadata?.location?.address}
                  </span>
                </div>
              )}
            </Card>
            <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'} text-xs text-muted-foreground`}>
              <span>{formatTime(msg.timestamp)}</span>
              {showStatus && (
                msg.read ? (
                  <CheckCheck className="h-3 w-3 text-blue-500" />
                ) : (
                  <Check className="h-3 w-3" />
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <Card
      className={`fixed bottom-4 right-4 z-50 shadow-xl border-2 ${
        isMinimized ? 'h-12' : isExpanded ? 'w-96 h-[600px]' : 'w-96 h-[500px]'
      } transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          <div>
            <h3 className="font-semibold text-sm">{title}</h3>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              <span className="text-xs opacity-80">
                {isConnected ? 'En ligne' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-background">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Aucun message pour le moment</p>
                <p className="text-xs mt-1">Tapez votre message ci-dessous</p>
              </div>
            ) : (
              messages.map(renderMessage)
            )}

            {/* Indicateur de frappe */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span>{isTyping.userName} est en train d'écrire...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-3 bg-muted/50">
            {!isConnected && (
              <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-600 text-center">
                  ⚠️ Connexion perdue - Reconnexion en cours...
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex gap-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!isConnected}
                  className="h-9 w-9 p-0"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLocationShare}
                  disabled={!isConnected}
                  className="h-9 w-9 p-0"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>

              <Input
                value={message}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez votre message..."
                disabled={!isConnected}
                className="flex-1"
              />

              <Button
                onClick={handleSendMessage}
                disabled={!message.trim() || !isConnected}
                size="sm"
                className="h-9 px-3"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>📆 Disponible 7j/7 - 8h à 20h</span>
              <span>🔐 Chiffrement de bout en bout</span>
            </div>
          </div>
        </>
      )}
    </Card>
  );
};