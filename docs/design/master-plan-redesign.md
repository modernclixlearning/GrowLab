---
template: master-plan
project: growlab
type: master-plan
date: 2026-05-08
status: draft
related_analysis: docs/design/analysis-pre-master-plan-redesign.md
related_issues:
  - external/vault://01_PROJECTS/growlab/issues/growlab-issue-001-scope-schedule-profile.md
  - external/vault://01_PROJECTS/growlab/issues/growlab-issue-002-schema-extensions-environmentals.md
  - external/vault://01_PROJECTS/growlab/issues/growlab-issue-003-stage-toggle-basic-expert.md
  - external/vault://01_PROJECTS/growlab/issues/growlab-issue-004-image-pipeline.md
  - external/vault://01_PROJECTS/growlab/issues/growlab-issue-005-care-logs-as-schedule.md
  - external/vault://01_PROJECTS/growlab/issues/growlab-issue-006-profile-features.md
prototype: external/vault://01_PROJECTS/growlab/design/prototype/
supersedes: null
---

# Master Plan — Rediseño Visual GrowLab

> Plan maestro autoritativo para el rediseño visual + extensiones funcionales
> requeridas por el prototipo Claude Design (vive en la bóveda Obsidian externa
> bajo `<vault>/01_PROJECTS/growlab/design/prototype/`).
> Consolida las decisiones tomadas en los issues 001–006 (vault) y los hallazgos
> del análisis pre-Master Plan ([`analysis-pre-master-plan-redesign.md`](./analysis-pre-master-plan-redesign.md), PR #2).
>
> **Convención de paths en este doc:**
> los paths sin prefijo son **relativos a este repo** (`modernclixlearning/GrowLab`).
> Los paths del prototipo Claude Design y de los issues bloqueantes viven en una
> bóveda Obsidian externa y se marcan explícitamente como `<vault>/...`.
> En este repo solo viven las decisiones consolidadas.

---

## 1. Alcance

### 1.1 Qué entra (in-scope)

Todas las pantallas y features del prototipo, más las extensiones de schema y
backend que las hacen funcionales (no decorativas). Justificación: issue 001
(vault) cerró ?3 con SÍ a Schedule y Profile; issues 002, 004, 005, 006
declararon las features comprometidas.

**Pantallas (rediseño visual + cableado a datos reales):**

- **Garden** (`/garden`): lista filtrable con pills de etapa, search, tarjeta
  con foto + eyebrow + stage color border + careTag derivado, "SYSTEM ONLINE"
  pulse en header (análisis F1, F9; I6).
- **Dashboard** (`/dashboard`): vista "Today" con stats, tarjetas de cuidado
  pendientes (derivado de care-logs `scheduledAt <= today`), schedule de riego
  resumido, mini-chart de crecimiento (recharts) (F2).
- **Plant Detail** (`/plants/$plantId`): hero foto, datos ambientales (light,
  humidity, temp; expert-only), historial de care-logs completos, timeline de
  fotos por fase, acciones de cuidado (F3).
- **Add Plant** (modal): flujo de **3 pasos** — (1) foto (upload R2 directo o
  IA), (2) strain + nombre, (3) etapa + light cycle (expert) (F4, I4).
- **Schedule** (`/schedule`, **nueva**): vista semanal con day picker
  (lun–dom), conteo de tareas por día, tarea con hora + icono + planta
  vinculada + acción VIEW (F5, derivado de issue 005).
- **Profile** (`/profile`, **nueva**): avatar, stats (Plants/Harvests/Days
  Active), Preferences: Notifications, Tent Profiles, Sensor Devices, Export
  Data, Stage Mode (Basic/Expert), About, **Logout** (F6, derivado de issues
  001 + 003 + 006; mitiga R-1).
- **Login / Register / Home (`/`)**: rediseño coherente con el sistema sin
  referencia visual en el prototipo (?4, I5).

**Layout / chrome:**

- Bottom tab bar de **5 ítems funcionales** + **FAB central "Add Plant"** (F7,
  issue 001). Mobile-first 412×892; responsive hasta desktop (?2).
- Sonner restilado (no reemplazado) para encajar con dark+neón (?8, I7, R1).

**Sistema visual:**

- Tema oscuro permanente (NF1), acento neón `#22e26a` con glow (NF2),
  tipografía Sora/Inter/JetBrains Mono (NF3, R5), stage color coding (NF4),
  animaciones declaradas en `<vault>/.../prototype/styles.css` (NF6),
  iconografía lucide-react con tokens nuevos (NF7, ?7), border-radius escalado
  (NF8), patrón "eyebrow" mono uppercase (NF9), tokens CSS exactos del
  prototipo (R6).

**Schema (resumen, detalle en §4):**

- Extensiones a `users`, `plants`, `care_logs`.
- Tablas nuevas: `tents`, `plant_photos`, `strain_templates`,
  `sensor_devices`, `sensor_readings`, `notifications`, `export_jobs`.

**Pipelines / integraciones:**

- Pipeline de imágenes: presigned URL → Cloudflare R2; generación IA
  provider-agnostic (issue 004). URL libre eliminada (N17 cerrado).
- Sensores cloud-to-cloud (Govee, Inkbird, SwitchBot) por polling backend
  (issue 006 / N24).
- Notifications: push web + email transaccional (Basic default;
  Expert-configurable) (N22).
- Export Data: CSV + JSON, async, link de descarga (N25).

**Estado de los supuestos del análisis:** S5 y S11 quedan invalidados (este
plan **modifica el backend** y **construye pipeline de upload**); S8
replanteado a 3+7 vía toggle (issue 003).

### 1.2 Qué se difiere (roadmap)

- **Theme switch light/dark** (N27): dark permanente; no se construye
  alternancia.
- **i18n** (S9): textos en inglés/español embebidos; no hay infra i18n.
- **Tweaks Panel "refined" en producción** (?9, R7): solo herramienta dev.
- **Web BLE para sensores** (N24): cloud-only en este Master Plan.
- **WCAG AA audit formal** (N28): se aplican criterios mínimos durante el
  rediseño (contraste neón sobre fondos oscuros, focus rings) pero no audit
  exhaustivo.
- **Cuotas de upload directo** (N16, parcial): solo IA tiene cuota; upload
  directo a R2 sin cap explícito (egress fees nulos en R2).
- **Strain catalog poblado** (N26): se construye la tabla
  `strain_templates` y se siembra con un set inicial corto (5–10 strains
  populares); ampliación queda fuera de alcance.
- **Notifications avanzadas** (granularidad por tipo de evento, snooze,
  silencios): el alcance es ON/OFF por canal en Expert; configuración fina
  más adelante.

### 1.3 Tabla resumen de pantallas y modos

| Pantalla | Ruta | Basic | Expert | Componentes nuevos |
|---|---|---|---|---|
| Home | `/` | rediseño visual | rediseño visual | hero CTA, eyebrow stats |
| Login | `/login` | rediseño visual | rediseño visual | dark + neón |
| Register | `/register` | rediseño visual | rediseño visual | dark + neón |
| Garden | `/garden` | pills 3 etapas (Harvest bucket) | pills 7 etapas | PlantCard, SystemPulse, StagePills |
| Dashboard | `/dashboard` | stats simplificadas | + ambientales agregados | StatCard, CareTaskCard, MiniChart |
| Plant Detail | `/plants/$plantId` | foto + careTag + weekOfStage | + humidity/light/temp + growthBars | HumidityWidget, LightCyclePill, GrowthBars, PhotoTimeline |
| Add Plant | modal 3 pasos | sin light cycle | + light cycle | UploadZone, StrainPicker, StagePicker |
| Schedule | `/schedule` | tareas singletons + recurring | + recurrencia avanzada (custom) | DayPicker, TaskRow, RecurrenceForm |
| Profile | `/profile` | items disponibles | + Sensor config + recurrence custom | AvatarHeader, PrefsList, ToggleStageMode |

Mapping Expert→Basic stages (issue 003):
`seedling→seedling | vegetative→veg | flowering→flower |
harvesting/drying/curing/completed→Harvest`.

---

## 2. Arquitectura del tema

### 2.1 Decisión: Tailwind extend (config-driven) + CSS vars mínimas

**Decisión adoptada:** los tokens del prototipo se traducen a
[`tailwind.config.ts`](../../tailwind.config.ts) (extend) como **fuente de
verdad**. CSS variables se reservan **solo** para los casos donde se necesita
variación runtime sin recompilación: el preset "refined" del Tweaks Panel
(dev-only) y el override de stage colors en futuras extensiones de strain
catalog.

**Razonamiento:**

- El stack actual (Tailwind 3.4, sin dark mode toggle planeado, sin runtime
  theme switch) hace que CSS vars puras sean overhead injustificado: cada
  utility tendría que pasar por `bg-[var(--card)]` perdiendo arbitrary value
  cache, autocompletado y el resto de la maquinaria de Tailwind.
- Decisión coherente con análisis §4 T1 (stack fijo) y §6 (?9): el Tweaks
  Panel es dev-only, por lo que la única razón para CSS vars en runtime
  desaparece.
- Híbrido descartado por riesgo R-2 (doble fuente de verdad). Una sola fuente
  (Tailwind config) + un pequeño "puente" CSS var (solo accent palette) para
  el dev panel evita drift.
- Tailwind 3.4 soporta arbitrary values y modificadores (`bg-card/80`)
  suficientes para reproducir `color-mix` del prototipo donde sea necesario.

**Tokens consolidados (Tailwind extend):**

```ts
// tailwind.config.ts (target shape, no implementación todavía)
export default {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: '#07120e', 1: '#0c1b15', 2: '#122821' },
        card: { DEFAULT: '#102019', 2: '#16291f' },
        line: { DEFAULT: '#1f3a2e', 2: '#284a3a' },
        fg: { DEFAULT: '#f1faf4', 2: '#aebcb3', 3: '#6f8479', 4: '#4b5d54' },
        accent: {
          DEFAULT: '#22e26a',
          dark: '#0d8a3d',
          soft: '#103a23',
        },
        stage: {
          seedling: '#22e26a',
          veg: '#5ec9ff',
          flower: '#c577ff',
        },
        status: {
          water: '#3a9be8',
          thirsty: '#e09849',
          alert: '#d97c2e',
          warn: '#e74c4c',
          good: '#22e26a',
        },
      },
      fontFamily: {
        display: ['Sora', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '18px',
        xl: '24px',
      },
      boxShadow: {
        'accent-glow': '0 0 24px rgba(34, 226, 106, 0.45)',
      },
      letterSpacing: {
        eyebrow: '0.14em',
      },
      keyframes: {
        'gl-bar-rise': { /* tokens del prototipo */ },
        'gl-pulse-dot': {},
        'gl-modal-in': {},
        'gl-toast-in': {},
      },
      animation: {
        'gl-bar-rise': 'gl-bar-rise 600ms cubic-bezier(0.2,0.7,0.2,1) both',
        'gl-pulse-dot': 'gl-pulse-dot 1.6s ease-in-out infinite',
        'gl-modal-in': 'gl-modal-in 220ms ease-out both',
        'gl-toast-in': 'gl-toast-in 180ms ease-out both',
      },
    },
  },
}
```

**CSS vars residuales** (en [`src/styles/globals.css`](../../src/styles/globals.css),
scope `[data-accent="refined"]` opcional):

```css
:root {
  --accent: #22e26a;        /* mirror del token Tailwind, solo para dev panel */
  --accent-glow: 0 0 24px rgba(34, 226, 106, 0.45);
}
[data-accent="refined"] {
  --accent: #7fd1a1;
  /* … */
}
```

Las clases globales (`.gl-shell`, `.gl-scroll`, `.gl-h1`, etc.) del prototipo
se reescriben como **componentes React tipados** (`Shell`, `Scroll`, `H1`)
con utilidades Tailwind, no se portan como CSS plano. Justificación: T1.

### 2.2 Spacing y density

Spacing escala default de Tailwind (`4/8/12/16/24/32/48`) cubre el prototipo.
Eje "density" del Tweaks Panel queda como dev-only (?9), no se expone en
producción.

### 2.3 Iconografía y assets

- Iconos: `lucide-react` ya en [`package.json`](../../package.json) (?7).
  Reemplazar SVGs inline del prototipo por componentes Lucide;
  mapear `drop→Droplets`, `flask→FlaskConical`, etc.
- Fuentes: cargar desde **Google Fonts** vía `<link rel="preconnect">` + tag
  en [`index.html`](../../index.html) (DP1). Subset `latin` + weights
  necesarios (Sora 700/800, Inter 400/500/600, JetBrains Mono 400/500).
  Privacidad evaluada en §8.
- Imágenes Unsplash del prototipo: **descartadas** en producción (DP2). Los
  campos `photoUrl` se rellenan vía pipeline R2 / IA (§5).

---

## 3. Plan por fases

Cada fase entrega valor visible y mergeable a `main` de este repo de forma
independiente. El orden busca minimizar bloqueos cruzados: el sistema de
diseño y el shell habilitan F1–F6; las features pesadas (sensores, IA,
schedule) llegan después con el chrome ya en pie.

Convención: cada fase con **objetivo**, **entregables**, **criterios done**,
**dependencias**.

### Fase F0 — Tema, tokens, fonts, app shell

- **Objetivo:** sustituir el tema light por el tema oscuro/neón sin romper
  pantallas existentes; introducir tokens, fonts y el chrome móvil
  (bottom tab + FAB).
- **Entregables:**
  - [`tailwind.config.ts`](../../tailwind.config.ts) reescrito con los tokens
    de §2 (paleta, fonts, radii, animations, shadows, letter-spacing).
  - [`src/styles/globals.css`](../../src/styles/globals.css) limpio: solo
    `@tailwind base/components/utilities` + reset minimalista + CSS vars
    residuales del Tweaks Panel dev.
  - [`index.html`](../../index.html) carga Google Fonts (Sora, Inter,
    JetBrains Mono).
  - Componentes shell: `<AppShell>`, `<BottomNav>`, `<Fab>`, `<Eyebrow>`,
    `<H1/H2/H3>`, `<SystemPulse>`.
  - Sonner restilado (theme dark + neón, glow opcional para success).
  - Pantallas existentes (Garden, Dashboard, Plant Detail, Login, Register,
    Home) re-skinadas mínimamente con los nuevos tokens, sin lógica nueva.
  - **Visual regression harness (Playwright)**:
    - Dependencia: `npm i -D @playwright/test`.
    - `playwright.config.ts` con `testDir: 'tests/visual/'`, browser
      `chromium`, viewport mobile-first `412×892` (Android del prototipo),
      `expect.toHaveScreenshot.maxDiffPixelRatio: 0.001`.
    - Scripts en `package.json`: `"test:e2e": "playwright test"`,
      `"test:e2e:update": "playwright test --update-snapshots"`.
    - `tests/visual/garden.spec.ts` con 1 golden inicial (Garden seed state).
    - `.github/workflows/visual-regression.yml` opcional como nice-to-have
      en F0; se vuelve obligatorio en F1.
- **Done:**
  - `npm run typecheck`, `npm run test:run`, y `npm run test:e2e` pasan.
  - Las 6 rutas actuales renderizan sin regresiones funcionales con dark
    theme.
  - Sonner muestra success/error con tokens nuevos.
- **Dependencias:** ninguna previa.

### Fase F1 — Pantallas core rediseñadas (sin features Expert ni schema nuevo)

- **Objetivo:** dejar las 6 pantallas existentes con la identidad final,
  asumiendo modelo de datos actual (sin ambientales, sin tents, sin
  schedule, sin photo timeline).
- **Entregables:**
  - **Garden**: `<PlantCard>` (foto 96×96, eyebrow mono, stage border,
    careTag derivado de care-logs últimos 48h), `<StagePills>`, search bar,
    `<SystemPulse>` con conteo real (`N ACTIVE PLANTS · M FLOWERING`).
  - **Dashboard**: `<StatCard>`, `<CareTaskCard>` (read-only de care-logs
    recientes), placeholder `<MiniChart>` con datos derivados de `createdAt`.
  - **Plant Detail**: hero foto desde `photoUrl`, `<CareLogTimeline>`
    rediseñado, acciones (Add Care Log) re-skinadas. Aún sin
    humidity/light/temp/growthBars.
  - **Login/Register/Home**: rediseño dark + neón con form fields, toasts.
  - **Add Plant**: refactor a flujo de 3 pasos (`<Stepper>`) reutilizando
    upload-by-URL temporal (placeholder hasta F5).
- **Done:**
  - PR independiente, mergeable, sin migrations DB.
  - Tests Vitest existentes siguen pasando; añadir 1 test de smoke por
    pantalla nueva.
- **Dependencias:** F0.

### Fase F2 — Schema base (users prefs, tents, plants extensiones, strain templates) + toggle Basic/Expert

- **Objetivo:** introducir el modelo de datos extendido para todo lo que NO
  depende de care-logs/imagen/sensores. Habilitar el toggle Stage Mode.
- **Entregables (DB):** ver §4.1 y §4.2 — migraciones para:
  - `users`: `+ stageMode`, `+ unitsPreference`, `+ avatarUrl`,
    `+ notificationPrefs jsonb`, `+ defaultTentId`.
  - `tents` (nueva).
  - `strain_templates` (nueva, seed inicial).
  - `plants`: `+ tentId`, `+ strainTemplateId`, `+ strainName`,
    `+ stageDurationOverride jsonb`, `+ lightSchedule`, `+ heroPhotoUrl`.
- **Entregables (API):**
  - Endpoints CRUD para `tents`, `strain_templates` (read-only).
  - `PATCH /me` extendido (stageMode, unitsPreference, …).
  - Plant endpoints actualizados con nuevos campos.
- **Entregables (UI):**
  - **Profile** (mínimo viable): avatar header, stats reales, lista de prefs
    con `<ToggleStageMode>` funcional, Logout.
  - Garden `<StagePills>` reactiva al toggle (Basic 3 / Expert 7 +
    Harvest bucket) (issue 003).
  - Plant Detail muestra `weekOfStage` derivado (visible Basic+Expert) y
    light cycle pill (Expert-only) cuando `lightSchedule` no nulo.
- **Done:**
  - Migraciones reversibles (down scripts presentes y probadas en local).
  - Toggle Basic ↔ Expert reversible sin pérdida (issue 003 N11).
  - Tests Vitest + 1 test E2E del flujo onboarding (toggle on first login).
- **Dependencias:** F1.

### Fase F3 — Care logs como Schedule (recurrencia + Schedule screen)

- **Objetivo:** transformar care-logs en agenda + histórico (issue 005).
  Construir la pestaña Schedule.
- **Entregables (DB):** §4.2 — migración care-logs:
  - `+ scheduledAt`, `+ completedAt`, `+ recurrenceRule jsonb`,
    `+ parentScheduleId`.
- **Entregables (API):**
  - Endpoint `GET /care-logs?scheduledFrom&scheduledTo` para Schedule.
  - Endpoint `POST /care-logs/:id/complete` que setea `completedAt = now()`,
    actualiza `loggedAt`, y si `recurrenceRule` no nulo genera la próxima
    instancia.
  - Validación RRULE simplificada (`frequency`, `interval`, `byWeekday[]`,
    `until?`, `count?`).
- **Entregables (UI):**
  - **Schedule** (`/schedule`): `<DayPicker>` lun–dom con conteo, lista de
    `<TaskRow>` (hora + icono + planta + VIEW), badge "completed" cuando
    aplica.
  - Add Care Log modal extendido con `<RecurrenceForm>` (Basic: solo
    singleton + daily/weekly preset; Expert: custom con byWeekday).
  - Dashboard `<CareTaskCard>` ahora consume `scheduledAt <= today AND
    completedAt IS NULL`.
- **Done:**
  - Migración aplicable en limpio y sobre datos existentes
    (loggedAt → completedAt en filas pasadas, default `scheduledAt = NULL`).
  - Tareas recurrentes generan próxima instancia al completar (test
    explícito).
- **Dependencias:** F0 (chrome) + F2 (Profile para stageMode). Schema de F3
  no depende de F2.

### Fase F4 — Pipeline de imágenes (R2 presigned + IA provider-agnostic + photo timeline)

- **Objetivo:** habilitar upload real + generación IA. Reemplazar el
  placeholder de F1 en Add Plant. Construir timeline de fotos por fase
  (issue 004).
- **Entregables (DB):** §4.1 — `plant_photos` (nueva).
- **Entregables (API / infra):**
  - `POST /uploads/presigned` (Hono) → devuelve URL firmada de R2 (nunca ve
    los bytes — N13).
  - `POST /ai/generate-image` (Hono) → wrapper provider-agnostic que lee
    `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` y delega; persiste el resultado
    en R2 + crea fila `plant_photos`.
  - Cuotas IA por planta: Basic 1, Expert 5 (issue 004 N16). Cuotas fotos por
    fase: Basic 2, Expert 5 (N18).
  - Endpoint `GET /plants/:id/photos?stage=…` para el timeline.
- **Entregables (UI):**
  - Add Plant paso 1: `<UploadZone>` con drag&drop + IA toggle (prompt-driven
    o stage-styled).
  - Plant Detail: `<PhotoTimeline>` agrupado por etapa, contador de cuota
    visible.
  - Garden `<PlantCard>` y Plant Detail hero leen primero `heroPhotoUrl`
    (último photo del estado actual) con fallback a `photoUrl`.
- **Done:**
  - Vars de entorno documentadas en `.env.example` (R3): `R2_*`,
    `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL`.
  - Tests de validación de cuota (rechazar >cap con error tipado).
  - URL libre **no implementada** (N17 cerrado).
- **Dependencias:** F2 (necesita `stageMode` en `users` para gating de
  cuotas). Schema independiente del de F3.

### Fase F5 — Ambientales, sensores cloud, growth measurements

- **Objetivo:** poblar el lado Expert de Plant Detail + Dashboard con datos
  ambientales reales o manuales (issues 002 + 006 / N24).
- **Entregables (DB):** §4.1 — `sensor_devices`, `sensor_readings`,
  `growth_measurements`.
- **Entregables (API / infra):**
  - CRUD `sensor_devices` (API key encriptada at-rest con `crypto.subtle`
    o `node:crypto` + KEK desde env).
  - Job de polling backend (cron/interval) para Govee/Inkbird/SwitchBot
    (provider abstraction).
  - CRUD `growth_measurements` (height, otras métricas manuales) →
    `growthBars[]` derivado.
- **Entregables (UI):**
  - Profile → Sensor Devices: lista + add (provider + API key + label +
    target plant/tent).
  - Plant Detail Expert: `<HumidityWidget>`, `<LightCyclePill>`,
    `<TempWidget>`, `<GrowthBars>` (5 últimas semanas, `weekDelta`).
  - Dashboard agregados Expert.
  - "SYSTEM ONLINE" pulse: muestra estado real (sensores reportando vs no).
- **Done:**
  - Job polling con backoff exponencial en error.
  - Tests de derivación growthBars desde mediciones manuales.
  - Modo manual: usuario puede dejar `sensor_devices` vacío y registrar
    humidity/temp manualmente desde Plant Detail (N6 — coexisten).
- **Dependencias:** F2 (tents para target).

### Fase F6 — Notifications + Export Data + polishing

- **Objetivo:** cerrar las features residuales de Profile (issue 006 / N22,
  N25) y aplicar polish global.
- **Entregables (DB):** §4.1 — `notifications`, `export_jobs`,
  `push_subscriptions`.
- **Entregables (API / infra):**
  - Service Worker para push web; endpoint `POST /push/subscribe`.
  - Provider de email transaccional (env-driven, p.ej. Resend o SES) —
    abstracción para no acoplar.
  - Worker async para Export: genera CSV + JSON, sube a R2, devuelve link
    firmado (TTL 7d).
- **Entregables (UI):**
  - Profile → Notifications: toggles (Basic: bandera global on/off; Expert:
    push/email/in-app independientes).
  - Profile → Export Data: botón "Generate export" → estado `pending →
    ready` con badge + botón download.
  - Polishing transversal: animaciones (`gl-bar-rise`, `gl-pulse-dot`,
    `gl-modal-in`, `gl-toast-in`) aplicadas, focus rings con `accent-glow`,
    accesibilidad (alt texts, aria-labels), mobile→desktop responsive
    breakpoints (sm/md/lg/xl Tailwind default — N1).
- **Done:**
  - Push web funcional en Chrome desktop + Android (Safari iOS queda como
    nice-to-have).
  - Email transaccional opcional (si env vars no presentes, feature
    disabled silenciosamente, sin crash).
  - Export reproducible con datos reales del usuario.
- **Dependencias:** F4 (R2 ya operativo para export blobs).

### Mapa de dependencias

```
F0 ─┬─> F1 ─┬─> F2 ─┬─> F3
    │       │       ├─> F4 ─> F5
    │       │       └─────────> F6
    │       │
    │       └─> (tema + chrome consumido por todas)
```

F3, F4 son paralelizables entre sí una vez F2 mergeado. F5 depende de F2
(tents). F6 depende de F4 (R2).

---

## 4. Cambios de schema (Drizzle migrations)

Drizzle ORM 0.36 + drizzle-kit 0.28 + PostgreSQL. Convenciones:

- IDs `text` con `nanoid()` salvo `users.id` que ya es UUID.
- Timestamps `timestamp({ withTimezone: true })` con default `now()`.
- Enums como `text` con runtime check (consistente con schema actual,
  evita migration de tipos PG enum).
- FK con `onDelete: 'cascade'` salvo donde se anota `'set null'`.
- Índices explícitos en columnas de filtro frecuente.

### 4.1 Tablas nuevas

**`tents`** (F2):

| Columna | Tipo Drizzle | Notas |
|---|---|---|
| `id` | `text().primaryKey().$defaultFn(() => nanoid())` | |
| `userId` | `text().notNull().references(() => users.id, { onDelete: 'cascade' })` | |
| `name` | `text().notNull()` | "Tent A", "Veg room" |
| `lightTarget` | `text()` | p.ej. `"18/6"` |
| `humidityTargetPct` | `numeric({ precision: 5, scale: 2 })` | |
| `tempTargetC` | `numeric({ precision: 5, scale: 2 })` | unidad fija C en DB; UI convierte |
| `notes` | `text()` | |
| `createdAt` / `updatedAt` | timestamps default `now()` | |

Index: `idx_tents_user_id`.

**`strain_templates`** (F2):

| Columna | Tipo Drizzle | Notas |
|---|---|---|
| `id` | `text().primaryKey().$defaultFn(() => nanoid())` | |
| `name` | `text().notNull().unique()` | "Northern Lights", "OG Kush" |
| `strainType` | `text().notNull()` | indica/sativa/hybrid/auto |
| `stageDurations` | `jsonb()` | `{ seedling: 14, vegetative: 35, flowering: 63, ... }` (días) |
| `defaultLightSchedule` | `jsonb()` | `{ veg: "18/6", flower: "12/12" }` |
| `description` | `text()` | |
| `createdAt` | timestamp default `now()` | |

Seed inicial: 5–10 strains populares (Northern Lights, OG Kush, Blue Dream,
GG #4, Sour Diesel, White Widow).

**`plant_photos`** (F4):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text().primaryKey().$defaultFn(() => nanoid())` | |
| `plantId` | `text().notNull().references(() => plants.id, { onDelete: 'cascade' })` | |
| `stage` | `text().notNull()` | growthStage en el momento de subida |
| `url` | `text().notNull()` | R2 URL canónica |
| `sourceType` | `text().notNull()` | `'upload' \| 'ai'` |
| `aiPrompt` | `text()` | nullable; presente si sourceType='ai' |
| `aiProvider` | `text()` | `AI_PROVIDER` snapshot al momento |
| `width` / `height` | `integer()` | |
| `createdAt` | timestamp default `now()` | |

Index: `idx_plant_photos_plant_id_stage`.

**`sensor_devices`** (F5):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text().primaryKey().$defaultFn(() => nanoid())` | |
| `userId` | `text().notNull().references(() => users.id, { onDelete: 'cascade' })` | |
| `provider` | `text().notNull()` | `'govee' \| 'inkbird' \| 'switchbot' \| 'manual'` |
| `apiKeyEncrypted` | `text()` | nullable; AES-GCM con KEK (env). Required para `provider != 'manual'` (validación en API). |
| `label` | `text().notNull()` | nombre visible |
| `targetPlantId` | `text().references(() => plants.id, { onDelete: 'set null' })` | nullable |
| `targetTentId` | `text().references(() => tents.id, { onDelete: 'set null' })` | nullable |
| `lastPollAt` | timestamp | |
| `lastError` | `text()` | nullable; último error de polling |
| `createdAt` | timestamp default `now()` | |

Constraint: exactly one of `targetPlantId` / `targetTentId` no nulo (check
constraint o validación API).

**`sensor_readings`** (F5):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text().primaryKey().$defaultFn(() => nanoid())` | |
| `sensorDeviceId` | `text().notNull().references(() => sensor_devices.id, { onDelete: 'cascade' })` | |
| `plantId` | `text().references(() => plants.id, { onDelete: 'set null' })` | denormalizado para query |
| `tentId` | `text().references(() => tents.id, { onDelete: 'set null' })` | |
| `metric` | `text().notNull()` | `'humidity' \| 'temperature' \| 'light'` |
| `value` | `numeric({ precision: 10, scale: 4 }).notNull()` | |
| `unit` | `text().notNull()` | `'%' \| 'C' \| 'F' \| 'lux'` (humidity → `%`, temperature → `C`/`F`, light → `lux`) |
| `recordedAt` | `timestamp({ withTimezone: true }).notNull()` | provided by sensor |

Index: `idx_sensor_readings_metric_recordedAt` y compound
`(plantId, metric, recordedAt)` para series.

**`growth_measurements`** (F5):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text().primaryKey().$defaultFn(() => nanoid())` | |
| `plantId` | `text().notNull().references(() => plants.id, { onDelete: 'cascade' })` | |
| `metric` | `text().notNull()` | `'height_cm' \| 'leaf_count'` (extensible) |
| `value` | `numeric({ precision: 10, scale: 2 }).notNull()` | |
| `recordedAt` | timestamp default `now()` | |

`growthBars[]` y `weekDelta` se derivan en query/server, no se almacenan
(N8 — issue 002).

**`notifications`** (F6):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text().primaryKey().$defaultFn(() => nanoid())` | |
| `userId` | `text().notNull().references(() => users.id, { onDelete: 'cascade' })` | |
| `kind` | `text().notNull()` | `'care_due' \| 'sensor_alert' \| 'system'` |
| `title` | `text().notNull()` | |
| `body` | `text()` | |
| `payload` | `jsonb()` | deep-link, plantId, etc. |
| `readAt` | timestamp | nullable |
| `createdAt` | timestamp default `now()` | |

**`push_subscriptions`** (F6):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text().primaryKey().$defaultFn(() => nanoid())` | |
| `userId` | `text().notNull().references(() => users.id, { onDelete: 'cascade' })` | |
| `endpoint` | `text().notNull().unique()` | |
| `keysP256dh` | `text().notNull()` | |
| `keysAuth` | `text().notNull()` | |
| `createdAt` | timestamp default `now()` | |

**`export_jobs`** (F6):

| Columna | Tipo | Notas |
|---|---|---|
| `id` | `text().primaryKey().$defaultFn(() => nanoid())` | |
| `userId` | `text().notNull().references(() => users.id, { onDelete: 'cascade' })` | |
| `status` | `text().notNull()` | `'pending' \| 'ready' \| 'failed'` |
| `format` | `text().notNull()` | `'csv' \| 'json'` (puede generar ambos como zip) |
| `downloadUrl` | `text()` | R2 signed URL, TTL 7d |
| `errorMessage` | `text()` | |
| `createdAt` / `completedAt` | timestamps | |

### 4.2 Columnas a agregar a tablas existentes

**`users`** (F2):

| Columna | Tipo | Default |
|---|---|---|
| `stageMode` | `text().notNull()` | `'expert'` (preserva comportamiento actual; onboarding pisa para nuevos) |
| `unitsPreference` | `jsonb()` | `{ temp: 'C', length: 'cm' }` |
| `avatarUrl` | `text()` | nullable |
| `notificationPrefs` | `jsonb()` | `{ push: true, email: true, inApp: true }` |
| `defaultTentId` | `text().references(() => tents.id, { onDelete: 'set null' })` | |

(Decisión: prefs viven en `users` directamente, no en tabla aparte. Volumen
bajo + acceso siempre conjunto con la sesión = JOIN innecesario.)

**`plants`** (F2 + F4):

| Columna | Tipo | Notas |
|---|---|---|
| `tentId` | `text().references(() => tents.id, { onDelete: 'set null' })` | nullable |
| `strainTemplateId` | `text().references(() => strain_templates.id, { onDelete: 'set null' })` | nullable; permite freeform |
| `strainName` | `text()` | nullable; nombre comercial libre cuando no hay template |
| `stageDurationOverride` | `jsonb()` | override por planta de duraciones de etapa |
| `lightSchedule` | `text()` | `"18/6"`, `"12/12"`; nullable |
| `heroPhotoUrl` | `text()` | nullable; cache del último plant_photo del estado actual |
| `weekDeltaCache` | `numeric({ precision: 6, scale: 2 })` | nullable; opcional para evitar query en list |

`weekOfStage` ("5 of 9") se deriva en server: `floor((now -
stageStartDate)/7) + 1` sobre `total = (stageDurationOverride || strainTemplate.stageDurations)[currentStage] / 7`.

**`care_logs`** (F3):

| Columna | Tipo | Notas |
|---|---|---|
| `scheduledAt` | `timestamp({ withTimezone: true })` | nullable; cuándo está programada |
| `completedAt` | `timestamp({ withTimezone: true })` | nullable; cuándo se completó |
| `recurrenceRule` | `jsonb()` | `{ frequency, interval, byWeekday?, until?, count? }` |
| `parentScheduleId` | `text().references((): any => careLogs.id, { onDelete: 'set null' })` | self-FK; nullable |

Compatibilidad: filas existentes mantienen `loggedAt`; al aplicar la
migración, se setea `completedAt = loggedAt` para filas con `loggedAt < now`.
`loggedAt` se conserva como sinónimo histórico (no se borra para no romper
tests/queries existentes).

### 4.3 Orden de migración y reversibilidad

Cada fase corresponde a 1 migration file (drizzle-kit `db:generate`).
Drizzle no genera down automáticamente; el plan exige escribir el down a mano
en cada PR.

| # | Migration | Fase | Reversible |
|---|---|---|---|
| `0001` | users prefs + tents + strain_templates + plants extensiones | F2 | Sí (down: drop columns + drop tables) |
| `0002` | care_logs schedule columns | F3 | Sí (down: drop columns; backfill `loggedAt` no se revierte) |
| `0003` | plant_photos | F4 | Sí |
| `0004` | sensor_devices + sensor_readings + growth_measurements | F5 | Sí |
| `0005` | notifications + push_subscriptions + export_jobs | F6 | Sí |

Política: cada migration debe ser aplicable a la DB de producción **sin
downtime** (no rewrites de tablas grandes; columnas nuevas siempre nullable
o con default barato).

---

## 5. Estrategia de pipeline de imágenes

Consolidación de issue 004.

### 5.1 Flujo de upload directo

1. Cliente solicita `POST /uploads/presigned` al backend Hono con
   `{ plantId, stage, contentType, contentLength }`.
2. Backend valida (cuota fotos por fase según stageMode), genera URL firmada
   R2 con TTL corto (5 min) y key `users/{userId}/plants/{plantId}/{stage}/{nanoid}`.
3. Cliente hace `PUT` directo a R2 con la URL firmada (los bytes nunca tocan
   Hono — N13).
4. Cliente notifica `POST /plants/:plantId/photos` con la URL final + meta
   (width, height, sourceType='upload') → backend persiste fila
   `plant_photos`.
5. Backend actualiza `plants.heroPhotoUrl` si la foto pertenece al stage
   actual.

Errores manejados: cuota excedida (HTTP 402-tipado-app `QUOTA_EXCEEDED`),
contentType no permitido, contentLength excesivo (>10 MB).

### 5.2 Flujo IA (provider-agnostic)

1. Cliente `POST /ai/generate-image` con `{ plantId, prompt? | stagePreset?,
   stage }`.
2. Backend valida cuota IA (`Basic: 1 / planta`, `Expert: 5 / planta`).
3. Backend lee `AI_PROVIDER`, `AI_API_KEY`, `AI_MODEL` y delega vía adapter.
   Adapter mínimo soporta: prompt + size + return URL/bytes. Implementaciones
   intercambiables (OpenAI Images, Stability, Replicate, etc.).
4. Backend descarga el resultado, sube a R2 con la misma key scheme,
   persiste `plant_photos` con `sourceType='ai'`, `aiPrompt`, `aiProvider`.

Modos:
- **Prompt-driven**: el usuario escribe el prompt.
- **Stage preset**: backend mapea `growthStage → prompt template`
  (p.ej. `flowering → "macro photograph of cannabis flower in late
  flowering stage, dense trichomes, studio lighting"`). Mapeos en
  `src/server/ai/stage-presets.ts`.

### 5.3 Decisión URL libre (N17)

**Eliminada del alcance.** Razón: coste de mantener allowlist + validación
SSRF + protección hot-linking no compensa el valor ya cubierto por upload+IA.

### 5.4 Cuotas y unidades

| Modo | Fotos por fase de planta | IA por planta |
|---|---|---|
| Basic | 2 | 1 |
| Expert | 5 | 5 |

Implementación: count en `plant_photos WHERE plantId=? AND stage=?` antes de
emitir presigned o llamar IA.

### 5.5 Seguridad y configuración

- R2: bucket privado; URLs firmadas con TTL 5 min para upload, 24 h para
  read (CDN delante con cache pública por hash de path; rotación
  innecesaria si el path incluye nanoid).
- Vars: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`,
  `R2_BUCKET`, `R2_PUBLIC_BASE_URL`. **Nunca** en `.env` commiteado (R3).
- IA: `AI_PROVIDER` (string), `AI_API_KEY`, `AI_MODEL`. Si ausente, feature
  disabled (UI muestra "AI generation unavailable").

---

## 6. Sensores e integración cloud

Consolidación de issue 006 / N24.

### 6.1 Proveedores soportados

- **Govee** (https://developer.govee.com): API key personal, cobertura
  humedad/temperatura.
- **Inkbird** (Engbird Cloud): API key + device serial.
- **SwitchBot** (https://github.com/OpenWonderLabs/SwitchBotAPI): token + secret.

Cada proveedor implementa el adapter:

```ts
interface SensorProvider {
  fetchReadings(creds: { apiKey: string; ... },
                deviceFilter: { … }): Promise<RawReading[]>
}
```

### 6.2 Flujo de polling

- Cron interno (node-cron o `setInterval` con jitter) cada 5 min.
- Por cada `sensor_devices` activo: descifra apiKey, llama provider,
  inserta en `sensor_readings`. Backoff exponencial en error (1m → 5m →
  15m → 60m); marca `lastError` si 4 fallos consecutivos.
- Política de retención: 90 días de readings (cron de cleanup nightly).

### 6.3 API key encryption

- Algoritmo: AES-256-GCM con KEK desde `SENSOR_KEK` (env, 32 bytes hex).
- Implementación: `node:crypto`. Storage: `apiKeyEncrypted` = `iv:ciphertext:authTag` base64.

### 6.4 Modo manual (issue 002 N6)

- Usuario puede no configurar credenciales cloud y registrar humidity/temp
  manualmente desde Plant Detail (formulario). Para mantener el FK estricto
  en `sensor_readings.sensorDeviceId`, se crea un `sensor_devices` virtual
  con `provider = 'manual'` y `apiKeyEncrypted = NULL` por usuario,
  on-demand al primer registro manual (ver §4.1).

### 6.5 Web BLE (roadmap)

Fuera de alcance de este Master Plan (issue 006). Notas para futura
iteración: Chrome-only, requiere HTTPS + permisos de usuario, frágil para
producción multi-dispositivo.

---

## 7. Estrategia de tests visuales

**Decisión: Playwright + screenshot regression on key screens.**

### 7.1 Razonamiento

Opciones consideradas:

| Opción | Pro | Contra |
|---|---|---|
| Skip / review manual | Cero infra | Regresiones invisibles; con 9 pantallas + 2 modos = 18 estados, manual no escala |
| Chromatic + Storybook | UI catalog + reviewer UX | Coste mensual + curva de mantener stories |
| **Playwright visual regression** | Ya es la opción menos costosa: Playwright runner local + screenshot diff via `toHaveScreenshot()`; sin SaaS | Requiere golden images en repo; browser binaries pesados en CI |
| jest-image-snapshot | Plugin maduro pero solo a nivel componente | No prueba layout completo |

Se elige **Playwright** porque:

- `npm run test:run` ya es Vitest (unit). Playwright se añade como segundo
  runner (`npm run test:e2e`) sin colisión.
- Stack ya tiene Vite dev server → Playwright lo arranca trivialmente.
- Sin SaaS → cero coste fijo. Golden images viven en repo (~200 KB cada
  una, manageable).
- La regla de Sonner + dark theme + neón hace que el riesgo de regresión
  visual sea **alto** (un cambio menor de tokens puede romper contraste);
  justifica el esfuerzo.

### 7.2 Alcance mínimo

Una toma por pantalla en estado canónico (Garden con 4 plantas seed,
Dashboard con tareas pendientes, Plant Detail Expert, Plant Detail Basic,
Add Plant pasos 1/2/3, Schedule día con tareas, Profile expandido, Login).
~10 golden images.

### 7.3 Política de actualización

- `playwright test --update-snapshots` solo via CI con label `visual-update`
  o local con commit explícito `chore(visual): update goldens`.
- PRs que cambien tokens del tema **deben** actualizar goldens en el mismo
  commit.

### 7.4 Cuándo se introduce

Fase **F0** introduce el harness mínimo (1 golden de Garden); cada fase
agrega goldens de las pantallas que toca. Esto evita un "big bang" visual al
final.

---

## 8. Riesgos residuales y mitigaciones

| # | Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|---|
| RR1 | **APIs de sensores cloud frágiles** (rate limits, downtime, breaking changes) | Alta | Medio | Adapter pattern + backoff + `lastError` visible al usuario; modo manual como fallback |
| RR2 | **Coste IA** descontrolado | Media | Alto | Cuotas hard por planta y modo (§5.4); telemetría de uso por usuario en `plant_photos.aiProvider` |
| RR3 | **Drift visual prototype ↔ Tailwind** | Alta | Bajo | Visual regression tests (§7); goldens en repo; design tokens como single source en [`tailwind.config.ts`](../../tailwind.config.ts) |
| RR4 | **Migración care-logs corrupta para usuarios con datos** | Baja | Alto | Backfill `completedAt = loggedAt` documentado y testeado en migración; `loggedAt` se preserva |
| RR5 | **Service Worker / push web cross-browser** | Media | Bajo | Feature-detect; iOS/Safari como nice-to-have, no bloqueante |
| RR6 | **Encriptación API keys sensores** mal implementada | Baja | Crítico (leak de creds usuario) | KEK rotation plan documentado fuera de alcance pero advertido; `node:crypto` AES-GCM bien probado; review de seguridad obligatoria pre-merge F5 |
| RR7 | **Google Fonts privacidad** (DP1) | Baja | Bajo | Considerar self-host si emerge regulación; documentado pero no implementado en alcance |
| RR8 | **Quota fotos confunde al usuario** | Media | Medio | UI muestra "X/N usados" antes de pulsar; mensaje de error tipado |
| RR9 | **WCAG AA no cumplido** en algunos pares neón/fondo (N28) | Media | Medio | Audit informal por pantalla en F6; fallback `text-fg/2` cuando contraste bajo |
| RR10 | **Onboarding stageMode** no implementado a tiempo → usuarios nuevos quedan en Expert por default | Baja | Bajo | F2 incluye paso de onboarding mínimo; default `expert` preserva semántica actual |
| RR11 | **Tweaks Panel filtra a producción** (?9 / R7) | Baja | Bajo | Build flag (`VITE_ENABLE_TWEAKS=false` en prod); test e2e que verifica ausencia |

Riesgos del análisis ya cerrados por decisiones: R-1 (Logout en Profile),
R-2 (single source Tailwind config), R-7 (sensores reales mitigan
"falsa promesa"), R-6 (URL libre eliminada — N17).

---

## 9. Métricas de éxito

- **Visual:** las 9 pantallas del prototipo reproducidas a paridad
  pixel-perfect en Android 412×892 (dentro de tolerancia Playwright 0.1%
  por pantalla).
- **Funcional:** las 6 funcionalidades nuevas (toggle, schedule, photo
  pipeline, sensores, notifications, export) completas y con tests.
- **Performance:** Lighthouse mobile ≥ 85 en Performance y ≥ 90 en
  Accessibility tras F6.
- **Regresión cero:** `npm run test:run` (Vitest) sigue verde en cada fase.
- **Migración limpia:** cada migration es aplicable forward + reversible
  back en local; cero filas perdidas en backfill care-logs.
- **Coste IA:** ≤ 1 USD/usuario activo/mes asumiendo provider moderado
  (proxy: cuotas configuradas garantizan techo).
- **Adopción Stage Mode Basic:** medible (no objetivo) — telemetría
  posterior.

---

## 10. Referencias

- **Análisis pre-Master Plan**:
  [`docs/design/analysis-pre-master-plan-redesign.md`](./analysis-pre-master-plan-redesign.md) (PR #2)
- **Issues bloqueantes (cerrados — viven en la bóveda Obsidian externa)**:
  - `<vault>/01_PROJECTS/growlab/issues/growlab-issue-001-scope-schedule-profile.md` — alcance
  - `<vault>/01_PROJECTS/growlab/issues/growlab-issue-002-schema-extensions-environmentals.md` — ambientales
  - `<vault>/01_PROJECTS/growlab/issues/growlab-issue-003-stage-toggle-basic-expert.md` — toggle
  - `<vault>/01_PROJECTS/growlab/issues/growlab-issue-004-image-pipeline.md` — imágenes
  - `<vault>/01_PROJECTS/growlab/issues/growlab-issue-005-care-logs-as-schedule.md` — schedule
  - `<vault>/01_PROJECTS/growlab/issues/growlab-issue-006-profile-features.md` — profile
- **Prototipo Claude Design** (vive en bóveda externa, no navegable desde GitHub):
  - `<vault>/01_PROJECTS/growlab/design/prototype/index.html` — entry
  - `<vault>/01_PROJECTS/growlab/design/prototype/styles.css` — tokens canónicos
  - `<vault>/01_PROJECTS/growlab/design/prototype/screens/` — 5 pantallas
  - `<vault>/01_PROJECTS/growlab/design/prototype/uploads/` — 9 screenshots
- **Code-repo (estado actual — este repo)**:
  - [`src/server/db/schema/`](../../src/server/db/schema/) — schema Drizzle
  - [`src/types/`](../../src/types/) — types frontend
  - [`tailwind.config.ts`](../../tailwind.config.ts) — config a reescribir
  - [`src/styles/globals.css`](../../src/styles/globals.css)
  - [`package.json`](../../package.json) — Tailwind 3.4, Drizzle 0.36, recharts, lucide-react, sonner
  - [`CLAUDE.md`](../../CLAUDE.md) — reglas de repo (Sonner, no commits a main, no .env)
- **ADRs relacionadas** (viven en la bóveda externa):
  - `<vault>/01_PROJECTS/growlab/architecture/ADR-0002-use-short-lived-access-jwt-plus-refresh-cookie.md` (auth, no afectada por este plan)

---

## Change Log

| Fecha | Cambio |
|-------|--------|
| `2026-05-08` | Draft inicial — consolida issues 001–006 + análisis pre-MP |
| `2026-05-09` | Copilot review fixes: sensor_readings.unit alineado con métricas (`%/C/F/lux`); `'manual'` añadido a sensor_devices.provider con `apiKeyEncrypted` nullable; nanoid() $defaultFn explícito en todas las tablas; npm en lugar de pnpm (matches actual repo); F0 incluye Playwright como entregable explícito |
