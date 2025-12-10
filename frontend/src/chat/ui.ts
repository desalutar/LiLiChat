import { ChatService } from "./service.js"
import { Message, User } from "./types.js"

export class ChatController {
  private chatService: ChatService
  private selectedUserId: number | null = null
  private isDragging: boolean = false

  private chatHeader: HTMLElement | null
  private chatContainer: HTMLElement | null
  private dragbar: HTMLElement | null
  private messageForm: HTMLFormElement | null
  private messageInput: HTMLInputElement | null
  private messagesDiv: HTMLElement | null
  private logoutBtn: HTMLButtonElement | null
  private sidebar: HTMLElement | null
  private userList: HTMLElement | null
  private userSearch: HTMLInputElement | null
  private toggleSidebarBtn: HTMLButtonElement | null

  constructor() {
    this.chatService = new ChatService()
    
    this.chatHeader = document.getElementById("chat-header")
    this.chatContainer = document.querySelector(".chat-container")
    this.dragbar = document.getElementById("dragbar")
    this.messageForm = document.getElementById("message-form") as HTMLFormElement
    this.messageInput = document.getElementById("message-input") as HTMLInputElement
    this.messagesDiv = document.getElementById("messages")
    this.logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement
    this.sidebar = document.getElementById("sidebar")
    this.userList = document.getElementById("user-list")
    this.userSearch = document.getElementById("user-search") as HTMLInputElement
    this.toggleSidebarBtn = document.getElementById("toggle-sidebar") as HTMLButtonElement

    this.initialize()
  }

  private initialize(): void {
    this.checkAuth()
    this.bindEvents()
    this.setupSidebarDrag()
  }

  private async checkAuth(): Promise<void> {
    try {
      const response = await fetch("/api/1/users/", {
        method: "GET",
        credentials: "include",
      })
      
      if (response.status === 401) {
        window.location.href = "/public/auth.html"
        return
      }

    } catch (error) {
      console.error("Auth check failed:", error)
      window.location.href = "/public/auth.html"
    }
  }

  private bindEvents(): void {
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", () => this.handleLogout())
    }

    if (this.messageForm) {
      this.messageForm.addEventListener("submit", (e) => this.handleSendMessage(e))
    }

    if (this.userSearch) {
      this.userSearch.addEventListener("input", () => this.handleUserSearch())
    }

    if (this.userList) {
      this.userList.addEventListener("click", (e) => this.handleUserSelect(e))
    }

    if (this.toggleSidebarBtn) {
      this.toggleSidebarBtn.addEventListener("click", () => this.toggleSidebar())
    }

    document.addEventListener("click", (e) => this.handleOutsideClick(e))

    window.addEventListener("beforeunload", () => {
      this.chatService.closeWebSocket()
    })
  }

  private async handleLogout(): Promise<void> {
    await this.chatService.logout()
    window.location.href = "/public/auth.html"
  }

  private async handleSendMessage(event: Event): Promise<void> {
    event.preventDefault()
    if (!this.selectedUserId || !this.messageInput) return

    const content = this.messageInput.value.trim()
    if (!content) return

    try {
      await this.chatService.sendMessage(this.selectedUserId, content)
      this.messageInput.value = ""
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send message"
      console.error("Error sending message:", errorMessage)
      alert("Error: " + errorMessage)
    }
  }

  private async handleUserSearch(): Promise<void> {
    if (!this.userSearch || !this.userList) return

    const query = this.userSearch.value.trim()
    this.userList.innerHTML = ""

    if (!query) return

    const users = await this.chatService.searchUsers(query)
    
    users.forEach((user) => {
      const li = document.createElement("li")
      li.textContent = user.username
      li.dataset.userid = String(user.id)
      this.userList!.appendChild(li)
    })
  }

  private handleUserSelect(event: MouseEvent): void {
    const target = event.target as HTMLElement
    if (target.tagName !== "LI") return

    const prevSelected = this.userList?.querySelector(".selected")
    if (prevSelected) {
      prevSelected.classList.remove("selected")
    }

    target.classList.add("selected")

    const userId = parseInt(target.dataset.userid || "0", 10)
    if (!userId) return

    this.selectedUserId = userId
    const username = target.textContent || "User"

    if (this.chatHeader) {
      this.chatHeader.textContent = `Chat with ${username}`
    }

    if (this.messagesDiv) {
      this.messagesDiv.innerHTML = ""
    }

    if (this.messageForm) {
      this.messageForm.style.display = "flex"
    }

    this.connectWebSocket()
    this.loadMessages()
  }

  private async connectWebSocket(): Promise<void> {
    if (!this.selectedUserId) return

    try {
      await this.chatService.connectWebSocket(
        (message) => this.handleIncomingMessage(message),
        (error) => this.handleWebSocketError(error)
      )
      console.log("WebSocket connected successfully")
    } catch (error) {
      console.error("Failed to connect WebSocket:", error)
      this.handleWebSocketError(error instanceof Error ? error.message : String(error))
    }
  }

  private handleIncomingMessage(message: Message): void {
    if (!this.selectedUserId || !this.messagesDiv) return

    const currentUserId = this.chatService.getCurrentUserId()
    if (!currentUserId) return

    const currentUserIdNum = parseInt(currentUserId, 10)
    const selectedUserIdNum = this.selectedUserId

    if (
      (message.sender_id === currentUserIdNum && message.receiver_id === selectedUserIdNum) ||
      (message.sender_id === selectedUserIdNum && message.receiver_id === currentUserIdNum)
    ) {
      const isSent = message.sender_id === currentUserIdNum
      this.addMessageToChat(message.text, isSent)
    }
  }

  private handleWebSocketError(error: string): void {
    console.error("WebSocket error:", error)
    alert("Error: " + error)
  }

  private addMessageToChat(text: string, isSent: boolean): void {
    if (!this.messagesDiv) return

    const msgDiv = document.createElement("div")
    msgDiv.classList.add("message")
    msgDiv.classList.add(isSent ? "sent" : "received")
    msgDiv.textContent = text
    this.messagesDiv.appendChild(msgDiv)
    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight
  }

  private async loadMessages(): Promise<void> {
    if (!this.selectedUserId || !this.messagesDiv) return

    const messages = await this.chatService.loadMessages(this.selectedUserId)

    this.messagesDiv.innerHTML = ""

    if (messages.length === 0) {
      const emptyMsg = document.createElement("div")
      emptyMsg.textContent = "No messages. Start a conversation!"
      emptyMsg.style.color = "#888"
      emptyMsg.style.textAlign = "center"
      emptyMsg.style.padding = "20px"
      this.messagesDiv.appendChild(emptyMsg)
      return
    }

    const currentUserId = this.chatService.getCurrentUserId()
    if (!currentUserId) return

    const currentUserIdNum = parseInt(currentUserId, 10)

    messages.forEach((msg) => {
      const msgDiv = document.createElement("div")
      msgDiv.classList.add("message")
      const isSent = msg.sender_id === currentUserIdNum
      msgDiv.classList.add(isSent ? "sent" : "received")
      msgDiv.textContent = msg.text || ""
      this.messagesDiv!.appendChild(msgDiv)
    })

    this.messagesDiv.scrollTop = this.messagesDiv.scrollHeight
  }

  private toggleSidebar(): void {
    if (!this.sidebar || !this.toggleSidebarBtn) return

    this.sidebar.classList.toggle("show")

    if (this.sidebar.classList.contains("show")) {
      this.toggleSidebarBtn.style.display = "none"
    } else {
      this.toggleSidebarBtn.style.display = "block"
    }
  }

  private handleOutsideClick(event: MouseEvent): void {
    if (!this.sidebar || !this.toggleSidebarBtn) return

    const target = event.target as HTMLElement
    if (
      !this.sidebar.contains(target) &&
      !this.toggleSidebarBtn.contains(target) &&
      this.sidebar.classList.contains("show")
    ) {
      this.sidebar.classList.remove("show")
      this.toggleSidebarBtn.style.display = "block"
    }
  }

  private setupSidebarDrag(): void {
    if (!this.dragbar || !this.chatContainer || !this.sidebar) return

    this.dragbar.addEventListener("mousedown", () => {
      this.isDragging = true
      document.body.style.cursor = "ew-resize"
    })

    document.addEventListener("mouseup", () => {
      if (this.isDragging) {
        this.isDragging = false
        document.body.style.cursor = "default"
      }
    })

    document.addEventListener("mousemove", (e) => {
      if (!this.isDragging || !this.chatContainer || !this.sidebar) return

      const containerOffsetLeft = this.chatContainer.getBoundingClientRect().left
      const pointerRelativeXpos = e.clientX - containerOffsetLeft

      const minWidth = 150
      const maxWidth = 500

      const width = Math.max(minWidth, Math.min(maxWidth, pointerRelativeXpos))
      this.sidebar.style.width = width + "px"
    })
  }
}

