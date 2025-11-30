package modules

import (
	"database/sql"
	"lilyChat/internal/infrastructure/components"
	auth "lilyChat/internal/modules/auth/repository"
	storage "lilyChat/internal/infrastructure/db"
)

type Repository struct {
	auth auth.AuthRepositoryer
}

func NewRepository(db *sql.DB, componenst *components.Components) *Repository {
	storageRepo := storage.NewPostgresRepo(db)
	authRepo := auth.NewAuthRepo(db, storageRepo)     

	return &Repository{
		auth: authRepo,
	}
}