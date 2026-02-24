package server

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"

	"elect-validate/internal/auth"
	"elect-validate/internal/handler"
	"elect-validate/internal/logger"
)

func customFileServer(root http.Dir) http.Handler {
	fs := http.FileServer(root)
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ext := filepath.Ext(r.URL.Path)
		if ext == ".js" {
			w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		}
		fs.ServeHTTP(w, r)
	})
}

func Run(port string) error {
	logLevel := getEnv("LOG_LEVEL", "info")
	logPath := getEnv("LOG_PATH", "")
	logger.Init(logLevel, logPath)
	logger.Info("Electo Server starting...")

	usersEnv := getEnv("USERS", "")
	auth.Init(usersEnv)
	logger.Info("Authentication initialized")

	http.Handle("/", customFileServer(http.Dir("web")))

	http.HandleFunc("/api/login", handler.HandleLogin)
	http.HandleFunc("/api/validate", handler.HandleValidate)
	http.HandleFunc("/api/validate-ws", handler.HandleValidateWS)

	fmt.Printf("🌐 Servidor: http://localhost:%s\n", port)
	fmt.Println("📂 Presiona Ctrl+C para detener")
	fmt.Println("🔐 Credenciales por defecto: admin / onpe2026")
	fmt.Println("   Para cambiar: USERS=user:pass,admin:secret ./ark.exe")

	return http.ListenAndServe(":"+port, nil)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
