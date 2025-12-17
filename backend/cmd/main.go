package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"
	"time"

	"lilyChat/internal/run"
)

func main() {
	app := run.Run()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go app.Start(ctx)

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)

	<-sigCh

	cancel()
	time.Sleep(1 * time.Second)
}