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

	if len(files) == 0 {
		return fmt.Errorf("no migration files found in path: %s", path)
	}

	log.Printf("[Migrations] Found %d migration file(s) in path: %s", len(files), path)

	for _, file := range files {
		log.Printf("[Migrations] Reading migration file: %s", file)
		sqlBytes, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("failed to read file %s: %w", file, err)
		}

		log.Printf("[Migrations] Executing migration: %s", file)
		_, err = db.Exec(string(sqlBytes))
		if err != nil {
			return fmt.Errorf("failed to execute migration %s: %w", file, err)
		}
		log.Printf("[Migrations] Successfully applied migration: %s", file)
	}

	return nil
}
