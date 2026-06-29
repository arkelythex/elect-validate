# elect-validate Coding Standards — GGA Review Rules

> **Última actualización**: 2026-06-29
> Proyecto de validación de actas electorales ONPE (Perú) — Go + electoral logic.
> Estas reglas son aplicadas por Gentleman Guardian Angel (gga) en cada commit y PR.

## ⛔ NON-NEGOTIABLES (MUST NOT)

These rules are absolute. Any violation causes the review to FAIL.

- **MUST NOT** break electoral data integrity, vote counting invariants, or ONPE audit trails.
- **MUST NOT** bypass authentication or authorization in APIs, WebSocket endpoints, or reports.
- **MUST NOT** introduce secrets, real credentials, production tokens, or sensitive electoral data.
- **MUST NOT** use `interface{}` without justification; prefer precise types or generics.
- **MUST NOT** use `float64` for vote counts or electoral tallies; use `int` or domain value objects.
- **MUST NOT** change validation rules, data schemas, or electoral behavior without tests and docs.
- **MUST NOT** perform broad rewrites without an explicit migration plan.
- **MUST NOT** use `panic()` outside of `main.init()`; return errors instead.

## ✅ REQUIRED PRACTICES (MUST)

- **MUST** validate all API inputs at handler/service boundaries with explicit format checks.
- **MUST** preserve type safety — avoid type assertions without safety checks.
- **MUST** use domain-specific types for mesa IDs, electoral identifiers, and vote counts.
- **MUST** keep core validation logic (`internal/validator`) framework-free — zero imports from HTTP/frameworks.
- **MUST** add or update tests for changed validation behavior.
- **MUST** update docs when public behavior, API contracts, or electoral rules change.
- **MUST** prefer small, verifiable, reversible changes.
- **MUST** handle errors explicitly — no `_ =` error discards.
- **MUST** use `go test ./...` before committing.

## 🏗️ Architecture Rules

- Use **concurrent validation** via goroutines + channels for acta processing.
- Keep electoral/domain logic **deterministic** and covered by tests.
- **Adapters belong in `internal/parser`, `internal/handler`**, not in `internal/validator`.
- `internal/validator` must stay **framework-free** — no HTTP, no WebSocket, no JWT.
- `internal/model` is the domain layer — framework-free, no external dependencies.
- `internal/handler` depends on `internal/validator` and `internal/model` only.
- `internal/server` wires everything together — infrastructure only.

## 🔒 Security Rules

- **MUST NOT** have hardcoded secrets or credentials.
- **MUST NOT** have silent error handling (`_ = err`, empty catch).
- **MUST NOT** have production `fmt.Println` / `log.Printf` without log level gates.
- **MUST NOT** miss authentication checks in API endpoints.
- **MUST NOT** use raw `interface{}` HTTP request parsing without validation.
- **MUST NOT** miss tests for new business logic.
- **MUST NOT** change public API contracts without tests and docs.
- **MUST NOT** change electoral validation logic without compliance-focused tests.
- **MUST** sanitize log outputs — never log full CSV file contents.

## 🧪 Testing Rules

- **MUST** write tests for new business logic.
- **MUST** verify electoral invariants in tests (sum consistency, vote limits, thresholds).
- **MUST** test concurrent validation with realistic data.
- **MUST** prefer `go test -race` for concurrent code.
- **Tests MUST** be deterministic — no time-dependent assertions, no shared mutable state across tests.
- **MUST** test fatiga de digitador pattern detection.
- **MUST** test API endpoints via `net/http/httptest`.

## 📐 Style & Conventions

- **MUST** follow effective Go conventions and `gofmt`.
- **MUST** use conventional commits: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `test:`, `ci:`.
- **MUST** keep commits atomic — one logical change per commit.
- **MUST NOT** add `Co-Authored-By` or AI attribution to commits.
- **MUST** use `gofmt` (or `gofumpt`) for formatting — no tabs vs spaces debates.
- **Prefer** small focused files over large monolithic ones.
- **MUST** use Go-style naming: `ErrType` for errors, `IsValid` for booleans, `NewValidator` for constructors.
- **MUST** use `go vet ./...` before each commit.

## 🏛️ ONPE / Electoral Validation Rules (Perú)

When reviewing code that touches electoral validation logic:

- **MUST** preserve `SUMA_INCONSISTENTE` invariant: `votos_candidatos + votos_nulos + votos_blancos == total_votantes`.
- **MUST** preserve `EXCESO_VOTANTES` invariant: `total_votantes <= total_electores`.
- **MUST** preserve `VALOR_NEGATIVO` detection: any negative vote/elector field.
- **MUST** preserve `NULOS_SOSPECHOSOS` threshold detection (>30% nulos by default).
- **MUST** preserve fatiga de digitador detection (≥3 bloqueantes per digitador).
- **MUST** use integer arithmetic for vote counts — no floating point for tallies.
- **MUST** validate CSV column detection flexibility (multiple accepted column names).
- **Review**: any change to electoral validation logic needs compliance-focused tests.

## 📦 Dependency Rules

- **MUST NOT** introduce unnecessary dependencies.
- **Prefer** Go standard library over external packages.
- **MUST** keep `go.mod` and `go.sum` in sync.
- **MUST** run `go mod tidy` after dependency changes.

## Review Format

When reviewing, produce this output format:

```
## Review Summary

### ✅ Passed Rules
- {rule}: {brief evidence}

### ❌ Failed Rules
- {rule}: {violation description} — {file:line}

### ⚠️ Warnings
- {rule}: {concern} — {file:line}

### Verdict
PASS | FAIL | PASS WITH WARNINGS
```

Be objective. Quote the specific code that violates rules. For PASS WITH WARNINGS, the warnings must be non-blocking concerns.
