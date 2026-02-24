package auth

import (
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var jwtSecret = []byte("Electo-secret-key-change-in-production")

type Claims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

type User struct {
	Username string
	Password string
}

// Default users - configure via environment variables in production
var users = map[string]string{
	"admin": "onpe2026",
}

func Init(usersEnv string) {
	// Parse users from ENV format: user1:pass1,user2:pass2
	if usersEnv != "" {
		users = make(map[string]string)
		for _, pair := range split(usersEnv, ",") {
			parts := split(pair, ":")
			if len(parts) == 2 {
				users[parts[0]] = parts[1]
			}
		}
	}
}

func split(s, sep string) []string {
	var result []string
	start := 0
	for i := 0; i < len(s); i++ {
		if i+len(sep) <= len(s) && s[i:i+len(sep)] == sep {
			result = append(result, s[start:i])
			start = i + len(sep)
			i += len(sep) - 1
		}
	}
	result = append(result, s[start:])
	return result
}

func ValidateUser(username, password string) bool {
	storedPass, exists := users[username]
	if !exists {
		return false
	}
	return storedPass == password
}

func GenerateToken(username string) (string, error) {
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: username,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

func ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		return nil, err
	}
	if !token.Valid {
		return nil, jwt.ErrSignatureInvalid
	}
	return claims, nil
}

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Skip auth for login endpoint
		if r.URL.Path == "/api/login" || r.URL.Path == "/" {
			next.ServeHTTP(w, r)
			return
		}

		tokenString := r.Header.Get("Authorization")
		if tokenString == "" {
			http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
			return
		}

		// Remove "Bearer " prefix
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		_, err := ValidateToken(tokenString)
		if err != nil {
			http.Error(w, `{"error": "Invalid token"}`, http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
