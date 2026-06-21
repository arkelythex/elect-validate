# Electo Suite Electoral

> **🏢 ARKELYTHEX Ecosystem** — This project is part of the [ARKELYTHEX](https://github.com/arkelythex) venture studio.  
> The primary development hub is the [ARKELYTHEX monorepo](https://github.com/arkelythex/Arkelythex).

Sistema de validación de actas electorales para la ONPE (Perú). Desarrollado en Go con arquitectura modular, validación concurrente y UI web moderna.

## Características

- **Validación concurrente** usando goroutines y channels de Go
- **Parser flexible** que detecta múltiples formatos de columnas CSV
- **Detección de patrones**: fatiga de digitadores, errores sistemáticos
- **Interfaz web profesional** con diseño oscuro (TailwindCSS)
- **Modo CLI** para procesamiento por lotes
- **API REST** para integración

## Estructura del Proyecto

```
elect-validate/
├── elect.exe              # Binario compilado
├── go.mod               # Dependencias Go
├── test.csv             # Archivo de prueba
├── cmd/
│   └── elect/main.go      # Punto de entrada
├── internal/
│   ├── model/acta.go   # Modelos de datos
│   ├── parser/csv.go   # Parser CSV flexible
│   ├── validator/      # Lógica de validación
│   │   └── logic.go
│   ├── handler/        # Handlers HTTP
│   │   └── validate.go
│   ├── auth/          # Autenticación JWT
│   │   └── auth.go
│   ├── logger/        # Logging
│   │   └── logger.go
│   └── server/         # Servidor web
│       └── server.go
└── web/
    ├── index.html      # UI web
    └── js/             # Frontend modular
```

## Instalación

```bash
# Clonar y compilar
cd elect-validate
go build -o elect.exe ./cmd/elect
```

## Uso

### Modo Web (UI)

```bash
./elect.exe
```

Inicia el servidor en `http://localhost:8080`. Interfaz con:
- Drag & drop de archivos CSV
- Configuración de workers y umbrales
- Reporte visual de resultados
- Exportación JSON

### Modo CLI

```bash
./ark.exe test.csv
```

Salida:
```
=== Electo | Validando actas ===
Total: 4 | Validas: 3 | Invalidas: 1 | Tiempo: 12.50ms
❌ 0001: EXCESO_VOTANTES
```

### API REST

```bash
curl -X POST http://localhost:8080/api/validate \
  -F "file=@test.csv" \
  -F "workers=4" \
  -F "umbral_nulos=30"
```

## Formato del CSV

El parser detecta automáticamente estas columnas:

| Campo | Nombres aceptados |
|-------|-------------------|
| ID Mesa | `mesa`, `id_mesa`, `cod_mesa`, `id`, `codigo_mesa` |
| Electores | `electores`, `total_electores`, `electores_habiles` |
| Votantes | `votantes`, `total_votantes`, `total_votos` |
| Votos Candidatos | `votos`, `votos_candidatos`, `votos_validos` |
| Votos Nulos | `nulos`, `votos_nulos` |
| Votos Blancos | `blancos`, `votos_blancos` |
| Digitador | `digitador`, `operador`, `usuario` |

Ejemplo:
```csv
mesa,departamento,provincia,distrito,electores,votantes,votos,nulos,blancos,digitador
0001,LIMA,LIMA,SAN JUAN DE LURIGANCHO,300,250,230,15,5,jramirez
0002,LIMA,LIMA,SAN JUAN DE LURIGANCHO,300,245,220,20,5,jramirez
```

## Reglas de Validación

### Errores Bloqueantes (INVALIDAN el acta)

| Código | Descripción |
|--------|-------------|
| `SUMA_INCONSISTENTE` | `votos_candidatos + votos_nulos + votos_blancos != total_votantes` |
| `EXCESO_VOTANTES` | `total_votantes > total_electores` |
| `VALOR_NEGATIVO` | Cualquier campo con valor negativo |

### Advertencias

| Código | Descripción |
|--------|-------------|
| `NULOS_SOSPECHOSOS` | Porcentaje de votos nulos > umbral (default 30%) |

## Detección de Patrones

El sistema detecta:

- **Fatiga de digitador**: Si un digitador tiene ≥3 errores bloqueantes, se marca como posible fatiga
- **Errores por estación**: Registros con campo `estacion` para análisis

## Configuración

### Parámetros del Validador

```go
v := validator.New(
    4,      // workers (goroutines)
    30.0,   // umbral nulos (%)
    10.0,   // umbral blancos (%)
)
```

### Parámetros vía API

| Parámetro | Tipo | Default | Descripción |
|-----------|------|---------|-------------|
| `file` | file | requerido | Archivo CSV |
| `workers` | int | 4 | Número de goroutines |
| `umbral_nulos` | float | 30 | % máximo votos nulos |
| `umbral_blancos` | float | 10 | % máximo votos blancos |

## Arquitectura

### Concurrencia

```
                    ┌─────────────┐
                    │   main.go   │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Parser     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌────▼────┐ ┌────▼────┐
        │ Worker 1 │ │Worker 2 │ │Worker N │
        └─────┬─────┘ └────┬────┘ └────┬────┘
              │            │            │
              └────────────┼────────────┘
                           │
                    ┌──────▼──────┐
                    │  Collector  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Resultado  │
                    └─────────────┘
```

- **Channels**: `actasChan` (entrada), `resultadosChan` (salida)
- **WaitGroup**: sincronización de workers
- **Pool configurable**: por defecto 4 workers

## Tecnologías

- **Go 1.21+**: Lenguaje principal
- **TailwindCSS 3.x**: Estilos (CDN)
- **Gorilla/Mux**: Enrutamiento (opcional)

## Recomendaciones para ONPE

1. **Entorno de producción**: Compilar con `-ldflags="-s -w"` para reducir tamaño
2. **Alta disponibilidad**: Ejecutar detrás de Nginx como reverse proxy
3. **Datos reales**: Verificar formato exacto de columnas con mesa de ayuda TI
4. **Logs**: Agregar logging con `log` package para auditoría

## Licencia

Uso interno - ONPE
---

## 🌐 ARKELYTHEX

| Component | Description |
|-----------|-------------|
| [ARKELYTHEX Monorepo](https://github.com/arkelythex/Arkelythex) | Primary development hub — fiscal intelligence platform |
| [Digital Public Peru](https://github.com/arkelythex/Digital_Public_peru) | Civic tech for fiscal transparency |
| [elect-validate](https://github.com/arkelythex/elect-validate) | Electoral act validation suite |
| [EdgeTraz-Agro](https://github.com/arkelythex/EdgeTraz-Agro) | Agro-industrial traceability |
| [Founder](https://github.com/Dreamcoder08) | Dreamcoder08 — Software Architect · GDE · MVP |
