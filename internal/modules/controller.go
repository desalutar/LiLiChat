package modules

import (
	"lilyChat/internal/infrastructure/components"
	auth "lilyChat/internal/modules/auth/controller"
)

type Controller struct {
	Auth auth.Auther
}

func NewController(services Services, components *components.Components) *Controller {
	authController := auth.NewAuthController(services.auth, components)

	return &Controller{
		Auth: authController,
	}
}