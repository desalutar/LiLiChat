package server

import (
	"context"
	"lilyChat/internal/infrastructure/config"
	"log"
	"net/http"
	"time"
)

type Server interface {
	Serve(ctx context.Context) error
}

type HttpServer struct {
	conf   config.ServerConfig
	srv    *http.Server
}

func NewHttpServer(conf config.ServerConfig, server *http.Server) Server {
	return &HttpServer{conf: conf, srv: server}
}

func (s *HttpServer) Serve(ctx context.Context) error {
	var err error

	chErr := make(chan error)
	go func() {
		log.Printf("server started: %s", s.conf.Port)
		if err = s.srv.ListenAndServe(); err != http.ErrServerClosed {
			log.Fatal("http listen and serve error", err)
			chErr <- err
		}
	}()

	select {
	case <-chErr:
		return err
	case <-ctx.Done():
	}

	ctxShutdown, cancel := context.WithTimeout(context.Background(), s.conf.ShutdownTimeout*time.Second)
	defer cancel()
	err = s.srv.Shutdown(ctxShutdown)

	return err
}
