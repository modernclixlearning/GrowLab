# 🌱 GrowLab

**Cannabis Growing App** — Full-stack TypeScript application for managing cannabis cultivation from seed to harvest.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-React-646CFF?logo=vite)](https://vitejs.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📋 Overview

GrowLab helps growers manage their cannabis cultivation with:

- 🌿 **Multi-plant garden management** with visual progress tracking
- ⏰ **Automated care schedules** with smart reminders
- 📊 **Growth stage tracking** (Seedling → Vegetative → Flowering)
- 🧬 **Strain-specific care profiles** and recommendations
- 📸 **Photo documentation** with timeline visualization
- 🌡️ **Environmental monitoring** (light, humidity, temperature)
- 🧪 **Nutrient scheduling** and feeding line management

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vite + React 18 + React Router v6 |
| **Backend** | Hono + @hono/node-server |
| **Language** | TypeScript 5.3+ |
| **Database** | PostgreSQL 16+ with Drizzle ORM |
| **Styling** | Tailwind CSS |
| **State** | TanStack Query + React Context |
| **Validation** | Zod |
| **Feedback** | Sonner toast notifications |
| **Testing** | Vitest + TypeScript typecheck |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ LTS
- npm 10+
- Docker Desktop (recommended for local Postgres + app container)

### Installation

```bash
# Clone the repository
git clone https://github.com/modernclixlearning/GrowLab.git
cd GrowLab

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run database migrations or push local schema
npm run db:push

# Start development server
npm run dev
```

---

## 📁 Project Structure

```
GrowLab/
├── src/
│   ├── components/         # React components
│   ├── lib/                # API clients, hooks, stores, error mapping
│   ├── routes/             # React Router pages
│   ├── server/             # Hono API, services, Drizzle schema
│   ├── styles/             # Tailwind globals
│   └── types/              # Shared frontend types
├── tests/                  # Test suites
├── docs/                   # Documentation
└── docker-compose.yml      # Local app + PostgreSQL
```

---

## UI Feedback Standard

All UI-triggered CRUD operations should surface API responses through Sonner toasts:

- Success responses use `toast.success(...)` with an action-specific message.
- Error responses preserve `{ code, message, fields? }` through `ApiResponseError`.
- UI components map errors with `getApiErrorToastMessage(...)` before showing `toast.error(...)`.
- Inline form errors can remain for local context, but they do not replace global operation feedback.

Current implementation: `AddPlantModal` shows success and error toasts for plant creation.

---

## 📖 Documentation

See [docs/Cannabis-Growing-App-Technical-Documentation.md](docs/Cannabis-Growing-App-Technical-Documentation.md) for complete technical specifications.

---

## 🗓️ Development Phases

| Phase | Duration | Focus |
|-------|----------|-------|
| **1. Foundation** | Weeks 1-3 | Auth, DB schema, component library |
| **2. Core Features** | Weeks 4-7 | Plant CRUD, garden list, care logging |
| **3. Advanced** | Weeks 8-11 | Dashboard, schedules, charts |
| **4. Polish** | Weeks 12-14 | Testing, optimization, deployment |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with 💚 for the cannabis growing community**
