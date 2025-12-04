package modules

import (
	"lilyChat/internal/infrastructure/components"
	auth "lilyChat/internal/modules/auth/service"
	users "lilyChat/internal/modules/users/service"
	chatService "lilyChat/internal/modules/webSocket/service"
)

type Services struct {
	auth 	auth.AuthServicer
	users 	users.UsersServicer
	chat 	chatService.ChatServicer
}

func NewServices(storage Repository, compponents *components.Components) *Services {
	authService := auth.NewAuthService(storage.auth, compponents.JWT)
	chatSvc := chatService.NewChatService(storage.chat, compponents.WSHub)
	usersSvc := users.NewUsersService(storage.users, *compponents) 
	
	return &Services{
		auth: authService,
		users: usersSvc,
		chat: chatSvc,
	}
}