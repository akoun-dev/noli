import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Minimize2, Maximize2, User, Bot, Clock, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: 'user' | 'bot' | 'advisor';
  content: string;
  timestamp: Date;
  status?: 'sent' | 'delivered' | 'read';
  advisorName?: string;
}

interface LiveChatProps {
  insurerName?: string;
}

const LiveChat = ({ insurerName }: LiveChatProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Bonjour ! Je suis l'assistant virtuel de NOLI. Comment puis-je vous aider aujourd'hui ?",
      timestamp: new Date(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connectedToAdvisor, setConnectedToAdvisor] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date(),
      status: 'sent'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot/advisor response
    setTimeout(() => {
      let response: Message;

      if (inputMessage.toLowerCase().includes('devis') || inputMessage.toLowerCase().includes('prix')) {
        response = {
          id: (Date.now() + 1).toString(),
          type: connectedToAdvisor ? 'advisor' : 'bot',
          content: connectedToAdvisor
            ? "Je vais vous préparer un devis personnalisé. Pourriez-vous me communiquer votre plaque d'immatriculation et votre kilométrage annuel ?"
            : "Pour obtenir un devis précis, je vous recommande de remplir notre formulaire en ligne ou de parler directement avec l'un de nos conseillers. Souhaitez-vous que je vous mette en relation avec un conseiller ?",
          timestamp: new Date(),
          advisorName: connectedToAdvisor ? "Marie K." : undefined
        };
      } else if (inputMessage.toLowerCase().includes('conseiller') || inputMessage.toLowerCase().includes('humain')) {
        setConnectedToAdvisor(true);
        response = {
          id: (Date.now() + 1).toString(),
          type: 'advisor',
          content: "Je vous mets en relation avec un conseiller spécialisé. Je suis Marie K., votre conseillère assurance. En quoi puis-je vous aider ?",
          timestamp: new Date(),
          advisorName: "Marie K."
        };
      } else if (inputMessage.toLowerCase().includes('merci')) {
        response = {
          id: (Date.now() + 1).toString(),
          type: connectedToAdvisor ? 'advisor' : 'bot',
          content: "Avec plaisir ! N'hésitez pas si vous avez d'autres questions.",
          timestamp: new Date(),
          advisorName: connectedToAdvisor ? "Marie K." : undefined
        };
      } else {
        const responses = [
          "Je comprends votre demande. Pouvez-vous me donner plus de détails ?",
          "C'est une excellente question. Pour mieux vous aider, pourriez-vous me préciser votre type de véhicule ?",
          "Je suis là pour vous aider. Avez-vous déjà consulté nos différentes formules d'assurance ?",
          "Merci pour votre message. Un conseiller vous contactera rapidement pour plus d'informations."
        ];
        response = {
          id: (Date.now() + 1).toString(),
          type: connectedToAdvisor ? 'advisor' : 'bot',
          content: responses[Math.floor(Math.random() * responses.length)],
          timestamp: new Date(),
          advisorName: connectedToAdvisor ? "Marie K." : undefined
        };
      }

      setMessages(prev => [...prev, response]);
      setIsTyping(false);

      // Update message status
      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === userMessage.id
            ? { ...msg, status: 'delivered' }
            : msg
        ));
      }, 1000);

      setTimeout(() => {
        setMessages(prev => prev.map(msg =>
          msg.id === userMessage.id
            ? { ...msg, status: 'read' }
            : msg
        ));
      }, 3000);
    }, 1000 + Math.random() * 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    const actions = {
      'devis': "Je voudrais obtenir un devis pour mon véhicule",
      'comparaison': "Je souhaite comparer plusieurs offres d'assurance",
      'information': "Je cherche des informations sur les garanties",
      'conseiller': "Je souhaite parler à un conseiller"
    };

    setInputMessage(actions[action as keyof typeof actions] || action);
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full w-16 h-16 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="sr-only">Ouvrir le chat</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed bottom-6 right-6 z-50 transition-all duration-300",
      isMinimized ? "w-80" : "w-96"
    )}>
      <Card className="shadow-xl border-2 border-primary/20">
        {/* Chat Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                {connectedToAdvisor ? (
                  <User className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <Bot className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              <div>
                <CardTitle className="text-lg">
                  {connectedToAdvisor ? "Marie K. - Conseillère" : "Assistant NOLI"}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-muted-foreground">
                    {connectedToAdvisor ? "En ligne" : "Disponible"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {connectedToAdvisor && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                Conseiller spécialisé - {insurerName || "Plusieurs assureurs"}
              </Badge>
            </div>
          )}
        </CardHeader>

        {!isMinimized && (
          <>
            <CardContent className="p-0">
              {/* Messages Area */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-3",
                      message.type === 'user' ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.type !== 'user' && (
                      <Avatar className="w-8 h-8 flex-shrink-0">
                        <AvatarFallback className={message.type === 'advisor' ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}>
                          {message.type === 'advisor' ? "MK" : "AI"}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn(
                      "max-w-[70%] rounded-lg px-3 py-2",
                      message.type === 'user'
                        ? "bg-primary text-primary-foreground"
                        : message.type === 'advisor'
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-muted"
                    )}>
                      <p className="text-sm">{message.content}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs opacity-70">
                          {formatTime(message.timestamp)}
                        </span>
                        {message.type === 'user' && message.status && (
                          <div className="ml-2">
                            {message.status === 'sent' && <Check className="w-3 h-3 opacity-70" />}
                            {message.status === 'delivered' && <CheckCheck className="w-3 h-3 opacity-70" />}
                            {message.status === 'read' && <CheckCheck className="w-3 h-3 text-blue-500" />}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-gray-100 text-gray-600">
                        {connectedToAdvisor ? "MK" : "AI"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Actions */}
              {messages.length === 1 && (
                <div className="p-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">Actions rapides :</p>
                  <div className="flex flex-wrap gap-2">
                    {['devis', 'comparaison', 'information', 'conseiller'].map((action) => (
                      <Button
                        key={action}
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickAction(action)}
                        className="text-xs"
                      >
                        {action === 'devis' && "Obtenir un devis"}
                        {action === 'comparaison' && "Comparer des offres"}
                        {action === 'information' && "Informations"}
                        {action === 'conseiller' && "Parler à un conseiller"}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Écrivez votre message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputMessage.trim() || isTyping}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {connectedToAdvisor
                    ? "Vous êtes en conversation avec un conseiller humain"
                    : "Vous parlez avec notre assistant virtuel"
                  }
                </p>
              </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};

export default LiveChat;