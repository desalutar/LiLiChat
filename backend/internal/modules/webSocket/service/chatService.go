package service

import (
	dto "lilyChat/internal/modules/dto"
	websocket "lilyChat/internal/modules/webSocket"
	"lilyChat/internal/modules/webSocket/hub"
	"time"
)

type ChatServicer interface {
	SendMessage(senderID, receiverID int64, text string) error
	GetHub() *hub.Hub
}

type ChatService struct {
	msgRepo websocket.MessageRepository
	hub     *hub.Hub
}

func NewChatService(msgRepo websocket.MessageRepository, hub *hub.Hub) *ChatService {
	return &ChatService{
		msgRepo: msgRepo,
		hub:     hub,
	}
}

func (s *ChatService) GetHub() *hub.Hub {
	return s.hub
}

func (s *ChatService) SendMessage(senderID, receiverID int64, text string) error {
	msg := &dto.Message{
		SenderID:   senderID,
		ReceiverID: receiverID,
		Text:       text,
		CreatedAt:  time.Now().Unix(),
	}
	if err := s.msgRepo.Save(msg); err != nil {
		return err
	}

	return s.hub.SendMessage(senderID, receiverID, text)
}


