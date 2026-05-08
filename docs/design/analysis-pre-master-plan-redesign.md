---
title: Análisis Pre-Master Plan — Rediseño visual GrowLab
project: growlab
type: pre-master-plan-analysis
date: 2026-05-08
status: in-progress
inputs:
  - 01_PROJECTS/growlab/design/prototype/        # bundle Claude Design (handoff)
  - 01_PROJECTS/growlab/code/                    # repo de producción
trigger: 'necesitamos que la app luzca como 01_PROJECTS/growlab/design/prototype/'
---

# Análisis Pre-Master Plan — Rediseño visual GrowLab

> Documento generado por el skill `analisis-pre-master-plan` el 2026-05-08.
> No define arquitectura, no divide en fases, no escribe código.
> Sirve como input directo del Plan Maestro.

## 1. Encuadre

El usuario pide alinear visualmente la app de producción
(`01_PROJECTS/growlab/code/`, React + Vite + Tailwind + Hono + Drizzle)
con un prototipo HTML/JSX entregado por Claude Design en
`01_PROJECTS/growlab/design/prototype/` (Android phone, dark + neon green,
5 pestañas, frame 412×892).

La frase *"que la app luzca como…"* admitía múltiples lecturas; quedaron
resueltas en la ronda de incógnitas (ver §6).

---

## 2. Objetivos

### 2.1 Funcionales (lo que la app debería poder hacer si se replica el prototipo)

- F1. **Garden** — lista filtrable de plantas con búsqueda, pills por etapa
  (`all/seedling/veg/flower/cure`), tarjeta con foto, etapa, día,
  estado de cuidado y barra de progreso.
- F2. **Dashboard** — vista "Today" con stats, tarjetas de cuidado,
  schedule de riego y mini-chart de crecimiento.
- F3. **Plant Detail** — hero a pantalla completa con foto, datos
  ambientales (luz, humedad, temperatura), historial y acciones de cuidado.
- F4. **Add Plant** — flujo modal de **3 pasos** con zona de upload de foto,
  selección de strain, selección de etapa con tarjetas grandes, toast al crear.
- F5. **Schedule** — vista semanal con selector de día (lun–dom),
  conteo de tareas por día, tareas con hora + icono + planta vinculada
  + acción "VIEW".
- F6. **Profile** — avatar, stats (Plants/Harvests/Days Active),
  lista de Preferencias (Notifications, Tent Profiles, Sensor Devices,
  Export Data, About).
- F7. **FAB central** "Add Plant" en la barra inferior, presente en todas
  las pantallas excepto en flujo modal.
- F8. **Toasts globales** confirmando acciones (alineado con regla Sonner
  declarada en `code/CLAUDE.md`).
- F9. **Live status pulse** "SYSTEM ONLINE — N ACTIVE PLANTS · M FLOWERING"
  en Garden (estética hi-tech).

### 2.2 No funcionales (estética / experiencia)

- NF1. **Tema oscuro permanente** (fondo `#07120e`, tarjetas `#102019`).
- NF2. **Acento neón verde** primario `#22e26a` con `box-shadow` glow,
  alternable a paleta "refined" mute.
- NF3. **Tipografía** display **Sora** 800/700, cuerpo **Inter**,
  mono **JetBrains Mono** (Google Fonts).
- NF4. **Stage color coding** semántico:
  seedling=verde, veg=azul, flower=violeta — con override toggle.
- NF5. **Mobile-first responsive** desde 412 × 892 hasta desktop
  (resolución de incógnita ?2 — el frame Android es viewport mínimo,
  no único).
- NF6. **Animaciones** `gl-bar-rise`, `gl-pulse-dot`, `gl-modal-in`,
  `gl-toast-in`.
- NF7. **Iconografía**: se mantiene `lucide-react` con tokens nuevos
  (resolución ?7).
- NF8. **Border-radius escalado** (`--r-sm 8 / --r-md 12 / --r-lg 18 /
  --r-xl 24`).
- NF9. **Patrón "eyebrow"** mono uppercase letter-spacing 0.14em
  para labels técnicos.

---

## 3. Requisitos

### 3.1 Explícitos (prototipo o reglas de repo)

- R1. CRUD con feedback Sonner (regla `code/CLAUDE.md` § UI Feedback Standard).
- R2. Mantener convención de errores
  `{ success, error: { code, message, fields } }` y `ApiResponseError`.
- R3. No tocar `.env`, no commitear secretos.
- R4. No commits directos a `main` del repo `code/`; rama descriptiva.
- R5. Tipografías declaradas en `index.html` del prototipo:
  Sora, Inter, JetBrains Mono.
- R6. Tokens CSS exactos: 8 superficies + 5 stage/status colors + 4 radii.
- R7. 5 ejes de variación del "Tweaks Panel" (acento, density, imagery,
  stageColor, chartStyle) **solo como herramienta dev** — no llegan a
  producción (resolución ?9).

### 3.2 Implícitos (deducidos del contraste prototipo↔producción)

- I1. **Reemplazo total** de paleta light → dark+neón
  (resolución ?1: `tailwind.config` y `globals.css` actuales dejan de ser
  fuente de verdad).
- I2. **Mobile-first responsive** — implica cambiar contenedor, header, nav.
- I3. Reemplazar header "logo + Settings + Logout topbar" por
  **bottom tab bar de 5 ítems con FAB central**.
- I4. AddPlant: **modal de un solo paso** → **flujo de 3 pasos** con
  upload zone.
- I5. **Login / Register / Home también** se rediseñan en línea con el
  sistema (resolución ?4) — quedan **sin referencia visual** en el prototipo.
- I6. `PlantCard` actual (light, badges Tailwind) debe rehacerse como
  `gl-plant-card` (dark, foto 96×96, eyebrow mono, stage color border).
- I7. **Sonner restilado** para encajar en dark + neón (resolución ?8);
  `gl-toast` del prototipo se descarta como sistema.

---

## 4. Restricciones

### 4.1 Técnicas

- T1. Stack fijo: React 18 + Vite + react-router-dom + Tailwind 3.4 +
  lucide-react + Sonner + recharts. El prototipo usa
  Babel-standalone + CSS plano + SVG inline — **no usa Tailwind ni recharts**.
  La conversión exige decidir en qué tecnología viven los tokens
  (CSS variables vs `tailwind.config`).
- T2. Tailwind config actual define paleta `primary/secondary/accent`
  verde apagada (`#1a4d2e` / `#3d7245`) que **contradice** las variables
  del prototipo (`#07120e` / `#22e26a`).
- T3. El prototipo usa `color-mix(in oklab, …)` y `backdrop-filter: blur` —
  soporte limitado a navegadores modernos.
- T4. **Pipeline de imágenes ampliado** (resolución ?10):
  upload real + URL libre + integración CDN + generación IA.
- T5. **Modelo de datos divergente** — ver §5.1.

### 4.2 De negocio / dominio

- N1. Producto: gestión de cultivo de cannabis (declarado en `package.json`
  y `CLAUDE.md`). El prototipo refuerza vocabulario:
  Northern Lights, OG Kush, GG #4, Sour Diesel, "trichome inspection",
  "bloom feed", "check pH".
- N2. Marco legal del usuario fuera de alcance del rediseño visual,
  pero se señala como contexto.

### 4.3 Operativas / proceso

- O1. CLAUDE.md del repo `code/` prohíbe escribir en la bóveda Obsidian
  desde el agente del repo. Este análisis se duplica en ambos repos
  manualmente como artefacto de handoff.
- O2. Tests Vitest deben seguir pasando; no hay tests visuales/snapshot.
- O3. El prototipo es decorativo + interactivo cliente-only:
  no tiene API, no tiene auth, no tiene persistencia. Todo lo relevante
  en producción (auth/JWT, react-query, hooks) debe sobrevivir al rediseño.

---

## 5. Riesgos, dependencias e incógnitas

### 5.1 Brechas de modelo de datos

| Concepto en prototipo | Existencia en `types/plants.ts` |
|---|---|
| `stage`: `seedling/veg/flower` (3 valores) | `growthStage`: 7 valores. Resolución ?6 = **coexisten** vía toggle Basic/Expert |
| `strain`: string libre ("Pure Indica", "Sour Diesel") | `strainType`: enum (`indica/sativa/hybrid/auto`) — el "Sour Diesel" es **nombre comercial**, no tipo |
| `careTag`: estado derivado ("Needs Water", "Check pH", "Thirsty") | No existe — `healthStatus` no cubre acciones recomendadas |
| `light` (`12/12`, `18/6`) | No existe (roadmap ?5) |
| `humidity %`, `temp °F` | No existen (roadmap ?5) |
| `day` (días desde plantación), `weekOfStage` ("5 of 9") | Calculable desde `stageStartDate`/`createdAt` pero **"5 of 9" requiere duración esperada de etapa** — no almacenada |
| `growthBars[]`, `weekDelta` ("+4.2\"") | No existen (roadmap ?5) |
| `heroPhoto` (alta resolución) | Solo `photoUrl` (single) |

### 5.2 Brechas funcionales

- D1. **Schedule (`/schedule`)** — ruta no existe.
  Resolución ?11: se construye sobre care-logs (futuras tareas).
- D2. **Profile (`/profile`)** — ruta no existe.
  Resolución ?12: features comprometidas.
- D3. **HomePage (`/`)** — existe; rediseño confirmado por ?4.
- D4. **Login / Register** — existen; rediseño confirmado por ?4.

### 5.3 Dependencias

- DP1. **Google Fonts** (Sora/Inter/JetBrains Mono) — dependencia externa
  nueva; impacto privacidad y carga.
- DP2. **Imágenes Unsplash** hardcodeadas en prototipo;
  producción decidirá hosting.
- DP3. **Recharts** ya en `package.json`; el prototipo no lo usa
  (CSS + SVG inline). El "Tweak: chartStyle" sugiere que recharts puede
  o no aplicar.

### 5.4 Riesgos

- R-1. **Pérdida de feature de producción al rediseñar** —
  el header actual muestra Settings/Logout; el bottom tab bar del
  prototipo no incluye logout obvio (queda dentro de Profile).
  Si Profile se difiere, hay regresión funcional.
- R-2. **Doble fuente de verdad para temas** —
  Tailwind config + CSS variables del prototipo;
  sin decisión clara, drift.
- R-3. **Schema migration** — adoptar `light/humidity/temp/weekOfStage`
  requiere migración Drizzle + cambios en endpoints + types.
- R-4. **Mobile-first vs desktop fallback** — definido (responsive),
  pero breakpoints concretos sin decidir (N1–N4).
- R-5. **Cannabis vocabulario en UI** — tensión con políticas de
  plataformas si se publica; fuera del alcance del rediseño visual.
- R-6. **Pipeline de imágenes ?10** —
  cuatro vías (upload + URL + CDN + IA) implican coste, seguridad
  (whitelist URL libre) y latencia.
- R-7. **"SYSTEM ONLINE" pulse y sensores** — el prototipo pinta
  hardware imaginado; sin backend de sensores se ofrece falsa promesa.

---

## 6. Cierre de incógnitas iniciales (?1–?12)

| # | Resolución |
|---|---|
| ?1  | **Reemplazo total** de la paleta |
| ?2  | **Mobile-first responsive** (412 → desktop) |
| ?3  | **ABIERTA** — Schedule/Profile alcance/diferimiento sin decidir |
| ?4  | **Login/Register/Home también se rediseñan** |
| ?5  | Campos ambientales y `weekOfStage/growthBars` son **roadmap** |
| ?6  | **Basic (3) / Expert (7)** coexisten vía setting |
| ?7  | Se mantiene `lucide-react` con **tokens nuevos** |
| ?8  | **Sonner restilado** |
| ?9  | Tweaks Panel = **herramienta dev** |
| ?10 | Imágenes: **upload + URL + CDN + IA** (todas) |
| ?11 | Care logs en **Schedule (futuras) + Plant Detail (histórico)** |
| ?12 | Notifications / Tent Profiles / Sensor Devices / Export Data
       son **features comprometidas** |

---

## 7. Estado de los supuestos S1–S11

| # | Supuesto | Estado |
|---|---|---|
| S1  | "Luce como" = identidad visual completa | ✅ Confirmado por ?1+?4 |
| S2  | Alcance: 4 pantallas core mínimas | ⏸ Pendiente de ?3 |
| S3  | Sigue siendo SPA web | ✅ Confirmado por ?2 |
| S4  | Login/Register/Home heredan estilo | ✅ Reforzado por ?4 |
| S5  | Backend no cambia | ❌ **Invalidado** por ?5+?10+?12 |
| S6  | Tweaks Panel no llega a prod | ✅ Confirmado por ?9 |
| S7  | Sin tests visuales en este alcance | ⏸ Sin pronunciamiento |
| S8  | Etapas siguen siendo 7 | ❌ **Replanteado** por ?6 (3+7) |
| S9  | Sin i18n | ⏸ Sin pronunciamiento |
| S10 | Sonner restilado, no reemplazado | ✅ Confirmado por ?8 |
| S11 | Sin pipeline de upload | ❌ **Invalidado** por ?10 |

---

## 8. Nuevas incógnitas emergentes (N1–N28)

> Estas surgen de las resoluciones del usuario.
> Deben cerrarse antes de redactar el Plan Maestro.

### Derivadas de ?2 (responsive 412 → desktop)
- N1. ¿Breakpoints concretos? (sm/md/lg/xl Tailwind o custom)
- N2. ¿Bottom tab bar se mantiene en desktop o muta a sidebar/topbar?
- N3. ¿Hero 360 px del Plant Detail crece, recorta o reposiciona en desktop?
- N4. ¿FAB central +Add se mantiene visible en desktop o se mueve a header?

### Derivadas de ?5 (ambientales como roadmap)
- N5. ¿Se diseñan los componentes (humidity widget, light cycle pill,
  growth bars) en esta entrega aunque queden vacíos/desactivados,
  o se difieren visualmente?
- N6. ¿Hay sensores reales planeados (Bluetooth/Wi-Fi/IoT) o entrada manual?
- N7. ¿"weekOfStage 5 of 9" implica almacenar duración esperada por etapa?
  ¿Configurable por usuario, por strain, o constante?
- N8. ¿`growthBars[]` se calcula desde mediciones manuales (altura semanal)
  o derivado?

### Derivadas de ?6 (Basic/Expert toggle)
- N9. ¿Dónde vive la preferencia? (Profile→Preferences, onboarding, ambas)
- N10. En modo Basic, ¿qué pasa con plantas en
  `harvesting/drying/curing/completed`? ¿Se agrupan como "Cure",
  se ocultan, se mapean a `flower`?
- N11. ¿Transición Basic ↔ Expert reversible sin pérdida?
  Confirmar que el storage persiste siempre el modelo de 7.
- N12. ¿Los pills del Garden cambian en runtime al alternar modo?

### Derivadas de ?10 (4 vías de imagen)
- N13. ¿Pipeline upload: cliente → CDN directo, o pasa por backend Hono?
- N14. ¿Qué CDN/storage? (S3, Cloudflare R2, Cloudinary, etc.)
- N15. ¿Generación IA: qué proveedor (OpenAI, Stability, Replicate,
  Anthropic vía Files), prompt-driven o estilizado por etapa?
- N16. ¿Cuotas/límites por usuario para subida y para IA?
  (impacto coste)
- N17. ¿"URL libre" admite cualquier dominio o whitelist?
  (riesgo XSS / hot-linking)
- N18. ¿Fotos múltiples por planta (timeline) entran ahora o solo
  `photoUrl` única?

### Derivadas de ?11 (Schedule sobre care-logs)
- N19. ¿Care-logs actuales son solo histórico o ya tienen campos de
  programación (`scheduledAt`, `recurring`)?
- N20. ¿Schedule trabaja con tareas **recurrentes** (riego cada 3 días)
  o solo singletons?
- N21. ¿La marca "completar tarea" la cierra y mueve al historial,
  o coexisten?

### Derivadas de ?12 (Profile = features reales)
- N22. **Notifications**: ¿push web (service worker), email transaccional
  (proveedor cuál), in-app únicamente, o las 3?
- N23. **Tent Profiles**: ¿qué entidad? ¿una tienda/tent agrupa N plantas
  y comparte luz/humidity/temp objetivo?
- N24. **Sensor Devices**: ¿qué hardware (Inkbird, Govee, propio)?
  ¿Bluetooth Web API, BLE puente, integración cloud-to-cloud?
- N25. **Export Data**: ¿CSV/JSON de qué entidades?
  ¿Plantas, care-logs, fotos? ¿Backup completo o filtrado?

### Generales
- N26. ¿Los textos del prototipo (Northern Lights, Sour Diesel, etc.)
  son **sample data** o se mantienen como **strain catalog**?
- N27. ¿Theme switch light/dark futuro o dark permanente?
- N28. ¿Accesibilidad: contraste neón verde sobre fondos oscuros y
  validación WCAG AA?

---

## 9. Bloqueantes para el Plan Maestro

Los siguientes deben cerrarse antes de redactar el Plan Maestro:

- **?3** — alcance Schedule/Profile.
- **S7** — política de tests visuales.
- **S9** — política de i18n.
- **N5–N8, N10, N11, N19, N20, N23, N24** —
  afectan al schema; si se difieren, fuerzan rework de DB/API y
  bloquean la UI.

Recomendación: resolver primero el subconjunto que afecta al schema.
Las decisiones puramente visuales (N1–N4, N17, N26–N28) pueden
diferirse al Plan Maestro.

---

## 10. Material de partida disponible

### Prototipo
- `01_PROJECTS/growlab/design/prototype/index.html` — entry
- `01_PROJECTS/growlab/design/prototype/styles.css` — tokens y componentes
- `01_PROJECTS/growlab/design/prototype/screens/` —
  garden, dashboard, plant-detail, add-plant, charts
- `01_PROJECTS/growlab/design/prototype/uploads/` —
  9 screenshots de referencia
- `01_PROJECTS/growlab/design/prototype/{app,android-frame,tweaks-panel,components,data}.jsx`

### Producción actual
- `01_PROJECTS/growlab/code/src/App.tsx` — router con 6 rutas
- `01_PROJECTS/growlab/code/src/routes/{garden,dashboard,login,register,index}.tsx`
- `01_PROJECTS/growlab/code/src/routes/plants/$plantId.tsx`
- `01_PROJECTS/growlab/code/src/components/plants/{PlantCard,AddPlantModal}.tsx`
- `01_PROJECTS/growlab/code/src/components/care-logs/{AddCareLogModal,CareLogList}.tsx`
- `01_PROJECTS/growlab/code/tailwind.config.ts`
- `01_PROJECTS/growlab/code/src/styles/globals.css`
- `01_PROJECTS/growlab/code/src/types/plants.ts`

### Reglas del repo
- `01_PROJECTS/growlab/code/CLAUDE.md` —
  toast con Sonner, no commits a `main`, no `.env`.
