import { ApiClient } from "../shared/api.js"
import { Message, User, WebSocketMessage, SendMessageRequest } from "./types.js"

export class ChatService {
  private api: ApiClient
  private ws: WebSocket | null = null
  private currentUserId: string | null = null
  private onMessageCallback: ((message: Message) => void) | null = null
  private onErrorCallback: ((error: string) => void) | null = null
  private connectionPromise: Promise<void> | null = null
  private connectionResolve: (() => void) | null = null
  private connectionReject: ((error: Error) => void) | null = null
  private reconnectAttempts: number = 0
  private maxReconnectAttempts: number = 5
  private reconnectTimeout: number | null = null
  private shouldReconnect: boolean = true

  constructor() {
    this.api = new ApiClient()
  }

  setCurrentUserId(userId: string | null): void {
    this.currentUserId = userId
  }

  getCurrentUserId(): string | null {
    return this.currentUserId
  }

  connectWebSocket(
    onMessage: (message: Message) => void,
    onError: (error: string) => void
  ): Promise<void> {
    this.onMessageCallback = onMessage
    this.onErrorCallback = onError
    this.shouldReconnect = true

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.reconnectAttempts = 0
      if (this.connectionPromise) {
        return this.connectionPromise
      }
      return Promise.resolve()
    }

    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      if (this.connectionPromise) {
        return this.connectionPromise
      }
    }

    this.closeWebSocket()
    this.reconnectAttempts = 0

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.connectionResolve = resolve
      this.connectionReject = reject
    })

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/api/1/ws`

    this.ws = new WebSocket(wsUrl)

    const connectionTimeout = setTimeout(() => {
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        if (this.connectionReject) {
          this.connectionReject(new Error("WebSocket connection timeout"))
        }
        this.closeWebSocket()
      }
    }, 10000)

    this.ws.onopen = () => {
      clearTimeout(connectionTimeout)
    }

    this.ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)

        if (data.type === "connected") {
          if (data.user_id) {
            this.currentUserId = String(data.user_id)
          }
          this.reconnectAttempts = 0
          if (this.connectionResolve) {
            this.connectionResolve()
            this.connectionResolve = null
            this.connectionReject = null
          }
        } else if (data.type === "message" && data.sender_id && data.receiver_id && data.text) {
          const message: Message = {
            id: data.id,
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            text: data.text,
            created_at: data.created_at ? String(data.created_at) : undefined,
          }
          if (this.onMessageCallback) {
            this.onMessageCallback(message)
          }
        } else if (data.type === "error" && data.error) {
          if (this.onErrorCallback) {
            this.onErrorCallback(data.error)
          }
        }
      } catch (error) {
      }
    }

    this.ws.onerror = (error) => {
      clearTimeout(connectionTimeout)
      if (this.connectionReject) {
        this.connectionReject(new Error("WebSocket connection error"))
      }
    }

    this.ws.onclose = (event) => {
      clearTimeout(connectionTimeout)
      const wasOpen = this.ws !== null && this.ws.readyState === WebSocket.OPEN
      this.ws = null
      
      if (this.connectionReject && this.connectionPromise) {
        if (!wasOpen || event.code !== 1000) {
          this.connectionReject(new Error(`WebSocket closed: ${event.reason || "Connection closed"}`))
        }
      }
      
      this.connectionPromise = null
      this.connectionResolve = null
      this.connectionReject = null

      if (this.shouldReconnect && event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 10000)
        
        this.reconnectTimeout = window.setTimeout(() => {
          if (this.onMessageCallback && this.onErrorCallback) {
            this.connectWebSocket(this.onMessageCallback, this.onErrorCallback).catch((error) => {
            })
          }
        }, delay)
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        if (this.onErrorCallback) {
          this.onErrorCallback("Failed to reconnect WebSocket after multiple attempts")
        }
      }
    }

    return this.connectionPromise
  }

  async sendMessage(receiverId: number, text: string): Promise<void> {
    if (this.connectionPromise) {
      try {
        await this.connectionPromise
      } catch (error) {
        throw new Error("WebSocket connection failed: " + (error instanceof Error ? error.message : String(error)))
      }
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket connection not established. Please select a user again.")
    }

    const message: SendMessageRequest = {
      receiver_id: receiverId,
      text: text,
    }

    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      throw new Error("Failed to send message: " + (error instanceof Error ? error.message : String(error)))
    }
  }

  closeWebSocket(): void {
    this.shouldReconnect = false
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close(1000, "Normal closure")
      }
      this.ws = null
    }
    if (this.connectionReject) {
      this.connectionReject(new Error("WebSocket connection closed"))
    }
    this.connectionPromise = null
    this.connectionResolve = null
    this.connectionReject = null
    this.reconnectAttempts = 0
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  async searchUsers(query: string): Promise<User[]> {
    try {
      const response = await this.api.get<User | User[]>(`/users/${encodeURIComponent(query)}`)
      
      if (response.error) {
        throw new Error(response.error)
      }

      if (!response.data) {
        return []
      }

      return Array.isArray(response.data) ? response.data : [response.data]
    } catch (error) {
      return []
    }
  }

  async loadMessages(userId: number): Promise<Message[]> {
    try {
      const response = await this.api.get<Message[]>(`/messages/${userId}`)
      
      if (response.error) {
        if (response.status === 404) {
          return []
        }
        throw new Error(response.error)
      }

      if (!response.data || !Array.isArray(response.data)) {
        return []
      }

      return response.data
    } catch (error) {
      return []
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/auth/logout", {})
    } catch (error) {
    }
    this.currentUserId = null
    this.closeWebSocket()
  }
}

