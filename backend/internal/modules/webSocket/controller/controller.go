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
		return true // Allow connections from any origin
	},
}

func WSHandler(chatSvc service.ChatServicer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Get userID from context (should be set by middleware)
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

		// Register connection in Hub
		chatSvc.GetHub().Register(userID, conn)
		defer chatSvc.GetHub().Unregister(userID)

		// Send connection confirmation
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
