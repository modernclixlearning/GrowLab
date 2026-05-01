# CLAUDE.md — growlab

> Este archivo vive en la raíz de `01_PROJECTS/growlab/code/`.
> Es el único punto de instrucciones permanentes para Claude Code en este repo.
> No depende de la bóveda Obsidian; es autocontenido.

---

## Repo Purpose

Repo de código del proyecto GrowLab. Proyecto piloto del sistema de bóveda
Obsidian como OS de desarrollo. El propósito técnico real se completará cuando
arranque el desarrollo activo.

---

## Common Commands

```bash
# Instalación de dependencias
# (completar según el stack del proyecto)

# Ejecutar tests
# (completar según el stack del proyecto)

# Build
# (completar según el stack del proyecto)

# Servidor de desarrollo
# (completar según el stack del proyecto)
```

---

## Project Rules

1. No modificar archivos de configuración (`.env`, archivos de infra) sin aprobación explícita.
2. No hacer commits directamente a `main`; crear una rama descriptiva.
3. Mantener los tests pasando antes de proponer un PR.
4. Seguir las convenciones de nombrado ya establecidas en el código existente.

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
