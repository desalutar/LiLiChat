package components

import (
	"lilyChat/internal/infrastructure/config"
	"lilyChat/internal/infrastructure/utils"
	"lilyChat/internal/modules/webSocket/hub"
)

type Components struct {
	Conf        config.Config
	JWT         utils.JTW
	WSHub       *hub.Hub
}

func NewComponents(cfg config.Config, jwt utils.JTW) *Components {
	return &Components{
		Conf:        cfg,
		JWT:         jwt,
		WSHub:       hub.NewHub(),
	}
}
