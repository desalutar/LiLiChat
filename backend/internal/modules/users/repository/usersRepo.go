package repository

import (
	"context"
	"errors"
	"lilyChat/internal/infrastructure/db"
	"lilyChat/internal/infrastructure/domain/dto"
)

type UsersRepositorier interface {
	FindByUsername(ctx context.Context, username string) (*dto.PublicUser, error)
    GetAll(ctx context.Context) ([]*dto.PublicUser, error)
}

type UsersRepo struct {
	repo  db.Repository
	table string
}

func NewUsersRepo(repo db.Repository) *UsersRepo {
	return &UsersRepo{
		repo:  repo,
		table: "users",
	}
}


func (u *UsersRepo) GetAll(ctx context.Context) ([]*dto.PublicUser, error) {

	records, err := u.repo.Get(u.table, nil) // без фильтров = все пользователи
	if err != nil {
		return nil, err
	}

	users := make([]*dto.PublicUser, 0, len(records))

	for _, rec := range records {
		users = append(users, &dto.PublicUser{
			ID:       rec["id"].(int64),
			Username: rec["username"].(string),
		})
	}

	return users, nil
}

func (u *UsersRepo) FindByUsername(ctx context.Context, username string) (*dto.PublicUser, error) {

	filters := db.Record{
		"username": username,
	}

	records, err := u.repo.Get(u.table, filters)
	if err != nil {
		return nil, err
	}

	if len(records) == 0 {
		return nil, errors.New("user not found")
	}

	rec := records[0]

	user := &dto.PublicUser{
		ID:       rec["id"].(int64),
		Username: rec["username"].(string),
	}

	return user, nil
}