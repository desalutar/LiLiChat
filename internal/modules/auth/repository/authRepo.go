package auth

import (
	"database/sql"
	"errors"
	"lilyChat/internal/infrastructure/db"
	dto "lilyChat/internal/infrastructure/domain/DTO"
	"time"
)

type AuthRepositoryer interface {
	RegisterUser(username, hashPass string) error
	GetUser(username string) (*dto.User, error)
}

type AuthRepo struct {
	sqlDB 		*sql.DB
	userRepo	db.Repository
	table		string 	
}

func NewAuthRepo(sqlDB *sql.DB, userRepo db.Repository) *AuthRepo {
	return &AuthRepo{
		sqlDB:    sqlDB,
		userRepo: userRepo,
		table:    "users",
	}
}

func (a *AuthRepo) RegisterUser(username, hashPass string) error {

	record := db.Record{
		"username":      username,
		"password_hash": hashPass,
		"created_at":    time.Now().Unix(),
	}

	return a.userRepo.Create(a.table, record)
}

func (a *AuthRepo) GetUser(username string) (*dto.User, error) {
	filters := db.Record{
		"username": username,
	}

	records, err := a.userRepo.Get(a.table, filters)
	if err != nil {
		return nil, err
	}

	if len(records) == 0 {
		return nil, errors.New("user not found")
	}

	rec := records[0]
	user := &dto.User{
		ID:           rec["id"].(int64),
		Username:     rec["username"].(string),
		PasswordHash: rec["password_hash"].(string),
		CreatedAt:    rec["created_at"].(int64),
	}

	return user, nil
}
