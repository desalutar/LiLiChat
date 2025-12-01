package hub

import (
	"github.com/gorilla/websocket"
	"sync"
)

type Hub struct {
	clients map[int64]*websocket.Conn
	mu      sync.Mutex
}

func NewHub() *Hub {
	return &Hub{
		clients: make(map[int64]*websocket.Conn),
	}
}

func (h *Hub) Register(userID int64, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.clients[userID] = conn
}

func (h *Hub) Unregister(userID int64) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.clients, userID)
}

func (h *Hub) SendMessage(senderID, receiverID int64, text string) error {
	h.mu.Lock()
	conn, ok := h.clients[receiverID]
	h.mu.Unlock()
	if !ok {
		return nil // получатель оффлайн
	}
	return conn.WriteJSON(map[string]interface{}{
		"sender_id": senderID,
		"text":      text,
	})
}