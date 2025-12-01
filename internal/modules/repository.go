package modules

import (
	"database/sql"
	"lilyChat/internal/infrastructure/components"
	auth "lilyChat/internal/modules/auth/repository"
	storage "lilyChat/internal/infrastructure/db"
	websocket "lilyChat/internal/modules/webSocket"
)

type Repository struct {
	auth auth.AuthRepositoryer
	chat websocket.MessageRepository
}

func NewRepository(db *sql.DB, componenst *components.Components) *Repository {
	storageRepo := storage.NewPostgresRepo(db)
	authRepo := auth.NewAuthRepo(db, storageRepo)
	chatRepo := websocket.NewInMemoryMessageRepo()

	return &Repository{
		auth: authRepo,
		chat: chatRepo,
	}
}