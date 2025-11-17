export interface QuoteUpdateEvent {
  quoteId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  timestamp: Date;
  message: string;
  insurerId?: string;
  userId: string;
}

export interface QuoteActivity {
  id: string;
  quoteId: string;
  action: string;
  description: string;
  timestamp: Date;
  performer: {
    id: string;
    name: string;
    role: 'user' | 'insurer' | 'admin';
  };
}

export interface RealTimeQuote {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
  currentStep: number;
  totalSteps: number;
  estimatedCompletion?: Date;
  assignedTo?: {
    id: string;
    name: string;
    role: 'insurer' | 'admin';
  };
  activities: QuoteActivity[];
  notifications: {
    email: boolean;
    whatsapp: boolean;
    sms: boolean;
  };
}

export class RealTimeService {
  private static instance: RealTimeService;
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private connectionStatus: 'connecting' | 'connected' | 'disconnected' = 'disconnected';

  private constructor() {
    this.initializeConnection();
  }

  static getInstance(): RealTimeService {
    if (!RealTimeService.instance) {
      RealTimeService.instance = new RealTimeService();
    }
    return RealTimeService.instance;
  }

  private initializeConnection(): void {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    this.connectionStatus = 'connecting';

    try {
      // In production, replace with actual WebSocket URL
      const wsUrl = process.env.NODE_ENV === 'production'
        ? 'wss://api.noliassurance.ci/realtime'
        : 'ws://localhost:8080/realtime';

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.connectionStatus = 'connected';
        this.reconnectAttempts = 0;
        this.broadcast('connection', { status: 'connected' });
        logger.info('✅ WebSocket connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          logger.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        this.connectionStatus = 'disconnected';
        this.broadcast('connection', { status: 'disconnected' });
        logger.info('❌ WebSocket disconnected');
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        logger.error('WebSocket error:', error);
        this.connectionStatus = 'disconnected';
      };

    } catch (error) {
      logger.error('Failed to initialize WebSocket:', error);
      this.connectionStatus = 'disconnected';
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.info('❌ Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

    logger.info(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      this.initializeConnection();
    }, delay);
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'quote_update':
        this.broadcast('quote_update', data.payload);
        break;
      case 'quote_activity':
        this.broadcast('quote_activity', data.payload);
        break;
      case 'status_change':
        this.broadcast('status_change', data.payload);
        break;
      case 'new_message':
        this.broadcast('new_message', data.payload);
        break;
      case 'system_notification':
        this.broadcast('system_notification', data.payload);
        break;
      default:
        logger.warn('Unknown message type:', data.type);
    }
  }

  // Subscription management
  subscribe(event: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }

    this.subscribers.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(event);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscribers.delete(event);
        }
      }
    };
  }

  private broadcast(event: string, data: any): void {
    const callbacks = this.subscribers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          logger.error('Error in subscriber callback:', error);
        }
      });
    }
  }

  // Quote tracking methods
  trackQuote(quoteId: string, userId: string): void {
    if (this.connectionStatus === 'connected') {
      this.ws?.send(JSON.stringify({
        type: 'track_quote',
        payload: { quoteId, userId }
      }));
    }
  }

  untrackQuote(quoteId: string): void {
    if (this.connectionStatus === 'connected') {
      this.ws?.send(JSON.stringify({
        type: 'untrack_quote',
        payload: { quoteId }
      }));
    }
  }

  // Mock real-time updates (for development without backend)
  static simulateQuoteUpdate(quoteId: string, updates: Partial<RealTimeQuote>): void {
    const instance = RealTimeService.getInstance();

    // Simulate real-time updates with random delays
    setTimeout(() => {
      instance.broadcast('quote_update', {
        quoteId,
        ...updates,
        timestamp: new Date()
      });
    }, Math.random() * 5000 + 1000);
  }

  static simulateQuoteActivity(quoteId: string, activity: Omit<QuoteActivity, 'id' | 'timestamp'>): void {
    const instance = RealTimeService.getInstance();

    const fullActivity: QuoteActivity = {
      id: `activity_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      ...activity
    };

    setTimeout(() => {
      instance.broadcast('quote_activity', {
        quoteId,
        activity: fullActivity
      });
    }, Math.random() * 3000 + 500);
  }

  // Get connection status
  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' {
    return this.connectionStatus;
  }

  // Send custom message
  sendMessage(type: string, payload: any): void {
    if (this.connectionStatus === 'connected') {
      this.ws?.send(JSON.stringify({ type, payload }));
    } else {
      logger.warn('Cannot send message: WebSocket not connected');
    }
  }

  // Disconnect
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connectionStatus = 'disconnected';
    }
  }

  // Reconnect manually
  reconnect(): void {
    this.reconnectAttempts = 0;
    this.initializeConnection();
  }
}

// React Hook for real-time quote tracking
export const useRealTimeQuote = (quoteId?: string) => {
  const [quoteData, setQuoteData] = useState<RealTimeQuote | null>(null);
  const [activities, setActivities] = useState<QuoteActivity[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const realtimeService = RealTimeService.getInstance();

    // Subscribe to connection status
    const unsubscribeConnection = realtimeService.subscribe('connection', (data) => {
      setConnectionStatus(data.status);
    });

    // Subscribe to quote updates if quoteId is provided
    let unsubscribeQuoteUpdate: (() => void) | undefined;
    let unsubscribeActivity: (() => void) | undefined;

    if (quoteId) {
      // Start tracking the quote
      realtimeService.trackQuote(quoteId, 'current-user-id'); // In real app, get from auth context

      unsubscribeQuoteUpdate = realtimeService.subscribe('quote_update', (data) => {
        if (data.quoteId === quoteId) {
          setQuoteData(data);
        }
      });

      unsubscribeActivity = realtimeService.subscribe('quote_activity', (data) => {
        if (data.quoteId === quoteId) {
          setActivities(prev => [data.activity, ...prev].slice(0, 50)); // Keep last 50 activities
        }
      });

      // Simulate some real-time updates for development
      if (process.env.NODE_ENV === 'development') {
        // Simulate status changes
        setTimeout(() => {
          RealTimeService.simulateQuoteUpdate(quoteId, {
            status: 'pending',
            currentStep: 2,
            totalSteps: 5,
            estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // 2 days from now
          });
        }, 2000);

        // Simulate activities
        setTimeout(() => {
          RealTimeService.simulateQuoteActivity(quoteId, {
            quoteId,
            action: 'review_started',
            description: 'L\'assureur a commencé la revue de votre demande',
            performer: {
              id: 'insurer_1',
              name: 'Agent NSIA',
              role: 'insurer'
            }
          });
        }, 4000);
      }
    }

    return () => {
      unsubscribeConnection();
      unsubscribeQuoteUpdate?.();
      unsubscribeActivity?.();

      if (quoteId) {
        realtimeService.untrackQuote(quoteId);
      }
    };
  }, [quoteId]);

  return {
    quoteData,
    activities,
    connectionStatus,
    isConnected: connectionStatus === 'connected'
  };
};

// Hook for global real-time updates
export const useRealTimeUpdates = () => {
  const [updates, setUpdates] = useState<QuoteUpdateEvent[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    const realtimeService = RealTimeService.getInstance();

    const unsubscribeConnection = realtimeService.subscribe('connection', (data) => {
      setConnectionStatus(data.status);
    });

    const unsubscribeUpdates = realtimeService.subscribe('quote_update', (data) => {
      setUpdates(prev => {
        const updateEvent: QuoteUpdateEvent = {
          quoteId: data.quoteId,
          status: data.status,
          timestamp: data.timestamp || new Date(),
          message: data.message || `Mise à jour du devis ${data.quoteId}`,
          insurerId: data.insurerId,
          userId: data.userId
        };

        // Keep only last 100 updates
        const newUpdates = [updateEvent, ...prev].slice(0, 100);
        return newUpdates;
      });
    });

    return () => {
      unsubscribeConnection();
      unsubscribeUpdates();
    };
  }, []);

  return {
    updates,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    clearUpdates: () => setUpdates([])
  };
};

// Auto-start simulation for development
if (process.env.NODE_ENV === 'development') {
  // Simulate periodic updates
  setInterval(() => {
    const realtimeService = RealTimeService.getInstance();
    if (realtimeService.getConnectionStatus() === 'connected') {
      // Simulate system notifications
      realtimeService.broadcast('system_notification', {
        type: 'info',
        message: 'Le système fonctionne normalement',
        timestamp: new Date()
      });
    }
  }, 30000); // Every 30 seconds
}