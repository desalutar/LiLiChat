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

func (j *jwtHandler) GenerateAccessToken(cfg *JTW, username string, userID int64) (string, error) {
	return generateToken(cfg.Secret, username, userID, cfg.AccessTokenTTL)
}

func (j *jwtHandler) GenerateRefreshToken(cfg *JTW, username string, userID int64) (string, error) {
	return generateToken(cfg.Secret, username, userID, cfg.RefreshTokenTTL)
}

func generateToken(secret, username string, userID int64, ttl time.Duration) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": username,
		"user_id":  userID,
		"exp":      time.Now().Add(ttl).Unix(),
	})
	return token.SignedString([]byte(secret))
}

type TokenClaims struct {
	Username string
	UserID   int64
}

func (j *jwtHandler) VerifyToken(cfg *JTW, tokenStr string) (*TokenClaims, error) {
	token, err := jwt.Parse(tokenStr, func(token *jwt.Token) (interface{}, error) {
		return []byte(cfg.Secret), nil
	})
	if err != nil || !token.Valid {
		return nil, err
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid claims")
	}

	username, ok := claims["username"].(string)
	if !ok {
		return nil, errors.New("username not found in token")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return nil, errors.New("user_id not found in token")
	}
	userID := int64(userIDFloat)

	return &TokenClaims{
		Username: username,
		UserID:   userID,
	}, nil
}
