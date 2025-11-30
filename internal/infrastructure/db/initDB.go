package db

import (
	"database/sql"
	"lilyChat/internal/infrastructure/db/migrations"
	"log"

	_ "github.com/lib/pq"
)

const migrationsPath = "/app/internal/infrastructure/db/migrations"


func InitDB(dsn string) *sql.DB {
    log.Printf("[DB] Connecting to Postgres with DSN: %s", dsn)
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        log.Fatalf("[DB] cannot open db: %v", err)
    }

    log.Println("[DB] Successfully opened DB connection, pinging...")
    if err := db.Ping(); err != nil {
        log.Fatalf("[DB] cannot ping DB: %v", err)
    }
    log.Println("[DB] Ping successful!")

    log.Printf("[DB] Running migrations from path: %s", migrationsPath)
    if err := migrations.RunMigrations(db, migrationsPath); err != nil {
        log.Fatalf("[DB] cannot run migrations: %v", err)
    }
    log.Println("[DB] Migrations finished successfully!")

    return db
}
