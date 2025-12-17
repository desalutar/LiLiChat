package hub

import (
	"sync"

	dto "lilyChat/internal/modules/dto"
	"github.com/gorilla/websocket"
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

func (h *Hub) SendMessage(msg *dto.Message) error {
	h.mu.Lock()
	receiverConn, receiverOk := h.clients[msg.ReceiverID]
	senderConn, senderOk := h.clients[msg.SenderID]
	h.mu.Unlock()
	
	messageData := map[string]interface{}{
		"type":        "message",
		"id":          msg.ID,
		"sender_id":   msg.SenderID,
		"receiver_id": msg.ReceiverID,
		"text":        msg.Text,
		"created_at": msg.CreatedAt,
	}

	conns := []*websocket.Conn{}
	
	if senderOk {
		conns = append(conns, senderConn)
	}

	if receiverOk && receiverConn != senderConn {
		conns = append(conns, receiverConn)
	}

	for _, conn := range conns {
    	if err := conn.WriteJSON(messageData); err != nil {
    	}
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