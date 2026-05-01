# AGENTS — code (growlab)

## Folder Purpose

Repo de código independiente del proyecto growlab. Tiene su propio historial Git
y remoto en GitHub (regla R-2 del Master Plan).

---

## Applicable Rules

1. Leer `CLAUDE.md` como fuente de instrucciones permanentes para este repo (regla CTX-2).
2. No hacer commits directamente a `main`; crear rama descriptiva primero.
3. No commitear `.env` ni secretos (regla SEC-2); verificar `.gitignore` antes.
4. No usar embeds de Obsidian (`![[...]]`) en ningún archivo (regla CTX-1).

---

## Source of Truth

- `CLAUDE.md` — instrucciones permanentes para agentes de código en este repo
- `01_PROJECTS/growlab/ai-context/project-context.md` — contexto del proyecto (referencia)

---

## Limits

- No modificar `.gitignore` sin verificar que `.env` sigue cubierto.
- No modificar `CLAUDE.md` sin aprobación explícita del usuario.
- Este repo es independiente de la bóveda; no referenciar paths de la bóveda en código.
