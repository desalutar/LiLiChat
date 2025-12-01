package controller

import (
	"net/http"

	dto "lilyChat/internal/infrastructure/domain/dto"
	"lilyChat/internal/modules/webSocket/hub"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

func WSHandler(chatSvc *hub.Hub, userID int64) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			return
		}
		defer conn.Close()

		chatSvc.Register(userID, conn)
		defer chatSvc.Unregister(userID)

		for {
			var req dto.SendMessageRequest
			if err := conn.ReadJSON(&req); err != nil {
				break
			}
			chatSvc.SendMessage(userID, req.ReceiverID, req.Text)
		}
	}
}
