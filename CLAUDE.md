# CLAUDE.md — growlab

> Este archivo vive en la raíz de `01_PROJECTS/growlab/code/`.
> Es el único punto de instrucciones permanentes para Claude Code en este repo.
> No depende de la bóveda Obsidian; es autocontenido.

---

## Repo Purpose

GrowLab — aplicación fullstack TypeScript para gestión de cultivos de cannabis.
Stack: TanStack Start + React 18 + Drizzle ORM + PostgreSQL + Tailwind CSS.
Auth con JWT (access token + refresh token httpOnly cookie).

---

## Common Commands

```bash
# Instalación de dependencias
pnpm install

# Servidor de desarrollo
pnpm dev

# Build producción
pnpm build

# Servidor producción
pnpm start

# Migraciones de base de datos
pnpm db:generate   # Generar migraciones desde el schema
pnpm db:migrate    # Aplicar migraciones pendientes
pnpm db:push       # Push directo del schema (sin migration file)
pnpm db:studio     # Abrir Drizzle Studio (UI para la DB)

# Tests
pnpm test          # Vitest en modo watch
pnpm test:run      # Vitest una sola ejecución

# Calidad de código
pnpm lint          # ESLint
pnpm typecheck     # TypeScript check sin emit
```

---

## Project Rules

1. No modificar archivos de configuración (`.env`, archivos de infra) sin aprobación explícita.
2. No hacer commits directamente a `main`; crear una rama descriptiva.
3. Mantener los tests pasando antes de proponer un PR.
4. Seguir las convenciones de nombrado ya establecidas en el código existente.

---

## UI Feedback Standard

- Toda operación CRUD iniciada desde la UI debe mostrar feedback con Sonner.
- En éxito, mostrar `toast.success(...)` con una confirmación específica de la acción realizada.
- En error, mapear la respuesta `{ success: false, error: { code, message, fields? } }` a un mensaje de usuario con `getApiErrorToastMessage`.
- Los hooks/API clients deben preservar `code`, `message` y `fields` usando `ApiResponseError`; no convertir errores API directamente a `Error(message)` si la UI necesita feedback.
- Los errores inline pueden mantenerse para contexto del formulario, pero no reemplazan el toast global de la operación.

---

## Security Constraints

- Los archivos `.env` y equivalentes nunca se commitean (ver `.gitignore`).
- No hardcodear credenciales, tokens ni claves API en código fuente.
- Usar datos mock en entornos locales; no conectar a DB de producción desde local.

---

## Do Not Touch

- `.env` y variantes (`.env.production`, `.env.staging`, etc.)
- Archivos de secretos o credenciales de cualquier tipo

---

## How to Log Relevant Changes

Cuando una sesión produzca una decisión técnica relevante o un cambio estructural,
registrarla en el journal del proyecto dentro de la bóveda Obsidian.
Ruta de referencia (fuera de este repo): `01_PROJECTS/growlab/journal/YYYY-MM-DD.md`

El agente no escribe directamente en la bóveda. Presenta el resumen al usuario para
que lo incorpore al journal si lo considera relevante.

---

## Vault Reference

> Contexto adicional de la bóveda (solo como referencia textual; no se importa ni enlaza).

- Project context: `01_PROJECTS/growlab/ai-context/project-context.md`
- Architecture decisions: `01_PROJECTS/growlab/architecture/`
- Active issues: `01_PROJECTS/growlab/issues/`
