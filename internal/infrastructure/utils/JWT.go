package utils

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)


type JTW struct {
	Secret           string        
	AccessTokenTTL   time.Duration 
	RefreshTokenTTL  time.Duration 
}

var JWTokener = &jwtHandler{}

type jwtHandler struct{}

func (j *jwtHandler) GenerateAccessToken(cfg *JTW, username string) (string, error) {
	return generateToken(cfg.Secret, username, cfg.AccessTokenTTL)
}

func (j *jwtHandler) GenerateRefreshToken(cfg *JTW, username string) (string, error) {
	return generateToken(cfg.Secret, username, cfg.RefreshTokenTTL)
}

func generateToken(secret, username string, ttl time.Duration) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"exp":      time.Now().Add(ttl).Unix(),
	})
	return token.SignedString([]byte(secret))
}

func (j *jwtHandler) VerifyToken(cfg *JTW, tokenStr string) (string, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.Secret), nil
	})
	if err != nil || !token.Valid {
		return "", err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return "", errors.New("invalid claims")
	}

	username, ok := claims["username"].(string)
	if !ok {
		return "", errors.New("username not found in token")
	}

	return username, nil
}
