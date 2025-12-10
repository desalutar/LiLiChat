package controller

import (
	"net/http"

	dto "lilyChat/internal/modules/dto"
	"lilyChat/internal/infrastructure/middleware"
	"lilyChat/internal/modules/webSocket/service"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func WSHandler(chatSvc service.ChatServicer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := middleware.GetUserIDFromContext(r.Context())
		if !ok {
			http.Error(w, "User ID not found in context", http.StatusUnauthorized)
			return
		}

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
