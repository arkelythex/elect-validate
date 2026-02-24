# .opencode/ - Electo Project

Configuración de AI assistant para el proyecto Electo - Suite Electoral ONPE.

## Estructura

```
.opencode/
├── opencode.json      # Config principal
├── agents/            # Definiciones de agentes
│   ├── default.json   # Agente principal
│   ├── validator.json # Agente validación
│   └── frontend.json  # Agente frontend
├── commands/          # Comandos custom
│   ├── validate.json  # Validar actas
│   ├── build.json     # Compilar
│   └── test.json      # Tests
└── modes/             # Modos de operación
    └── local.json     # Desarrollo local
```

## Uso

### Agentes

- **default**: Agente principal para desarrollo general
- **validator**: Especializado en lógica de validación electoral
- **frontend**: Especializado en UI/UX web

### Comandos

```bash
# Validar actas
opencode run validate

# Compilar proyecto
opencode run build

# Ejecutar tests
opencode run test
```

### Modos

```bash
# Modo desarrollo local
opencode mode local
```

## Configuración

Editá `opencode.json` para cambiar:
- Proveedor AI
- Permisos
- Variables de entorno

## Buenas Prácticas

1. **Modularidad**: Cada agente tiene una responsabilidad
2. **Seguridad**: No hardcodear keys - usar env vars
3. **Documentación**: README actualizado con cambios
4. **Separación**: JSON para configs, código para lógica
