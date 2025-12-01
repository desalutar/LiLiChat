package dto

type Message struct {
	ID         int64  `json:"id"`
	SenderID   int64  `json:"sender_id"`
	ReceiverID int64  `json:"receiver_id"`
	Text       string `json:"text"`
	CreatedAt  int64  `json:"created_at"`
}

type SendMessageRequest struct {
	ReceiverID int64  `json:"receiver_id"`
	Text       string `json:"text"`
}