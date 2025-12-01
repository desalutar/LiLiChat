package controller

import (
	"log"
	"net/http"

	dto "lilyChat/internal/infrastructure/domain/dto"
	"lilyChat/internal/infrastructure/middleware"
	"lilyChat/internal/modules/webSocket/service"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Разрешаем подключения с любого origin
	},
}

func WSHandler(chatSvc service.ChatServicer) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Получаем userID из контекста (должен быть установлен middleware)
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

		// Регистрируем соединение в Hub
		chatSvc.GetHub().Register(userID, conn)
		defer chatSvc.GetHub().Unregister(userID)

		// Отправляем подтверждение подключения
		conn.WriteJSON(map[string]interface{}{
			"type":    "connected",
			"user_id": userID,
			"message": "WebSocket connection established",
		})

		// Читаем сообщения от клиента
		for {
			var req dto.SendMessageRequest
			if err := conn.ReadJSON(&req); err != nil {
				log.Printf("[WS] Error reading message from user %d: %v", userID, err)
				break
			}
			
			log.Printf("[WS] Received message from user %d to user %d: %s", userID, req.ReceiverID, req.Text)
			
			// Отправляем сообщение через сервис (сохраняет в БД и отправляет через WebSocket)
			if err := chatSvc.SendMessage(userID, req.ReceiverID, req.Text); err != nil {
				log.Printf("[WS] Error sending message: %v", err)
				// Отправляем ошибку клиенту
				conn.WriteJSON(map[string]interface{}{
					"type":  "error",
					"error": err.Error(),
				})
			} else {
				log.Printf("[WS] Message processed successfully from user %d to user %d", userID, req.ReceiverID)
			}
		}
	}
}
