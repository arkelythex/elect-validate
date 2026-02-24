package main

import (
	"fmt"
	"os"

	"elect-validate/internal/parser"
	"elect-validate/internal/server"
	"elect-validate/internal/validator"
)

func main() {
	if len(os.Args) < 2 {
		if err := server.Run("8080"); err != nil {
			fmt.Fprintln(os.Stderr, "Error:", err)
			os.Exit(1)
		}
		return
	}

	input := os.Args[1]
	fmt.Println("=== Electo | Validando actas ===")

	p := parser.New(nil)
	actas, err := p.ParseFile(input)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}

	v := validator.New(4, 30, 10)
	result := v.Validar(actas)

	fmt.Printf("Total: %d | Validas: %d | Invalidas: %d | Tiempo: %.2fms\n",
		result.TotalActas, result.ActasValidas, result.ActasInvalidas, result.Estadisticas.TiempoProcesamiento)

	for _, r := range result.Resultados {
		if !r.EsValida {
			fmt.Printf("❌ %s: %s\n", r.ActaID, r.Errores[0].Tipo)
		}
	}
}
