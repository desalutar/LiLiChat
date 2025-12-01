package hub

import (
	"log"
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
	log.Printf("[Hub] User %d registered. Total clients: %d", userID, len(h.clients))
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
		log.Printf("[Hub] User %d (receiver) not found in clients. Available clients: %v", receiverID, h.getClientIDs())
		return nil // получатель оффлайн
	}
	
	log.Printf("[Hub] Sending message from user %d to user %d: %s", senderID, receiverID, text)
	err := conn.WriteJSON(map[string]interface{}{
		"type":        "message",
		"sender_id":   senderID,
		"receiver_id": receiverID,
		"text":        text,
	})
	
	if err != nil {
		log.Printf("[Hub] Error sending message to user %d: %v", receiverID, err)
		return err
	}
	
	log.Printf("[Hub] Message sent successfully to user %d", receiverID)
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