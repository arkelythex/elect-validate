package model

type Acta struct {
	ID              string `json:"id" csv:"id"`
	IDMesa          string `json:"id_mesa" csv:"id_mesa"`
	Ubigeo          string `json:"ubigeo" csv:"ubigeo"`
	Departamento    string `json:"departamento" csv:"departamento"`
	Provincia       string `json:"provincia" csv:"provincia"`
	Distrito        string `json:"distrito" csv:"distrito"`
	TotalElectores  int    `json:"total_electores" csv:"total_electores"`
	TotalVotantes   int    `json:"total_votantes" csv:"total_votantes"`
	VotosCandidatos int    `json:"votos_candidatos" csv:"votos_candidatos"`
	VotosNulos      int    `json:"votos_nulos" csv:"votos_nulos"`
	VotosBlancos    int    `json:"votos_blancos" csv:"votos_blancos"`
	Digitador       string `json:"digitador,omitempty"`
	Estacion        string `json:"estacion,omitempty"`
}

type ErrorValidacion struct {
	ActaID   string      `json:"acta_id"`
	Campo    string      `json:"campo"`
	Tipo     string      `json:"tipo"`
	Valor    interface{} `json:"valor"`
	Esperado interface{} `json:"esperado"`
	Gravedad string      `json:"gravedad"`
}

type ResultadoValidacion struct {
	ActaID      string            `json:"acta_id"`
	EsValida    bool              `json:"es_valida"`
	Errores     []ErrorValidacion `json:"errores"`
	ProcessedAt string            `json:"processed_at"`
}

type ResultadoProceso struct {
	TotalActas     int                   `json:"total_actas"`
	ActasValidas   int                   `json:"actas_validas"`
	ActasInvalidas int                   `json:"actas_invalidas"`
	TotalErrores   int                   `json:"total_errores"`
	Resultados     []ResultadoValidacion `json:"resultados"`
	Estadisticas   Estadisticas          `json:"estadisticas"`
}

type Estadisticas struct {
	PorcentajeValidas   float64        `json:"porcentaje_validas"`
	PorcentajeInvalidas float64        `json:"porcentaje_invalidas"`
	ErrorsPorTipo       map[string]int `json:"errors_por_tipo"`
	ErrorsPorGravedad   map[string]int `json:"errors_por_gravedad"`
	PatronesDetectados  []string       `json:"patrones_detectados"`
	TiempoProcesamiento float64        `json:"tiempo_procesamiento"`
}

type ParserConfig struct {
	IDMesaColumn       string
	UbigeoColumn       string
	ElectoresColumn    string
	VotantesColumn     string
	VotosCandidatosCol string
	VotosNulosColumn   string
	VotosBlancosColumn string
	Delimiter          rune
	HasHeader          bool
}

func NewParserConfig() *ParserConfig {
	return &ParserConfig{
		IDMesaColumn:       "id_mesa",
		ElectoresColumn:    "total_electores",
		VotantesColumn:     "total_votantes",
		VotosCandidatosCol: "votos_candidatos",
		VotosNulosColumn:   "votos_nulos",
		VotosBlancosColumn: "votos_blancos",
		Delimiter:          ',',
		HasHeader:          true,
	}
}
