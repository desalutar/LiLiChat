package migrations

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
)

func RunMigrations(db *sql.DB, path string) error {
	files, err := filepath.Glob(filepath.Join(path, "*.sql"))
	if err != nil {
		return fmt.Errorf("failed to read migration files: %w", err)
	}

	for _, file := range files {
		sqlBytes, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read file %s: %w", file, err)
		}

		_, err = db.Exec(string(sqlBytes))
		if err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", file, err)
		}
		log.Printf("Applied migration: %s", file)
	}

	return nil
}
