package controller

import (
	"encoding/json"
	"log"
	"net/http"

	"lilyChat/internal/infrastructure/components"
	authService "lilyChat/internal/modules/auth/service"
	dto "lilyChat/internal/modules/dto"
)

type Auther interface {
	RegisterHandler(w http.ResponseWriter, r *http.Request)
	LoginHandler(w http.ResponseWriter, r *http.Request)
	LogoutHandler(w http.ResponseWriter, r *http.Request)
}

type AuthController struct {
	authService authService.AuthServicer
}

func NewAuthController(authService authService.AuthServicer, components *components.Components) *AuthController {
	return &AuthController{
		authService: authService,
	}
}

func (c *AuthController) RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var req dto.RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	err := c.authService.RegisterUser(req.Username, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	json.NewEncoder(w).Encode(dto.Response{Message: "registration successful"})
}

func (c *AuthController) LoginHandler(w http.ResponseWriter, r *http.Request) {
	var req dto.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	_, _, userID, err := c.authService.LoginUser(req.Username, req.Password)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	log.Printf("[LOGIN] User %s logged in successfully (userID=%d) from %s", req.Username, userID, r.RemoteAddr)

	resp := dto.LoginResponse{
		UserID: userID,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func (c *AuthController) LogoutHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dto.Response{Message: "logout successful"})
}
