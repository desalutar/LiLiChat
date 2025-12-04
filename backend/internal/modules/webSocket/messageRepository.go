package websocket

import (
	"errors"
	dto "lilyChat/internal/infrastructure/domain/dto"
	"sync"
)

type MessageRepository interface {
	Save(msg *dto.Message) error

	GetConversation(user1ID, user2ID int64) ([]*dto.Message, error)
}

type InMemoryMessageRepo struct {
	messages []*dto.Message
	mu       sync.Mutex
}

func NewInMemoryMessageRepo() *InMemoryMessageRepo {
	return &InMemoryMessageRepo{
		messages: make([]*dto.Message, 0),
	}
}

func (r *InMemoryMessageRepo) Save(msg *dto.Message) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.messages = append(r.messages, msg)
	return nil
}

func (r *InMemoryMessageRepo) GetConversation(user1ID, user2ID int64) ([]*dto.Message, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	var conv []*dto.Message
	for _, m := range r.messages {
		if (m.SenderID == user1ID && m.ReceiverID == user2ID) || 
		   (m.SenderID == user2ID && m.ReceiverID == user1ID) {
			conv = append(conv, m)
		}
	}
	if conv == nil {
		return nil, errors.New("no messages")
	}
	return conv, nil
}
