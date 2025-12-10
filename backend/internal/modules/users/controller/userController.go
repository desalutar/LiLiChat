package controller

import (
	"encoding/json"
	"net/http"

	"lilyChat/internal/infrastructure/components"
	"lilyChat/internal/modules/users/service"
)


type UsersController interface {
	GetAllUsers(w http.ResponseWriter, r *http.Request)
	GetUserByUsername(w http.ResponseWriter, r *http.Request)
}

type UsersControllers struct {
	usersService service.UsersServicer
}

func NewUsersController(service service.UsersServicer, components *components.Components) *UsersControllers {
	return &UsersControllers{
		usersService: service,
	}
}

func (c *UsersControllers) GetAllUsers(w http.ResponseWriter, r *http.Request) {
	users, err := c.usersService.GetAllUsers(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(users)
}

func (c *UsersControllers) GetUserByUsername(w http.ResponseWriter, r *http.Request) {
	username := r.PathValue("username")

	if username == "" {
		http.Error(w, "username is required", http.StatusBadRequest)
		return
	}

	user, err := c.usersService.GetUserByUsername(r.Context(), username)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}