# Module Chat - Documentation

## 🎯 Objectif du Module

Le module Chat fournit un système de communication temps réel complet pour la plateforme NOLI, permettant aux utilisateurs d'interagir avec les conseillers, aux assureurs de communiquer avec leurs clients, et d'offrir un support client exceptionnel.

## 📋 Fonctionnalités Principales

### 1. Chat en Temps Réel
- **Description**: Interface de messagerie instantanée performante et intuitive
- **Sous-fonctionnalités**:
  - Messagerie instantanée avec latence minimale
  - Indicateurs de présence (en ligne, absent, occupé)
  - Notifications de nouveaux messages
  - Accusés de lecture et de réception
  - Typing indicators en temps réel
  - Support émojis et messages multimédias

### 2. File d'Attente et Distribution
- **Description**: Système intelligent de gestion des files d'attente
- **Sous-fonctionnalités**:
  - Files d'attente par spécialité
  - Estimation temps d'attente
  - Distribution automatique aux agents disponibles
  - Priorisation des conversations urgentes
  - Transfert entre agents/équipes
  - Escalade automatique

### 3. Chatbot Intégré
- **Description**: Assistant virtuel pour questions fréquentes et qualification
- **Sous-fonctionnalités**:
  - Réponses automatiques aux questions fréquentes
  - Qualification des besoins clients
  - Transfert vers agent humain si nécessaire
  - Apprentissage continu des interactions
  - Support multi-langues
  - Intégration base de connaissances

### 4. Historique et Contexte Conversationnel
- **Description**: Gestion complète de l'historique des conversations
- **Sous-fonctionnalités**:
  - Historique complet des conversations
  - Contexte client (profil, devis, contrats)
  - Recherche dans l'historique
  - Tags et catégorisation
  - Export conversations
  - Analyse sentimentale

### 5. Modèles de Réponses et Templates
- **Description**: Bibliothèque de réponses prédéfinies pour efficacité
- **Sous-fonctionnalités**:
  - Templates de réponses personnalisables
  - Raccourcis clavier pour réponses fréquentes
  - Variables dynamiques (nom client, etc.)
  - Templates par type de conversation
  - A/B testing des réponses
  - Analytics d'utilisation templates

### 6. Monitoring et Analytics
- **Description**: Outils d'analyse de performance du service chat
- **Sous-fonctionnalités**:
  - Temps de réponse moyens
  - Taux de satisfaction client
  - Volume de conversations par période
  - Performance des agents
  - Identification des questions fréquentes
  - Rapports de qualité

## 🏗️ Architecture Technique

### Composants Principaux
```typescript
// ChatInterface.tsx - Interface chat principale
interface ChatInterfaceProps {
  sessionId: string
  messages: Message[]
  onSendMessage: (content: string, attachments?: File[]) => Promise<void>
  onTypingStart: () => void
  onTypingStop: () => void
  isOnline: boolean
  agentInfo?: AgentInfo
}

// ChatWidget.tsx - Widget chat flottant
interface ChatWidgetProps {
  isOpen: boolean
  onToggle: () => void
  unreadCount: number
  onStartChat: () => Promise<ChatSession>
  position: 'bottom-right' | 'bottom-left' | 'custom'
}

// AgentDashboard.tsx - Tableau bord agent
interface AgentDashboardProps {
  agent: Agent
  activeChats: ChatSession[]
  queueInfo: QueueInfo
  onAcceptChat: (sessionId: string) => Promise<void>
  onTransferChat: (sessionId: string, targetAgentId: string) => Promise<void>
}

// ChatHistory.tsx - Historique conversations
interface ChatHistoryProps {
  conversations: ChatConversation[]
  filters: ConversationFilters
  onFiltersChange: (filters: ConversationFilters) => void
  onExport: (conversationIds: string[]) => Promise<void>
}
```

### Structures de Données
```typescript
// Message.ts - Structure message
interface Message {
  id: string
  sessionId: string
  sender: MessageSender
  content: string
  type: MessageType
  attachments?: MessageAttachment[]
  timestamp: Date
  readAt?: Date
  metadata: MessageMetadata
}

interface MessageSender {
  id: string
  type: 'user' | 'agent' | 'bot'
  name: string
  avatar?: string
  role?: string
}

// ChatSession.ts - Structure session chat
interface ChatSession {
  id: string
  status: ChatStatus
  participants: ChatParticipant[]
  queue?: ChatQueue
  priority: ChatPriority
  createdAt: Date
  startedAt?: Date
  endedAt?: Date
  metadata: SessionMetadata
}

interface ChatParticipant {
  id: string
  type: 'user' | 'agent'
  joinedAt: Date
  leftAt?: Date
  isTyping: boolean
}

// Agent.ts - Structure agent
interface Agent {
  id: string
  name: string
  avatar?: string
  status: AgentStatus
  specialities: string[]
  currentChats: string[]
  maxChats: number
  languages: string[]
  rating: AgentRating
}
```

### WebSocket Communication
```typescript
// ChatWebSocket.ts - WebSocket chat
class ChatWebSocket {
  private ws: WebSocket
  private sessionId: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5

  connect(sessionId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(`${this.wsUrl}/chat/${sessionId}`)

      this.ws.onopen = () => {
        this.reconnectAttempts = 0
        resolve()
      }

      this.ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        this.handleMessage(message)
      }

      this.ws.onclose = () => {
        this.handleDisconnect()
      }
    })
  }

  sendMessage(content: string, type: MessageType = 'text'): void {
    const message: Message = {
      id: generateId(),
      sessionId: this.sessionId,
      sender: this.getCurrentUser(),
      content,
      type,
      timestamp: new Date(),
      metadata: {}
    }

    this.ws.send(JSON.stringify(message))
  }
}
```

## 📊 APIs et Services

### ChatService
```typescript
interface IChatService {
  startSession(userId: string, queue?: string): Promise<ChatSession>
  joinSession(sessionId: string, participantType: 'user' | 'agent'): Promise<void>
  sendMessage(sessionId: string, content: string, type?: MessageType): Promise<Message>
  getMessages(sessionId: string, limit?: number): Promise<Message[]>
  endSession(sessionId: string, reason?: string): Promise<void>
  transferSession(sessionId: string, targetAgentId: string): Promise<void>
}

interface ChatQueueService {
  getQueueInfo(queueId: string): Promise<QueueInfo>
  joinQueue(sessionId: string, queueId: string): Promise<void>
  leaveQueue(sessionId: string): Promise<void>
  assignNextChat(agentId: string): Promise<ChatSession | null>
  getQueuePosition(sessionId: string): Promise<number>
}
```

### AgentService
```typescript
interface IAgentService {
  getAgent(agentId: string): Promise<Agent>
  updateAgentStatus(agentId: string, status: AgentStatus): Promise<Agent>
  getAvailableAgents(speciality?: string): Promise<Agent[]>
  getAgentMetrics(agentId: string, timeRange: TimeRange): Promise<AgentMetrics>
  assignAgent(agentId: string, sessionId: string): Promise<void>
  unassignAgent(agentId: string, sessionId: string): Promise<void>
}
```

### ChatbotService
```typescript
interface IChatbotService {
  processMessage(message: string, context: ChatbotContext): Promise<ChatbotResponse>
  getIntent(message: string): Promise<ChatbotIntent>
  generateResponse(intent: ChatbotIntent, context: ChatbotContext): Promise<string>
  shouldTransferToAgent(intent: ChatbotIntent, confidence: number): boolean
  learnFromConversation(conversation: ChatConversation): Promise<void>
}
```

### TemplateService
```typescript
interface IChatTemplateService {
  getTemplates(category?: TemplateCategory): Promise<ChatTemplate[]>
  createTemplate(template: CreateChatTemplateRequest): Promise<ChatTemplate>
  updateTemplate(templateId: string, updates: Partial<ChatTemplate>): Promise<ChatTemplate>
  deleteTemplate(templateId: string): Promise<void>
  searchTemplates(query: string): Promise<ChatTemplate[]>
  useTemplate(templateId: string, variables: Record<string, any>): Promise<string>
}
```

### AnalyticsService
```typescript
interface IChatAnalyticsService {
  getSessionMetrics(timeRange: TimeRange): Promise<SessionMetrics>
  getAgentMetrics(agentId: string, timeRange: TimeRange): Promise<AgentMetrics>
  getQueueMetrics(queueId: string, timeRange: TimeRange): Promise<QueueMetrics>
  getChatbotMetrics(timeRange: TimeRange): Promise<ChatbotMetrics>
  generateReport(reportConfig: ChatReportConfig): Promise<ChatReport>
  getSentimentAnalysis(sessionId: string): Promise<SentimentAnalysis>
}
```

## 🎨 Interface Utilisateur

### Pages du Module
1. **ChatPage** (`/chat/[sessionId]`)
   - Interface chat complète
   - Historique conversation
   - Actions agent

2. **AgentDashboardPage** (`/assureur/chat`)
   - Tableau bord agent
   - File d'attente
   - Sessions actives

3. **ChatHistoryPage** (`/chat/historique`)
   - Historique conversations
   - Recherche et filtres
   - Export données

4. **ChatAnalyticsPage** (`/admin/chat/analytics`)
   - Analytics performance
   - Rapports détaillés
   - Monitoring temps réel

### Composants Principaux
- **ChatWindow**: Fenêtre chat principale
- **MessageBubble**: Bulle message individuelle
- **TypingIndicator**: Indicateur saisie
- **FileAttachment**: Pièce jointe message
- **QuickReplies**: Réponses rapides
- **AgentStatus**: Statut agent
- **QueuePosition**: Position file d'attente

### États Visuels
- **Online**: Vert - Disponible
- **Away**: Orange - Absent
- **Busy**: Rouge - Occupé
- **Offline**: Gris - Hors ligne
- **Typing**: Animation saisie
- **New Message**: Surligné nouveau message

## 🧪 Tests

### Tests Unitaires
```typescript
// ChatInterface.test.tsx
describe('ChatInterface', () => {
  it('envoie message correctement', async () => {
    const mockOnSendMessage = jest.fn()
    render(<ChatInterface sessionId="test-123" messages={[]} onSendMessage={mockOnSendMessage} />)

    await fireEvent.change(screen.getByTestId('message-input'), { target: { value: 'Bonjour' } })
    await fireEvent.click(screen.getByTestId('send-button'))

    expect(mockOnSendMessage).toHaveBeenCalledWith('Bonjour')
  })

  it('affiche messages correctement', () => {
    const messages = createMockMessages()
    render(<ChatInterface sessionId="test-123" messages={messages} onSendMessage={jest.fn()} />)

    expect(screen.getByText(messages[0].content)).toBeInTheDocument()
    expect(screen.getByText(messages[1].content)).toBeInTheDocument()
  })
})
```

### Tests d'Intégration
- **Connexion WebSocket**
- **File d'attente**
- **Transfert sessions**
- **Chatbot responses**

### Tests E2E (Playwright)
```typescript
// chat-flow.spec.ts
test('flux chat complet', async ({ page }) => {
  await page.goto('/connexion')
  await loginAsUser(page)

  // Démarrage chat
  await page.click('[data-testid="chat-widget"]')
  await page.fill('[data-testid="chat-message"]', 'Bonjour, je voudrais des informations sur vos assurances')
  await page.click('[data-testid="send-message"]')

  // Vérification message envoyé
  await expect(page.locator('[data-testid="message-sent"]')).toBeVisible()
  await expect(page.getByText('Bonjour, je voudrais des informations')).toBeVisible()

  // Simulation réponse bot
  await simulateBotResponse(page, {
    content: 'Bonjour ! Je suis là pour vous aider. Quel type d\'assurance vous intéresse ?'
  })

  await expect(page.getByText('Quel type d\'assurance vous intéresse ?')).toBeVisible()

  // Test transfert agent
  await page.click('[data-testid="request-agent"]')
  await expect(page.getByText('Transfert vers un agent en cours...')).toBeVisible()
})
```

## 📈 Performance

### Optimisations
- **WebSocket Optimization**: Optimisation connexions
- **Message Caching**: Cache messages
- **Lazy Loading**: Chargement progressif historique
- **Image Compression**: Compression pièces jointes
- **Connection Pooling**: Pool connexions

### Monitoring
- **Message Latency**: Latence messages
- **Connection Quality**: Qualité connexion
- **Agent Performance**: Performance agents
- **Queue Metrics**: Métriques files d'attente
- **User Satisfaction**: Satisfaction utilisateurs

## 🚨 Gestion des Erreurs

### Types d'Erreurs
1. **Connection Errors**: Problèmes connexion WebSocket
2. **Message Failures**: Échecs envoi messages
3. **Agent Unavailable**: Agent indisponible
4. **Queue Full**: File d'attente pleine
5. **System Overload**: Système surchargé

### Stratégies de Gestion
- **Auto Reconnection**: Reconnexion automatique
- **Message Queue**: File d'attente messages
- **Fallback Modes**: Modes dégradés
- **User Notifications**: Notifications utilisateurs
- **Graceful Degradation**: Dégradation progressive

## 🔮 Évolutions Prévues

### Court Terme (1-2 mois)
- **Video Chat**: Appels vidéo intégrés
- **Screen Sharing**: Partage d'écran
- **Voice Messages**: Messages vocaux
- **File Sharing**: Partage fichiers avancé

### Moyen Terme (3-6 mois)
- **AI Co-pilot**: IA assistant agents
- **Multilingual Support**: Support multi-langues temps réel
- **CRM Integration**: Intégration CRM
- **Mobile App**: Application mobile chat

### Long Terme (6+ mois)
- **AR/VR Support**: Support réalité augmentée
- **Blockchain Chat**: Chat blockchain
- **AI Agents**: Agents entièrement autonomes
- **Predictive Support**: Support prédictif

## 📚 Documentation Complémentaire

- [Guide configuration WebSocket](./websocket-setup.md)
- [Optimisation performance chat](./chat-performance.md)
- [Formation agents chat](./agent-training.md)
- [Intégration chatbot avancée](./chatbot-integration.md)

---

*Dernière mise à jour: 2024-01-XX*
*Responsable: Équipe Communication & Support Client*