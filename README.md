# Collaborateam

Collaborateam is a real-time project management and collaboration platform built with a modern Vanilla JavaScript stack. It features a robust hexagonal architecture, real-time synchronization via WebSockets, and a comprehensive automated testing suite.

## 🚀 Key Features

- **Real-time Collaboration**: Instant synchronization of tasks and projects across users.
- **Project Management**: CRUD operations for projects and tasks with status tracking.
- **Advanced Filtering**: Filter tasks by status, owner, and search terms.
- **Hexagonal Architecture**: Clean separation of concerns between domain, application, and infrastructure layers.
- **Robust Security**: JWT-based authentication and secure password hashing.
- **Responsive Design**: Optimized for Mobile, Tablet, and Desktop viewports.

## 🏗️ Project Structure (Monorepo)

```text
├── apps/
│   ├── api/            # Node.js/Bun API Server
│   └── web/            # Vanilla JS Frontend (Vite)
├── packages/
│   ├── domain/         # Pure Business Logic (Entities)
│   ├── application/    # Use Cases & Service Interfaces
│   ├── infrastructure/ # DB Adapters, Repository Impls, Auth Providers
│   ├── ui/             # Reusable Vanilla UI Components
│   └── e2e-tests/      # Playwright Integration & E2E Tests
└── scripts/            # Automation and utility scripts
```

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), Vite, CSS Modules.
- **Backend**: Node.js / Bun, WebSocket (ws), JWT.
- **Database**: PostgreSQL with `postgres.js`.
- **Testing**: Vitest (Unit/Integration), Playwright (E2E), Fast-check (Property-based).
- **Tooling**: Turborepo, pnpm, Docker, ESLint, Prettier.

## 🚦 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (>= 24) or [Bun](https://bun.sh/)
- [pnpm](https://pnpm.io/) (>= 10)
- [Docker](https://www.docker.com/) & Docker Compose

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/collaborateam.git
   cd collaborateam
   ```

2. **Install dependencies**:
   ```bash
   pnpm install
   ```

3. **Start infrastructure (PostgreSQL)**:
   ```bash
   pnpm run services:up
   ```

4. **Setup the database**:
   ```bash
   pnpm --filter @workspace/infrastructure run db:setup
   ```

5. **Start development servers**:
   ```bash
   pnpm run dev
   ```

The frontend will be available at [http://localhost:5173](http://localhost:5173) and the API at [http://localhost:3000](http://localhost:3000).

## 🧪 Testing

- **Run all tests**: `pnpm run test`
- **Unit/Integration tests**: `pnpm run test:unit`
- **Integration (API)**: `./scripts/test-integration.sh`
- **E2E tests**: `pnpm run test:e2e`

## 📘 Documentation

More detailed documentation can be found in the `docs/` directory:
- [API Documentation](docs/api.md)
- [Frontend Architecture](docs/frontend.md)
- [Contribution Guide](CONTRIBUTING.md)

## ⚖️ License

MIT
