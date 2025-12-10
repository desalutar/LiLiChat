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

    this.closeWebSocket()

    this.connectionPromise = new Promise<void>((resolve, reject) => {
      this.connectionResolve = resolve
      this.connectionReject = reject
    })

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const wsUrl = `${protocol}//${window.location.host}/api/1/ws`

    console.log("Connecting to WebSocket:", wsUrl)

    this.ws = new WebSocket(wsUrl)

    const connectionTimeout = setTimeout(() => {
      if (this.ws && this.ws.readyState !== WebSocket.OPEN) {
        console.error("WebSocket connection timeout")
        if (this.connectionReject) {
          this.connectionReject(new Error("WebSocket connection timeout"))
        }
        this.closeWebSocket()
      }
    }, 10000)

    this.ws.onopen = () => {
      console.log("WebSocket connection opened")
      clearTimeout(connectionTimeout)
    }

    this.ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data)
        console.log("WebSocket message received:", data)

        if (data.type === "connected") {
          console.log("WebSocket connected, user_id:", data.user_id)
          if (data.user_id) {
            this.currentUserId = String(data.user_id)
          }
          if (this.connectionResolve) {
            this.connectionResolve()
            this.connectionResolve = null
            this.connectionReject = null
          }
        } else if (data.type === "message" && data.sender_id && data.receiver_id && data.text) {
          const message: Message = {
            sender_id: data.sender_id,
            receiver_id: data.receiver_id,
            text: data.text,
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
        console.error("Error parsing WebSocket message:", error)
      }
    }

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error)
      clearTimeout(connectionTimeout)
      if (this.connectionReject) {
        this.connectionReject(new Error("WebSocket connection error"))
      }
    }

    this.ws.onclose = (event) => {
      console.log("WebSocket connection closed", event.code, event.reason)
      clearTimeout(connectionTimeout)
      this.ws = null
      if (this.connectionReject && this.connectionPromise) {
        this.connectionReject(new Error(`WebSocket closed: ${event.reason || "Connection closed"}`))
      }
      this.connectionPromise = null
      this.connectionResolve = null
      this.connectionReject = null
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
    if (this.ws) {
      this.ws.close()
      this.ws = null
      console.log("WebSocket connection closed")
    }
    if (this.connectionReject) {
      this.connectionReject(new Error("WebSocket connection closed"))
    }
    this.connectionPromise = null
    this.connectionResolve = null
    this.connectionReject = null
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
      console.error("Error searching users:", error)
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
      console.error("Error loading messages:", error)
      return []
    }
  }

  async logout(): Promise<void> {
    try {
      await this.api.post("/auth/logout", {})
    } catch (error) {
      console.error("Logout error:", error)
    }
    this.currentUserId = null
    this.closeWebSocket()
  }
}

