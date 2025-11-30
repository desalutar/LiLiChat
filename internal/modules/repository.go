package modules

import (
	"database/sql"
	"lilyChat/internal/infrastructure/components"
	auth "lilyChat/internal/modules/auth/repository"
)

type Repository struct {
	auth auth.AuthRepositoryer
}

func NewRepository(db *sql.DB, componenst *components.Components) *Repository {
	authRepo := auth.NewAuthRepo(db)

	return &Repository{
		auth: authRepo,
	}
}