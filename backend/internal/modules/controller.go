package modules

import (
	"net/http"
	"lilyChat/internal/infrastructure/components"
	auth "lilyChat/internal/modules/auth/controller"
	users "lilyChat/internal/modules/users/controller"
	wsController "lilyChat/internal/modules/webSocket/controller"
)

type Controller struct {
	Auth auth.Auther
	Users users.UsersControllers
	Chat http.HandlerFunc
}

func NewController(services Services, components *components.Components) *Controller {
	authController := auth.NewAuthController(services.auth, components)
	usersController := users.NewUsersController(services.users, components)
	chatHandler := wsController.WSHandler(services.chat)

	return &Controller{
		Auth: authController,
		Users: *usersController,
		Chat: chatHandler,
	}
}