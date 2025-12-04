package service

import (
	"context"
	"lilyChat/internal/infrastructure/components"
	dto "lilyChat/internal/infrastructure/domain/dto"
	usersRepo "lilyChat/internal/modules/users/repository"
)

type UsersServicer interface {
	GetAllUsers(ctx context.Context) ([]*dto.PublicUser, error)
	GetUserByUsername(ctx context.Context, username string) (*dto.PublicUser, error)
}

type UsersService struct {
	usersRepo usersRepo.UsersRepositorier
}

func NewUsersService(repo usersRepo.UsersRepositorier, components components.Components) *UsersService {
	return &UsersService{
		usersRepo: repo,
	}
}

func (s *UsersService) GetAllUsers(ctx context.Context) ([]*dto.PublicUser, error) {
	return s.usersRepo.GetAll(ctx)
}

func (s *UsersService) GetUserByUsername(ctx context.Context, username string) (*dto.PublicUser, error) {
	return s.usersRepo.FindByUsername(ctx, username)
}
