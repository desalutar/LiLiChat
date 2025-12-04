package db

import (
	"database/sql"
	"lilyChat/internal/infrastructure/db/migrations"
	"log"
	"time"

	_ "github.com/lib/pq"
)

const migrationsPath = "/app/internal/infrastructure/db/migrations"

const (
	maxRetries      = 30
	retryInterval   = 2 * time.Second
)

func InitDB(dsn string) *sql.DB {
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        log.Fatalf("[DB] cannot open db: %v", err)
    }

    var pingErr error
    for i := 0; i < maxRetries; i++ {
        if pingErr = db.Ping(); pingErr == nil {
            break
        }
        time.Sleep(retryInterval)
    }

    if pingErr != nil {
        log.Fatalf("[DB] cannot ping DB after %d attempts: %v", maxRetries, pingErr)
    }

    if err := migrations.RunMigrations(db, migrationsPath); err != nil {
        log.Fatalf("[DB] cannot run migrations: %v", err)
    }

    return db
}
