# 🌱 GrowLab

**Cannabis Growing App** — Full-stack TypeScript application for managing cannabis cultivation from seed to harvest.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![TanStack Start](https://img.shields.io/badge/TanStack_Start-React-ff4154?logo=react)](https://tanstack.com/start)
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
| **Framework** | TanStack Start (React-based full-stack) |
| **Language** | TypeScript 5.3+ |
| **Database** | PostgreSQL 15+ with Drizzle ORM |
| **Styling** | Tailwind CSS |
| **State** | TanStack Query + React Context |
| **Validation** | Zod |
| **Testing** | Vitest + Playwright |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ LTS
- pnpm 8+
- PostgreSQL 15+

### Installation

```bash
# Clone the repository
git clone https://github.com/modernclixlearning/GrowLab.git
cd GrowLab

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Run database migrations
pnpm db:migrate

# Start development server
pnpm dev
```

---

## 📁 Project Structure

```
GrowLab/
├── app/                    # TanStack Start app
│   ├── routes/             # Pages and routes
│   ├── components/         # React components
│   └── lib/                # Shared utilities
├── server/                 # Server logic
│   ├── api/                # API routes
│   ├── db/                 # Drizzle schemas & migrations
│   └── services/           # Business logic
├── shared/                 # Shared types & schemas
├── tests/                  # Test suites
├── docs/                   # Documentation
└── public/                 # Static assets
```

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
