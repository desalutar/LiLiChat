package middleware

import (
	"context"
	"net/http"
	"strings"
	"lilyChat/internal/infrastructure/utils"
)

type contextKey string

const (
	UserIDKey   contextKey = "user_id"
	UsernameKey contextKey = "username"
)

func JWTMiddleware(jwtCfg *utils.JTW) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			var tokenStr string
			
			authHeader := r.Header.Get("Authorization")
			if authHeader != "" {
				parts := strings.SplitN(authHeader, " ", 2)
				if len(parts) == 2 && parts[0] == "Bearer" {
					tokenStr = parts[1]
				}
			}
			
			if tokenStr == "" {
				tokenStr = r.URL.Query().Get("token")
			}
			
			if tokenStr == "" {
				http.Error(w, "Missing Authorization token", http.StatusUnauthorized)
				return
			}

			claims, err := utils.JWTokener.VerifyToken(jwtCfg, tokenStr)
			if err != nil {
				http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), UsernameKey, claims.Username)
			ctx = context.WithValue(ctx, UserIDKey, claims.UserID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUserIDFromContext(ctx context.Context) (int64, bool) {
	userID, ok := ctx.Value(UserIDKey).(int64)
	return userID, ok
}