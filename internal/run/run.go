package run

import (
	"context"
	"log"
	"net/http"

	"lilyChat/internal/infrastructure/db"
	"lilyChat/internal/infrastructure/components"
	"lilyChat/internal/infrastructure/config"
	"lilyChat/internal/infrastructure/routes"
	"lilyChat/internal/infrastructure/server"
	"lilyChat/internal/infrastructure/utils"
	"lilyChat/internal/modules"
)

type AppConf struct {
	Cfg        *config.Config
	DB         *db.PostgresRepo
	JWT        *utils.JTW
	Controller *modules.Controller
	Components *components.Components
	HTTPServer server.Server
}

func Run() *AppConf {
	cfg := config.LoadConfig("config/config.yml")

	jwtCfg := &utils.JTW{
		Secret:          cfg.JWT.Secret,
		AccessTokenTTL:  cfg.JWT.AccessTokenTTL,
		RefreshTokenTTL: cfg.JWT.RefreshTokenTTL,
	}

	comps := components.NewComponents(*cfg, *jwtCfg)

	sqlDB := db.InitDB(cfg.PostgresDSN)
	pgRepo := db.NewPostgresRepo(sqlDB)

	repo := modules.NewRepository(sqlDB, comps)
	service := modules.NewServices(*repo, comps)
	controller := modules.NewController(*service, comps)

	router := routes.NewApiRouter(controller, comps)
	httpSrv := &http.Server{
		Addr:    ":" + cfg.Server.Port,
		Handler: router,
	}

	appServer := server.NewHttpServer(cfg.Server, httpSrv)

	return &AppConf{
		Cfg:        cfg,
		DB:         pgRepo,
		JWT:        jwtCfg,
		Controller: controller,
		Components: comps,
		HTTPServer: appServer,
	}
}

func (a *AppConf) Start(ctx context.Context) {
	if err := a.HTTPServer.Serve(ctx); err != nil {
		log.Fatal("Server error:", err)
	}
}
