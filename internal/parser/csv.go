package parser

import (
	"encoding/csv"
	"errors"
	"fmt"
	"io"
	"os"
	"strconv"
	"strings"

	"elect-validate/internal/model"
)

var ErrNoActasParsed = errors.New("no se pudieron parsear actas")

type Parser struct {
	config *model.ParserConfig
}

func New(cfg *model.ParserConfig) *Parser {
	if cfg == nil {
		cfg = model.NewParserConfig()
	}
	return &Parser{config: cfg}
}

func (p *Parser) ParseFile(path string) ([]model.Acta, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	return p.ParseString(string(data))
}

func (p *Parser) ParseString(content string) ([]model.Acta, error) {
	reader := csv.NewReader(strings.NewReader(content))
	reader.Comma = p.config.Delimiter

	headers, err := reader.Read()
	if err != nil {
		return nil, fmt.Errorf("leyendo header: %w", err)
	}

	headerMap := normalizeHeaders(headers)
	var actas []model.Acta

	for {
		record, err := reader.Read()
		if err == io.EOF {
			break
		}
		if err != nil {
			continue
		}

		acta := p.parseRecord(record, headerMap)
		if acta.IDMesa == "" {
			continue
		}
		actas = append(actas, acta)
	}

	if len(actas) == 0 {
		return nil, ErrNoActasParsed
	}
	return actas, nil
}

func (p *Parser) parseRecord(record []string, headerMap map[string]int) model.Acta {
	acta := model.Acta{}

	findVal := func(names []string) string {
		for _, n := range names {
			if idx, ok := headerMap[n]; ok && idx < len(record) {
				return record[idx]
			}
		}
		return ""
	}

	findInt := func(names []string) int {
		for _, n := range names {
			if idx, ok := headerMap[n]; ok && idx < len(record) {
				v, _ := strconv.Atoi(record[idx])
				return v
			}
		}
		return 0
	}

	acta.IDMesa = findVal([]string{"mesa", "id_mesa", "cod_mesa", "id", "codigo_mesa"})
	acta.Ubigeo = findVal([]string{"ubigeo"})
	acta.Departamento = findVal([]string{"departamento", "region", "dep"})
	acta.Provincia = findVal([]string{"provincia", "prov"})
	acta.Distrito = findVal([]string{"distrito", "dist"})
	acta.TotalElectores = findInt([]string{"electores", "total_electores", "electores_habiles"})
	acta.TotalVotantes = findInt([]string{"votantes", "total_votantes", "total_votos"})
	acta.VotosCandidatos = findInt([]string{"votos", "votos_candidatos", "votos_validos"})
	acta.VotosNulos = findInt([]string{"nulos", "votos_nulos"})
	acta.VotosBlancos = findInt([]string{"blancos", "votos_blancos"})
	acta.Digitador = findVal([]string{"digitador", "operador", "usuario"})
	acta.Estacion = findVal([]string{"estacion", "pc", "computadora"})

	return acta
}

func normalizeHeaders(headers []string) map[string]int {
	m := make(map[string]int)
	for i, h := range headers {
		m[strings.ToLower(strings.TrimSpace(h))] = i
	}
	return m
}
