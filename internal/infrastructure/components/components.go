package components

import (
	"lilyChat/internal/infrastructure/config"
	"lilyChat/internal/infrastructure/utils"
)

type Components struct {
	Conf        config.Config
	JWT         utils.JTW
}
//TODO: добавить логирование и обработку ошибок
func NewComponents(cfg config.Config, jwt utils.JTW, ) *Components {
	return &Components{
		Conf:        cfg,
		JWT:         jwt,
	}
}
