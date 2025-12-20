package controller

import (
	"net/http"
	"strings"

	dto "lilyChat/internal/modules/dto"
	"lilyChat/internal/infrastructure/utils"
	"lilyChat/internal/modules/webSocket/service"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}
 
func extractToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader != "" {
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) == 2 && parts[0] == "Bearer" {
			return parts[1]
		}
	}

	cookie, err := r.Cookie("access_token")
	if err == nil && cookie != nil && cookie.Value != "" {
		return cookie.Value
	}

	token := r.URL.Query().Get("token")
	if token != "" {
		return token
	}

	return ""
}

func WSHandler(chatSvc service.ChatServicer, jwtCfg *utils.JTW) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		tokenStr := extractToken(r)
		if tokenStr == "" {
			http.Error(w, "Missing Authorization token", http.StatusUnauthorized)
			return
		}

		claims, err := utils.JWTokener.VerifyToken(jwtCfg, tokenStr)
		if err != nil {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		userID := claims.UserID

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			http.Error(w, "Failed to upgrade connection", http.StatusInternalServerError)
			return
		}
		defer conn.Close()

		chatSvc.GetHub().Register(userID, conn)
		defer chatSvc.GetHub().Unregister(userID)

		conn.WriteJSON(map[string]interface{}{
			"type":    "connected",
			"user_id": userID,
			"message": "WebSocket connection established",
		})

		for {
			var req dto.SendMessageRequest
			if err := conn.ReadJSON(&req); err != nil {
				break
			}
			
			if err := chatSvc.SendMessage(userID, req.ReceiverID, req.Text); err != nil {
				conn.WriteJSON(map[string]interface{}{
					"type":  "error",
					"error": err.Error(),
				})
			}
		}
	}
}
