package db

import (
	"database/sql"
	"log"
	"lilyChat/internal/infrastructure/db/migrations"
	_ "github.com/lib/pq"
)

func InitDB(dsn string) *sql.DB {
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatal(err)
	}

	if err := migrations.RunMigrations(db, "./internal/infrastructure/db/migrations"); err != nil {
		log.Fatal(err)
	}

	return db
}
