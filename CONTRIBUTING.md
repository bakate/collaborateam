# Contributing to Collaborateam

First off, welcome! If you're reading this, you probably want to make Collaborateam even better. To maintain high standards, please follow these guidelines.

## 🧠 Philosophy

- **KISS**: Keep It Simple, Stupid.
- **DRY**: Don't Repeat Yourself.
- **SOLID**: Follow these principles religiously.
- **Fail Fast**: Handle errors early and return (Effect/Either pattern preferred).

## 💻 Coding Standards

### Naming
- **Classes**: `PascalCase`
- **Variables/Functions**: `camelCase`
- **Files**: `kebab-case`
- **No single-letter names**: Be descriptive (`userIndex` over `i`).

### Functions
- **Short**: Aim for < 20 lines.
- **Single Purpose**: One function = One thing.
- **RO-RO Pattern**: Receive Object, Return Object.
- **No Flag Variables**: Don't use booleans to change logic inside a function.
- **Early Returns**: Preferred over `else` blocks.

### JavaScript
- Use ES6+ features (Destructuring, Arrow functions, Template literals).
- Avoid `var`, use `const` by default and `let` only when necessary.
- No `throw`: Use return values or specialized error handlers.

## 🧪 Testing Requirements

No code enters the codebase without tests.
- **Unit Tests**: For logic and edge cases.
- **Integration Tests**: For service interactions.
- **E2E Tests**: For critical user flows.

Run tests before submitting:
```bash
pnpm run test
```

## 🛠️ Pull Request Process

1.  **Create a branch**: `feat/your-feature` or `fix/your-fix`.
2.  **Lint & Format**: Ensure your code is clean (`pnpm run lint`).
3.  **Write Tests**: Cover your changes.
4.  **Describe your PR**: Explain the *why* and the *how*.

---

*"Code is like humor. When you have to explain it, it’s bad."* — Bakate
