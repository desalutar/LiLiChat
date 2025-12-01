package modules

import (
	"net/http"
	"lilyChat/internal/infrastructure/components"
	auth "lilyChat/internal/modules/auth/controller"
	wsController "lilyChat/internal/modules/webSocket/controller"
)

type Controller struct {
	Auth auth.Auther
	Chat http.HandlerFunc
}

func NewController(services Services, components *components.Components) *Controller {
	authController := auth.NewAuthController(services.auth, components)
	chatHandler := wsController.WSHandler(services.chat)

	return &Controller{
		Auth: authController,
		Chat: chatHandler,
	}
}