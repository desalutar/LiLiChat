package usecase

import (
	"errors"

	"lilyChat/internal/infrastructure/utils"
	authRepo "lilyChat/internal/modules/auth/repository"
)

type AuthServicer interface {
	RegisterUser(username, password string) error
	LoginUser(username, password string) (accessToken string, refreshToken string, err error)
}

type AuthService struct {
	authRepo  authRepo.AuthRepositoryer
	JWT 	  utils.JTW
}

func NewAuthService(authRepo authRepo.AuthRepositoryer, JWT utils.JTW) *AuthService {
	return &AuthService{
		authRepo:  	authRepo,
		JWT: 		JWT,	
	}
}

func (s *AuthService) RegisterUser(username, password string) error {
	if len(password) < 6 {
		return errors.New("password too short")
	}

	hash, err := utils.HashPassword(password)
	if err != nil {
		return err
	}

	return s.authRepo.RegisterUser(username, hash)
}

func (s *AuthService) LoginUser(username, password string) (accessToken string, refreshToken string, err error) {
	user, err := s.authRepo.GetUser(username)
	if err != nil {
		return "", "", err
	}

	if err := utils.ComparePassword(user.PasswordHash, password); err != nil {
		return "", "", err
	}

	accessToken, err = utils.JWTokener.GenerateAccessToken(&s.JWT, username)
	if err != nil {
		return "", "", err
	}

	refreshToken, err = utils.JWTokener.GenerateRefreshToken(&s.JWT, username)
	if err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}
