package models

type Message struct {
	ID         	int64
	SenderID 	int64 	
	ReceiverID 	int64 	
	Text       	string	
	CreatedAt  	int64
}
