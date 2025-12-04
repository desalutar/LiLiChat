package routes

import (
	"lilyChat/internal/infrastructure/components"
	"lilyChat/internal/infrastructure/middleware"
	"lilyChat/internal/modules"
	"net/http"

	"github.com/go-chi/chi/v5"
)


// func NewApiRouter(controllers *modules.Controller, components *components.Components) http.Handler {
// 	r := chi.NewRouter()

// 	// --- API ---
// 	r.Mount("/api", NewApiRouter(controllers, components))

// 	// --- Статика фронтенда ---
// 	fs := http.FileServer(http.Dir("frontend")) // путь до папки frontend
// 	r.Handle("/static/*", http.StripPrefix("/static/", fs))

// 	// --- Страницы ---
// 	r.Get("/auth.html", func(w http.ResponseWriter, r *http.Request) {
// 		http.ServeFile(w, r, "frontend/auth.html")
// 	})
// 	r.Get("/chat.html", func(w http.ResponseWriter, r *http.Request) {
// 		http.ServeFile(w, r, "frontend/chat.html")
// 	})

// 	r.Route("/api", func(r chi.Router) {
// 		r.Route("/1", func(r chi.Router) {
// 			authCheck := middleware.JWTMiddleware(&components.JWT)
			
// 			// Auth routes
// 			r.Route("/auth", func(r chi.Router) {
// 				authController := controllers.Auth
// 				r.Post("/register", authController.RegisterHandler)
// 				r.Post("/login", authController.LoginHandler)
// 				r.Route("/refresh", func(r chi.Router) {
// 					r.Use(authCheck)
// 				})
// 			})

// 			// WebSocket route (requires authentication)
// 			r.Route("/ws", func(r chi.Router) {
// 				r.Use(authCheck)
// 				r.Get("/", controllers.Chat)
// 			})
// 		})
// 	})

// 	return r
// }


func NewApiRouter(controllers *modules.Controller, components *components.Components) http.Handler {
	r := chi.NewRouter()

	authCheck := middleware.JWTMiddleware(&components.JWT)

	r.Route("/1", func(r chi.Router) {
		// Auth routes
		r.Route("/auth", func(r chi.Router) {
			authController := controllers.Auth
			r.Post("/register", authController.RegisterHandler)
			r.Post("/login", authController.LoginHandler)
			r.Route("/refresh", func(r chi.Router) {
				r.Use(authCheck)
			})
		})

		// WebSocket route
		r.Route("/ws", func(r chi.Router) {
			r.Use(authCheck)
			r.Get("/", controllers.Chat)
		})
	})

	return r
}

func NewRouter(controllers *modules.Controller, components *components.Components) http.Handler {
	r := chi.NewRouter()

	// --- API ---
	r.Mount("/api", NewApiRouter(controllers, components))

	// --- Статика фронтенда ---
	fs := http.FileServer(http.Dir("frontend"))
	r.Handle("/static/*", http.StripPrefix("/static/", fs))

	// --- Страницы ---
	r.Get("/auth.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "frontend/auth.html")
	})
	r.Get("/chat.html", func(w http.ResponseWriter, r *http.Request) {
		http.ServeFile(w, r, "frontend/chat.html")
	})

	return r
}
