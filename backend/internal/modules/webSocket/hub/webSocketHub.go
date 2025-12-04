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
	receiverConn, receiverOk := h.clients[receiverID]
	senderConn, senderOk := h.clients[senderID]
	h.mu.Unlock()
	
	messageData := map[string]interface{}{
		"type":        "message",
		"sender_id":   senderID,
		"receiver_id": receiverID,
		"text":        text,
	}
	
	if receiverOk {
		receiverConn.WriteJSON(messageData)
	}
	
	if senderOk {
		senderConn.WriteJSON(messageData)
	}
	
	return nil
}

func (h *Hub) getClientIDs() []int64 {
	h.mu.Lock()
	defer h.mu.Unlock()
	ids := make([]int64, 0, len(h.clients))
	for id := range h.clients {
		ids = append(ids, id)
	}
	return ids
}