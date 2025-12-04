package modules

import (
	"lilyChat/internal/infrastructure/components"
	auth "lilyChat/internal/modules/auth/service"
	chatService "lilyChat/internal/modules/webSocket/service"
)

type Services struct {
	auth auth.AuthServicer
	chat chatService.ChatServicer
}

func NewServices(storage Repository, compponents *components.Components) *Services {
	authService := auth.NewAuthService(storage.auth, compponents.JWT)
	chatSvc := chatService.NewChatService(storage.chat, compponents.WSHub)

	return &Services{
		auth: authService,
		chat: chatSvc,
	}
}