import { useState, useEffect } from 'react';
import { MessageCircle, X, Bell, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatInterface } from './ChatInterface';
import { useNotifications } from '@/features/notifications/hooks/useNotifications';

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  const { showNotification } = useNotifications();

  useEffect(() => {
    // Simuler des notifications de chat
    const interval = setInterval(() => {
      if (!isOpen && Math.random() > 0.7) {
        setUnreadCount(prev => prev + 1);
        showNotification({
          id: `chat-notification-${Date.now()}`,
          title: 'Nouveau message',
          message: 'Un conseiller vous a envoyé un message',
          type: 'info',
          timestamp: new Date(),
          read: false,
          actionUrl: '#',
          actionText: 'Voir le message',
        });
      }
    }, 30000); // Toutes les 30 secondes

    return () => clearInterval(interval);
  }, [isOpen, showNotification]);

  const handleChatOpen = () => {
    setIsOpen(true);
    setUnreadCount(0);
    setIsMinimized(false);
  };

  const handleChatClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleMinimize = () => {
    setIsMinimized(true);
  };

  return (
    <>
      {/* Bouton de chat flottant */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="relative">
            <Button
              onClick={handleChatOpen}
              size="lg"
              className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <MessageCircle className="h-6 w-6" />
            </Button>

            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-xs flex items-center justify-center animate-pulse"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}

            {/* Indicateur de statut */}
            <div className="absolute bottom-0 right-0 h-4 w-4 bg-green-500 border-2 border-background rounded-full" />
          </div>
        </div>
      )}

      {/* Fenêtre de chat minimisée */}
      {isMinimized && (
        <div className="fixed bottom-4 right-4 z-40">
          <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-3 flex items-center gap-3 min-w-[200px]">
            <MessageCircle className="h-5 w-5" />
            <div className="flex-1">
              <p className="text-sm font-medium">Support NOLI</p>
              <p className="text-xs opacity-80">Conversation en cours...</p>
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <Badge variant="secondary" className="h-5 px-2 text-xs">
                  {unreadCount}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(false)}
                className="h-6 w-6 p-0 text-primary-foreground hover:bg-primary-foreground/20"
              >
                ↑
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Interface de chat complète */}
      {isOpen && (
        <ChatInterface
          isOpen={isOpen}
          onClose={handleChatClose}
          title="Support NOLI"
        />
      )}

      {/* Options rapides quand le chat est fermé */}
      {!isOpen && (
        <div className="fixed bottom-20 right-4 z-30 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open('tel:+2252720000000')}
            className="flex items-center gap-2 shadow-lg bg-background"
          >
            <Phone className="h-4 w-4" />
            Appeler
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/contact'}
            className="flex items-center gap-2 shadow-lg bg-background"
          >
            <Bell className="h-4 w-4" />
            Rappel gratuit
          </Button>
        </div>
      )}
    </>
  );
};