package validator

import (
	"fmt"
	"sync"
	"time"

	"elect-validate/internal/model"
)

type Validador struct {
	poolSize      int
	umbralNulos   float64
	umbralBlancos float64
}

func New(pool int, umbralNulos, umbralBlancos float64) *Validador {
	if pool <= 0 {
		pool = 4
	}
	if umbralNulos <= 0 {
		umbralNulos = 30.0
	}
	if umbralBlancos <= 0 {
		umbralBlancos = 10.0
	}
	return &Validador{poolSize: pool, umbralNulos: umbralNulos, umbralBlancos: umbralBlancos}
}

func (v *Validador) Validar(actas []model.Acta) model.ResultadoProceso {
	start := time.Now()
	result := model.ResultadoProceso{
		TotalActas:   len(actas),
		Resultados:   make([]model.ResultadoValidacion, 0, len(actas)),
		Estadisticas: model.Estadisticas{ErrorsPorTipo: make(map[string]int), ErrorsPorGravedad: make(map[string]int)},
	}

	actasChan := make(chan model.Acta, len(actas))
	resultadosChan := make(chan model.ResultadoValidacion, len(actas))
	var wg sync.WaitGroup

	for i := 0; i < v.poolSize; i++ {
		wg.Add(1)
		go v.worker(actasChan, resultadosChan, &wg)
	}
	for _, a := range actas {
		actasChan <- a
	}
	close(actasChan)
	go func() { wg.Wait(); close(resultadosChan) }()

	digitadorErrores := make(map[string]int)
	for r := range resultadosChan {
		result.Resultados = append(result.Resultados, r)
		if r.EsValida {
			result.ActasValidas++
		} else {
			result.ActasInvalidas++
		}
		result.TotalErrores += len(r.Errores)
		for _, e := range r.Errores {
			result.Estadisticas.ErrorsPorTipo[e.Tipo]++
			result.Estadisticas.ErrorsPorGravedad[e.Gravedad]++
			if e.Gravedad == "BLOQUANTE" {
				for _, a := range actas {
					if a.IDMesa == r.ActaID && a.Digitador != "" {
						digitadorErrores[a.Digitador]++
					}
				}
			}
		}
	}

	for d, c := range digitadorErrores {
		if c >= 3 {
			result.Estadisticas.PatronesDetectados = append(result.Estadisticas.PatronesDetectados,
				fmt.Sprintf("Digitador '%s' con %d errores - posible fatiga", d, c))
		}
	}
	if result.TotalActas > 0 {
		result.Estadisticas.PorcentajeValidas = float64(result.ActasValidas) / float64(result.TotalActas) * 100
		result.Estadisticas.PorcentajeInvalidas = float64(result.ActasInvalidas) / float64(result.TotalActas) * 100
	}
	result.Estadisticas.TiempoProcesamiento = float64(time.Since(start).Milliseconds())
	return result
}

func (v *Validador) worker(actas <-chan model.Acta, results chan<- model.ResultadoValidacion, wg *sync.WaitGroup) {
	defer wg.Done()
	for a := range actas {
		results <- v.validarUna(a)
	}
}

func (v *Validador) validarUna(acta model.Acta) model.ResultadoValidacion {
	res := model.ResultadoValidacion{ActaID: acta.IDMesa, EsValida: true, ProcessedAt: time.Now().Format(time.RFC3339)}
	errores := v.validarSuma(acta)
	errores = append(errores, v.validarLimites(acta)...)
	errores = append(errores, v.validarUmbrales(acta)...)
	if len(errores) > 0 {
		res.EsValida = false
		for _, e := range errores {
			if e.Gravedad == "BLOQUANTE" {
				res.EsValida = false
				break
			}
		}
	}
	res.Errores = errores
	return res
}

func (v *Validador) validarSuma(a model.Acta) []model.ErrorValidacion {
	if s := a.VotosCandidatos + a.VotosNulos + a.VotosBlancos; s != a.TotalVotantes {
		return []model.ErrorValidacion{{ActaID: a.IDMesa, Tipo: "SUMA_INCONSISTENTE", Valor: s, Esperado: a.TotalVotantes, Gravedad: "BLOQUANTE"}}
	}
	return nil
}

func (v *Validador) validarLimites(a model.Acta) []model.ErrorValidacion {
	var errs []model.ErrorValidacion
	if a.TotalVotantes > a.TotalElectores {
		errs = append(errs, model.ErrorValidacion{ActaID: a.IDMesa, Tipo: "EXCESO_VOTANTES", Valor: a.TotalVotantes, Esperado: a.TotalElectores, Gravedad: "BLOQUANTE"})
	}
	if a.TotalVotantes < 0 || a.VotosNulos < 0 || a.VotosBlancos < 0 || a.VotosCandidatos < 0 {
		errs = append(errs, model.ErrorValidacion{ActaID: a.IDMesa, Tipo: "VALOR_NEGATIVO", Valor: "negativos", Esperado: ">= 0", Gravedad: "BLOQUANTE"})
	}
	return errs
}

func (v *Validador) validarUmbrales(a model.Acta) []model.ErrorValidacion {
	if a.TotalVotantes > 0 {
		pct := float64(a.VotosNulos) / float64(a.TotalVotantes) * 100
		if pct > v.umbralNulos {
			return []model.ErrorValidacion{{ActaID: a.IDMesa, Tipo: "NULOS_SOSPECHOSOS", Valor: fmt.Sprintf("%.1f%%", pct), Esperado: fmt.Sprintf("< %.0f%%", v.umbralNulos), Gravedad: "ADVERTENCIA"}}
		}
	}
	return nil
}
