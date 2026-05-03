# Frontend Architecture

Collaborateam's frontend is a modern Single Page Application (SPA) built without heavy frameworks like React or Vue. It demonstrates how to build scalable applications using pure Vanilla JavaScript and a reactive component architecture.

## 🧱 Core Principles

- **Component-Based**: UI is divided into reusable, functional components.
- **Reactive State**: State changes trigger targeted UI re-renders.
- **Hexagonal Ready**: Domain logic is separated from UI components.
- **Service Injection**: Backend interactions are abstracted through an `APIClient`.

## 🏗️ Technical Stack

- **Vite**: Ultra-fast build tool and dev server.
- **Router**: A custom client-side router supporting hash-based navigation and route guards.
- **State Management**: Centralized state management with real-time WebSocket synchronization.
- **CSS Modules**: Scoped styling using standard CSS.

## 📁 Directory Structure

```text
src/
├── components/     # Functional UI components (Stateless where possible)
├── core/           # Core engine: Router, PageLayout, StateManager
├── services/       # APIClient, WebSocketManager
├── pages/          # Top-level page components
└── styles/         # Global styles and design system tokens
```

## 🔄 Data Flow

1.  **User Action**: User interacts with a component (e.g., clicks "Update Task").
2.  **Service Call**: Component calls a Service (e.g., `TaskService.update`).
3.  **API/WS**: Service sends a request to the API and/or a message via WebSocket.
4.  **State Update**: On response/message, the `StateManager` updates the global state.
5.  **Re-render**: Components subscribed to that state slice re-render automatically.

## 📱 Responsive Design

The application uses a mobile-first CSS approach with standard breakpoints:
- **Mobile**: < 600px
- **Tablet**: 600px - 768px
- **Desktop**: > 768px

## ♿ Accessibility

- **Semantic HTML**: Proper use of `<main>`, `<section>`, `<nav>`, etc.
- **ARIA Roles**: Used for dynamic components like modals and alerts.
- **Keyboard Navigation**: Full support for Tab navigation and Escape keys for modals.
