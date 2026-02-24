package handler

import (
	"encoding/json"
	"fmt"
	"net/http"

	"elect-validate/internal/auth"
	"elect-validate/internal/logger"
	"elect-validate/internal/parser"
	"elect-validate/internal/validator"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

type WSMessage struct {
	Type     string      `json:"type"`
	Progress int         `json:"progress,omitempty"`
	Result   interface{} `json:"result,omitempty"`
	Error    string      `json:"error,omitempty"`
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token string `json:"token"`
}

// HandleLogin - Authenticate user and return JWT token
func HandleLogin(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodPost {
		json.NewEncoder(w).Encode(map[string]string{"error": "Method not allowed"})
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Warn("Login failed: invalid request body")
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid request"})
		return
	}

	if !auth.ValidateUser(req.Username, req.Password) {
		logger.Warn("Login failed: invalid credentials for user %s", req.Username)
		json.NewEncoder(w).Encode(map[string]string{"error": "Invalid credentials"})
		return
	}

	token, err := auth.GenerateToken(req.Username)
	if err != nil {
		logger.Error("Login error: failed to generate token: %v", err)
		json.NewEncoder(w).Encode(map[string]string{"error": "Failed to generate token"})
		return
	}

	logger.Info("User %s logged in successfully", req.Username)
	json.NewEncoder(w).Encode(LoginResponse{Token: token})
}

func HandleValidateWS(w http.ResponseWriter, r *http.Request) {
	logger.Info("WebSocket validation started")

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		logger.Error("WebSocket upgrade failed: %v", err)
		return
	}
	defer conn.Close()

	// Wait for file data message
	_, msg, err := conn.ReadMessage()
	if err != nil {
		logger.Error("WebSocket read error: %v", err)
		sendError(conn, "Error leyendo archivo")
		return
	}

	// Get parameters
	workers := 4
	umbralNulos := 30.0
	umbralBlancos := 10.0

	if wStr := r.FormValue("workers"); wStr != "" {
		fmt.Sscanf(wStr, "%d", &workers)
	}
	if nStr := r.FormValue("umbral_nulos"); nStr != "" {
		fmt.Sscanf(nStr, "%f", &umbralNulos)
	}
	if bStr := r.FormValue("umbral_blancos"); bStr != "" {
		fmt.Sscanf(bStr, "%f", &umbralBlancos)
	}

	sendProgress(conn, 10)

	// Parse CSV
	p := parser.New(nil)
	actas, err := p.ParseString(string(msg))
	if err != nil {
		logger.Error("CSV parse error: %v", err)
		sendError(conn, fmt.Sprintf("Error parseando CSV: %v", err))
		return
	}

	sendProgress(conn, 40)

	// Validate
	v := validator.New(workers, umbralNulos, umbralBlancos)
	result := v.Validar(actas)

	sendProgress(conn, 90)

	// Send result
	response := ValidateResponse{
		TotalActas:     result.TotalActas,
		ActasValidas:   result.ActasValidas,
		ActasInvalidas: result.ActasInvalidas,
		TotalErrores:   result.TotalErrores,
		Resultados:     result.Resultados,
		Estadisticas:   result.Estadisticas,
	}

	sendProgress(conn, 100)

	logger.Info("Validation completed: %d total, %d valid, %d invalid", 
		result.TotalActas, result.ActasValidas, result.ActasInvalidas)

	resultMsg := WSMessage{
		Type:   "result",
		Result: response,
	}
	conn.WriteJSON(resultMsg)
}

func sendProgress(conn *websocket.Conn, progress int) {
	msg := WSMessage{
		Type:     "progress",
		Progress: progress,
	}
	conn.WriteJSON(msg)
}

func sendError(conn *websocket.Conn, errMsg string) {
	msg := WSMessage{
		Type:  "error",
		Error: errMsg,
	}
	conn.WriteJSON(msg)
}

// HandleValidate - keep for HTTP fallback
func HandleValidate(w http.ResponseWriter, r *http.Request) {
	logger.Info("HTTP validation started")
	w.Header().Set("Content-Type", "application/json")

	file, _, err := r.FormFile("file")
	if err != nil {
		logger.Error("File upload error: %v", err)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}
	defer file.Close()

	content := make([]byte, 0)
	buf := make([]byte, 1024)
	for {
		n, err := file.Read(buf)
		if n > 0 {
			content = append(content, buf[:n]...)
		}
		if err != nil {
			break
		}
	}

	workers := 4
	umbralNulos := 30.0
	umbralBlancos := 10.0

	// ParseForm to get other form values
	r.ParseForm()
	if wStr := r.FormValue("workers"); wStr != "" {
		fmt.Sscanf(wStr, "%d", &workers)
	}
	if nStr := r.FormValue("umbral_nulos"); nStr != "" {
		fmt.Sscanf(nStr, "%f", &umbralNulos)
	}
	if bStr := r.FormValue("umbral_blancos"); bStr != "" {
		fmt.Sscanf(bStr, "%f", &umbralBlancos)
	}

	p := parser.New(nil)
	actas, err := p.ParseString(string(content))
	if err != nil {
		logger.Error("CSV parse error: %v", err)
		json.NewEncoder(w).Encode(map[string]string{"error": err.Error()})
		return
	}

	v := validator.New(workers, umbralNulos, umbralBlancos)
	result := v.Validar(actas)

	logger.Info("Validation completed: %d total, %d valid, %d invalid", 
		result.TotalActas, result.ActasValidas, result.ActasInvalidas)

	json.NewEncoder(w).Encode(ValidateResponse{
		TotalActas:     result.TotalActas,
		ActasValidas:   result.ActasValidas,
		ActasInvalidas: result.ActasInvalidas,
		TotalErrores:   result.TotalErrores,
		Resultados:     result.Resultados,
		Estadisticas:   result.Estadisticas,
	})
}

type ValidateResponse struct {
	TotalActas     int         `json:"total_actas"`
	ActasValidas   int         `json:"actas_validas"`
	ActasInvalidas int         `json:"actas_invalidas"`
	TotalErrores   int         `json:"total_errores"`
	Resultados     interface{} `json:"resultados"`
	Estadisticas   interface{} `json:"estadisticas"`
}
