# Architecture Collaborateam

## Vue d'Ensemble

Collaborateam suit une **architecture hexagonale** (ports & adapters) avec une organisation **monorepo** claire et une séparation stricte des responsabilités.

## Principes Fondamentaux

### 1. Architecture Hexagonale

```
┌─────────────────────────────────────────────────────────┐
│                     DOMAIN (Core)                        │
│  - Entities (User, Project, Task)                       │
│  - Value Objects (Email, TaskStatus)                    │
│  - Domain Services                                       │
│  - Aucune dépendance externe                            │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ depends on
                          │
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION (Use Cases)                │
│  - Use Cases (LoginUseCase, CreateProjectUseCase)       │
│  - Ports (IUserRepository, ITokenService)               │
│  - DTOs (AuthDTO, ProjectDTO)                           │
│  - Orchestration de la logique métier                   │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ implements ports
                          │
┌─────────────────────────────────────────────────────────┐
│               INFRASTRUCTURE (Adapters)                  │
│  - Repositories (UserRepository avec PostgreSQL)        │
│  - Services (JwtTokenService, BcryptPasswordHasher)     │
│  - HTTP (ExpressRouter, FetchHttpClient)                │
│  - Browser (BrowserHistoryAdapter, LocalStorage)        │
│  - Messaging (SocketIOWebSocketService)                 │
└─────────────────────────────────────────────────────────┘
                          ▲
                          │ uses
                          │
┌─────────────────────────────────────────────────────────┐
│                    APPS (Entry Points)                   │
│  - API (Express server avec DI)                          │
│  - Web (VanillaJS app avec Vite)                        │
└─────────────────────────────────────────────────────────┘
```

### 2. SOLID Principles

#### Single Responsibility Principle (SRP)

- Chaque classe/module a **une seule raison de changer**
- Exemple : `UserRepository` gère uniquement la persistence des users

#### Open/Closed Principle (OCP)

- Ouvert à l'extension, fermé à la modification
- Exemple : Nouveaux adapters sans modifier les use cases

#### Liskov Substitution Principle (LSP)

- Les implémentations sont interchangeables
- Exemple : `PostgresUserRepository` et `MongoUserRepository` respectent `IUserRepository`

#### Interface Segregation Principle (ISP)

- Interfaces minimales et focalisées
- Exemple : `ITokenService` expose uniquement `generate()` et `verify()`

#### Dependency Inversion Principle (DIP)

- Dépendre d'abstractions, pas de concrétions
- Exemple : Use cases dépendent de `IUserRepository`, pas de `PostgresUserRepository`

### 3. Design Patterns

Nous utilisons des design patterns **uniquement quand ils résolvent un problème réel** :

#### Dependency Injection (DI)

**Problème résolu** : Couplage fort, difficulté de test

```javascript
// ❌ Mauvais : Couplage fort
class LoginUseCase {
  constructor() {
    this.userRepository = new PostgresUserRepository(); // Couplage !
  }
}

// ✅ Bon : Injection de dépendances
class LoginUseCase {
  constructor({ userRepository }) {
    this.userRepository = userRepository; // Abstraction
  }
}
```

#### Repository Pattern

**Problème résolu** : Logique de persistence mélangée avec logique métier

```javascript
// Port (application layer)
export class IUserRepository {
  async findByEmail(email) {
    throw new Error('Not implemented');
  }
}

// Adapter (infrastructure layer)
export class PostgresUserRepository extends IUserRepository {
  async findByEmail(email) {
    // Implémentation PostgreSQL
  }
}
```

#### Factory Pattern

**Problème résolu** : Construction complexe d'objets

```javascript
// Domain layer
export class User {
  static create({ email, name }) {
    // Validation et construction
    return new User(id, Email.create(email), name);
  }
}
```

#### Strategy Pattern

**Problème résolu** : Comportements interchangeables

```javascript
// Différentes stratégies de hashing
class BcryptPasswordHasher extends IPasswordHasher {}
class Argon2PasswordHasher extends IPasswordHasher {}
```

## Structure du Monorepo

```
collaborateam/
├── packages/                    # Couches hexagonales
│   ├── domain/                  # ❶ Cœur métier (entities, value objects)
│   ├── application/             # ❷ Use cases et ports
│   └── infrastructure/          # ❸ Adapters (DB, HTTP, Browser)
│
├── apps/                        # Points d'entrée
│   ├── api/                     # Backend Express
│   └── web/                     # Frontend VanillaJS
│
└── tooling/                     # Configuration partagée
    ├── vitest-config/           # Config Vitest
    └── prettier/                # Config Prettier
```

### Flux de Dépendances

```
apps/api ──────┐
               ├──> infrastructure ──> application ──> domain
apps/web ──────┘
```

**Règle d'or** : Les dépendances vont **toujours vers l'intérieur** (vers le domain)

## Exemples Concrets

### Exemple 1 : Login Flow

```javascript
// 1. Domain (entities/User.js)
export class User {
  constructor(id, email, passwordHash, name) {
    this.id = id;
    this.email = email;
    this.passwordHash = passwordHash;
    this.name = name;
  }

  static create({ email, password, name }) {
    // Validation métier
    return new User(
      generateId(),
      Email.create(email),
      null, // Hash sera fait par infrastructure
      name,
    );
  }
}

// 2. Application (use-cases/auth/LoginUseCase.js)
export class LoginUseCase {
  constructor({ userRepository, passwordHasher, tokenService }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute({ email, password }) {
    // Orchestration
    const user = await this.userRepository.findByEmail(email);
    if (!user) throw new Error('User not found');

    const isValid = await this.passwordHasher.compare(
      password,
      user.passwordHash,
    );
    if (!isValid) throw new Error('Invalid password');

    const token = this.tokenService.generate({ userId: user.id });

    return { token, user };
  }
}

// 3. Infrastructure (repositories/UserRepository.js)
export class PostgresUserRepository extends IUserRepository {
  constructor(database) {
    super();
    this.db = database;
  }

  async findByEmail(email) {
    const row = await this.db.query('SELECT * FROM users WHERE email = $1', [
      email,
    ]);
    return row ? this.toDomain(row) : null;
  }

  toDomain(row) {
    return new User(
      row.id,
      Email.create(row.email),
      row.password_hash,
      row.name,
    );
  }
}

// 4. App (api/src/index.js)
import { LoginUseCase } from '@collaborateam/application/use-cases/auth/login';
import { PostgresUserRepository } from '@collaborateam/infrastructure/repositories/user';
import { BcryptPasswordHasher } from '@collaborateam/infrastructure/auth/bcrypt-password-hasher';
import { JwtTokenService } from '@collaborateam/infrastructure/auth/jwt-token-service';

// Dependency Injection Container
const container = {
  userRepository: new PostgresUserRepository(db),
  passwordHasher: new BcryptPasswordHasher(),
  tokenService: new JwtTokenService(process.env.JWT_SECRET),
};

// Route
app.post('/api/auth/login', async (req, res) => {
  const loginUseCase = new LoginUseCase(container);
  const result = await loginUseCase.execute(req.body);
  res.json(result);
});
```

### Exemple 2 : Router (Frontend)

```javascript
// 1. Application (ports/browser/IHistoryAdapter.js)
export class IHistoryAdapter {
  pushState(state, title, url) {
    throw new Error('Not implemented');
  }
}

// 2. Infrastructure (browser/BrowserHistoryAdapter.js)
export class BrowserHistoryAdapter extends IHistoryAdapter {
  constructor(window) {
    super();
    this.window = window;
  }

  pushState(state, title, url) {
    this.window.history.pushState(state, title, url);
  }
}

// 3. Application (Router.js)
export class Router {
  constructor({ historyAdapter, linkInterceptor, renderer }) {
    this.historyAdapter = historyAdapter; // Port
    this.linkInterceptor = linkInterceptor; // Port
    this.renderer = renderer; // Port
  }

  navigate(path) {
    this.historyAdapter.pushState({}, '', path);
    this.handleRoute(path);
  }
}

// 4. App (web/src/main.js)
import { Router } from '@collaborateam/application/router';
import { BrowserHistoryAdapter } from '@collaborateam/infrastructure/browser/history-adapter';

const router = new Router({
  historyAdapter: new BrowserHistoryAdapter(window),
  linkInterceptor: new DOMLinkInterceptor(document, window),
  renderer: new EventRouteRenderer(window),
});
```

## Tests

### Tests Unitaires (Domain & Application)

```javascript
// Domain - Pas de mocks
describe('User', () => {
  it('should validate email', () => {
    expect(() => User.create({ email: 'invalid' })).toThrow();
  });
});

// Application - Mocks des ports
describe('LoginUseCase', () => {
  it('should return token', async () => {
    const mockRepo = { findByEmail: vi.fn().mockResolvedValue(user) };
    const useCase = new LoginUseCase({ userRepository: mockRepo });
    const result = await useCase.execute({ email, password });
    expect(result.token).toBeDefined();
  });
});
```

### Tests d'Intégration (Infrastructure)

```javascript
// Infrastructure - Vraies dépendances
describe('PostgresUserRepository', () => {
  let db;

  beforeAll(async () => {
    db = await setupTestDatabase();
  });

  it('should save and retrieve user', async () => {
    const repo = new PostgresUserRepository(db);
    await repo.save(user);
    const retrieved = await repo.findByEmail(user.email);
    expect(retrieved.id).toBe(user.id);
  });
});
```

## Règles d'Architecture

### ✅ À FAIRE

1. **Domain** : Logique métier pure, aucune dépendance externe
2. **Application** : Définir des ports (interfaces), pas d'implémentations
3. **Infrastructure** : Implémenter les ports, gérer les détails techniques
4. **Apps** : Composer les dépendances, point d'entrée
5. **Tests** : Unitaires pour domain/application, intégration pour infrastructure

### ❌ À ÉVITER

1. **Pas de logique métier dans infrastructure** - Seulement technique
2. **Pas de dépendances externes dans domain** - Rester pur
3. **Pas d'implémentations concrètes dans application** - Seulement ports
4. **Pas de couplage entre apps** - Indépendants
5. **Pas de barrel files** - Utiliser package.json exports

## Migration

Pour migrer le code existant vers cette architecture :

1. **Identifier les entities** → Déplacer vers `packages/domain/src/entities/`
2. **Identifier les use cases** → Déplacer vers `packages/application/src/use-cases/`
3. **Identifier les adapters** → Déplacer vers `packages/infrastructure/src/`
4. **Créer les ports** → Définir dans `packages/application/src/ports/`
5. **Refactorer les apps** → Utiliser DI dans `apps/api/` et `apps/web/`

## Ressources

- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
