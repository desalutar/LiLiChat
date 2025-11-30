package modules

import (
	"lilyChat/internal/infrastructure/components"
	auth "lilyChat/internal/modules/auth/service"
)

type Services struct {
	auth auth.AuthServicer
}

func NewServices(storage Repository, compponents *components.Components) *Services {
	authService := auth.NewAuthService(storage.auth, compponents.JWT)

	return &Services{
		auth: authService,
	}
}