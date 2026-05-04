# Implementation Plan: Collaborateam

## Overview

Collaborateam is a real-time collaborative task management platform built with a **Hexagonal Architecture**, pure VanillaJS (no frontend frameworks), native CSS, and a Node.js backend.

The monorepo architecture follows a clear structure:

- **packages/domain**: Pure business logic (entities, value objects, domain services)
- **packages/application**: Use cases, ports (interfaces), orchestration
- **packages/infrastructure**: Adapters (concrete implementations)
- **apps/api**: Node.js/Express backend with Dependency Injection
- **apps/web**: VanillaJS/Vite frontend
- **tooling/**: Shared configuration (vitest, prettier)

The implementation follows **SOLID principles** and an incremental approach: hexagonal monorepo setup, domain entities, application use cases & ports, infrastructure adapters, and final integration. Each step builds on the previous one to ensure progressive integration.

## Tasks

- [x] 1. Monorepo setup with hexagonal architecture
  - Create packages/{domain,application,infrastructure} structure
  - Create apps/{api,web} structure
  - Configure pnpm workspaces for all packages
  - Configure exports in package.json (no barrel files)
  - test and commit
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implement Router with hexagonal architecture
  - [x] 2.1 Create Domain Services for the Router
    - Create RouteMatcher in packages/domain/src/services/
    - Implement pathToRegex() for dynamic routes (/projects/:id)
    - Implement extractParamNames() for parameter extraction
    - Create QueryStringParser in packages/domain/src/services/
    - Implement parse() for query string parsing
    - Implement parsePath() for pathname/query separation
    - test and commit
    - _Requirements: 2.8, 2.9, 2.10, 2.11_

  - [x] 2.2 Create Ports (Interfaces) in Application Layer
    - Create IHistoryAdapter in packages/application/src/ports/browser/
    - Define pushState(), back(), forward(), getPathname(), getSearch(), onPopState()
    - Create ILinkInterceptor in packages/application/src/ports/browser/
    - Define intercept(), destroy()
    - Create IRouteRenderer in packages/application/src/ports/browser/
    - Define render(), renderNotFound()
    - test and commit
    - _Requirements: 2.2, 2.3, 2.6, 2.7_

  - [x] 2.3 Create Router in Application Layer
    - Create Router in packages/application/src/router/
    - Inject dependencies via constructor (DI)
    - Implement navigate(), back(), forward()
    - Create RouteRegistry for route management
    - Create GuardExecutor for guard execution
    - Create RouteGuard interface
    - Implement 404 route management
    - test and commit
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7, 2.12, 2.13, 2.14, 2.15_

  - [x] 2.4 Create Adapters in Infrastructure Layer
    - Create BrowserHistoryAdapter in packages/infrastructure/src/browser/
    - Implement IHistoryAdapter with History API
    - Create DOMLinkInterceptor in packages/infrastructure/src/browser/
    - Implement ILinkInterceptor with DOM events
    - Create EventRouteRenderer in packages/infrastructure/src/browser/
    - Implement IRouteRenderer with custom events
    - test and commit
    - _Requirements: 2.6, 2.7_

  - [x] 2.5 Create RouterFactory for Dependency Injection
    - Create RouterFactory in packages/application/src/router/
    - Implement createBrowserRouter() for production
    - Implement createCustomRouter() for tests
    - Configure all adapters and domain services
    - test and commit
    - _Requirements: 2.16_

  - [x]* 2.6 Write property tests for the Router
    - **Property 1: Navigation Updates URL Without Reload**
    - **Property 2: URL Changes Render Correct Component**
    - **Property 3: Dynamic Route Parameters Extraction**
    - **Property 4: Query String Parsing**
    - **Property 5: Route Guards Block Unauthorized Access**
    - **Property 6: Invalid Routes Show 404**
    - test and commit
    - **Validate: Requirements 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15**

  - [x]* 2.7 Write unit tests for the Router
    - Test RouteMatcher (domain) without dependencies
    - Test QueryStringParser (domain) without dependencies
    - Test Router (application) with port mocks
    - Test adapters (infrastructure) with real dependencies
    - test and commit
    - _Requirements: 2.6, 2.7, 2.12, 2.13, 2.16_

- [x] 3. Implement State Manager
  - [x] 3.1 Create StateManager class with immutable state management
    - Implement getState() and setState() with immutability (Object.freeze)
    - Implement subscription system with path-based filtering
    - Implement middleware support (logging, persistence)
    - Ensure notifications within 10ms
    - test and commit
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x]* 3.2 Write property tests for the State Manager
    - **Property 27: State Change Notifies Subscribers**
    - **Property 28: Subscriber Notification Within 10ms**
    - **Property 29: State Updates Are Immutable**
    - **Property 30: Middleware Called on State Changes**
    - test and commit
    - **Validate: Requirements 7.2, 7.3, 7.4, 7.6**

  - [x]* 3.3 Write unit tests for the State Manager
    - Test subscriptions and notifications
    - Test state update immutability
    - Test middleware
    - test and commit
    - _Requirements: 7.2, 7.3, 7.4, 7.6_

- [x] 4. Implement WebSocket Manager
  - [x] 4.1 Create WebSocketManager class with automatic reconnection
    - Implement connect(), disconnect(), send()
    - Implement event system (on/off)
    - Implement reconnection with exponential backoff
    - Implement heartbeat to detect dead connections
    - Implement room-based messaging (project isolation)
    - test and commit
    - _Requirements: 6.1, 6.5_

  - [x]* 4.2 Write property tests for the WebSocket Manager
    - **Property 24: WebSocket Reconnection on Connection Loss**
    - **Property 25: State Synchronization After Reconnection**
    - test and commit
    - **Validate: Requirements 6.5, 6.6**

  - [x]* 4.3 Write unit tests for the WebSocket Manager
    - Test connection establishment
    - Test reconnection after connection loss
    - Test shutdown after max attempts
    - test and commit
    - _Requirements: 6.1, 6.5_

- [x] 5. Checkpoint - Verify core frontend components
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement base Component class
  - [x] 6.1 Create Component class with lifecycle
    - Implement mount(), unmount(), update()
    - Implement render() with lightweight virtual DOM
    - Implement setState() and getState()
    - Implement event system (on/emit)
    - Implement automatic event delegation
    - Implement automatic cleanup (removeEventListener)
    - test and commit
    - _Requirements: 2.3, 5.4_

  - [x]* 6.2 Write unit tests for Component
    - Test lifecycle (mount/unmount)
    - Test props updates
    - Test event system
    - test and commit
    - _Requirements: 2.3_

- [x] 7. Implement Parsers (Task and Project)
  - [x] 7.1 Create TaskParser with parse() and serialize()
    - Implement parse(json) to convert JSON to Task
    - Implement serialize(task) to convert Task to JSON
    - Implement validate(task) with validation rules
    - test and commit
    - _Requirements: 5.10, 5.11, 5.12_

  - [x] 7.2 Create ProjectParser with parse() and serialize()
    - Implement parse(json) to convert JSON to Project
    - Implement serialize(project) to convert Project to JSON
    - Implement validate(project) with validation rules
    - test and commit
    - _Requirements: 4.8, 4.9, 4.10_

  - [x]* 7.3 Write property tests for Parsers
    - **Property 16: Project Serialization Round-Trip**
    - **Property 22: Task Serialization Round-Trip**
    - test and commit
    - **Validate: Requirements 4.10, 5.12**

  - [x]* 7.4 Write unit tests for Parsers
    - Test validation for invalid data
    - Test edge cases (optional fields, boundary values)
    - test and commit
    - _Requirements: 4.8, 4.9, 5.10, 5.11_

- [x] 8. Backend Node.js setup
  - [x] 8.1 Configure Express or bun.serve and basic middleware
    - Initialize Express app
    - Configure CORS, body-parser, helmet
    - Configure logging (winston or pino)
    - Configure global error handler
    - Database connection setup (PostgreSQL)
    - Implement database migrations
    - test and commit
    - _Requirements: 11.2, 11.5, 12.1, 12.6_

  - [x]* 8.2 Write unit tests for backend setup
    - Test global error handler
    - Test migrations
    - test and commit
    - _Requirements: 11.2, 11.5_

- [x] 9. Implement Authentication Service
  - [x] 9.1 Create AuthService with register(), login(), verifyToken()
    - Implement register() with bcrypt hashing (cost factor: 12)
    - Implement login() with validation and JWT generation
    - Implement verifyToken() to validate JWTs
    - Implement refreshToken() to renew tokens
    - Configure JWT with expiration (access: 15min, refresh: 7 days)
    - Implement rate limiting on login (5 attempts/15min)
    - test and commit
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_

  - [x]* 9.2 Write property tests for AuthService
    - **Property 7: Valid Credentials Return JWT Token**
    - **Property 8: Invalid Credentials Return Error**
    - **Property 10: Successful Registration Creates User and Returns Token**
    - test and commit
    - **Validate: Requirements 3.2, 3.3, 3.7**

  - [x]* 9.3 Write unit tests for AuthService
    - Test JWT return on valid login
    - Test rejection of invalid credentials within 500ms
    - Test bcrypt password hashing
    - test and commit
    - _Requirements: 3.2, 3.3_

- [x] 10. Implement Project Service
  - [x] 10.1 Create ProjectService with CRUD operations
    - Implement create() to create a project
    - Implement findAll() to list a user's projects
    - Implement findById() to retrieve a project
    - Implement update() to modify a project (< 200ms)
    - Implement delete() with task cascade
    - test and commit
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x]* 10.2 Write property tests for ProjectService
    - **Property 12: Project List Matches User's Projects**
    - **Property 13: Project Creation Persists and Returns Data**
    - **Property 14: Project Updates Persist**
    - **Property 15: Project Deletion Cascades to Tasks**
    - test and commit
    - **Validate: Requirements 4.1, 4.3, 4.5, 4.7**

  - [x]* 10.3 Write unit tests for ProjectService
    - Test project creation
    - Test update within 200ms
    - Test deletion with cascade
    - test and commit
    - _Requirements: 4.3, 4.5, 4.7_

- [x] 11. Implement Task Service
  - [x] 11.1 Create TaskService with CRUD operations
    - Implement create() to create a task
    - Implement findByProject() to list a project's tasks
    - Implement update() to modify a task (< 200ms)
    - Implement delete() to delete a task
    - Implement reorder() to reorganize tasks
    - test and commit
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x]* 11.2 Write property tests for TaskService
    - **Property 17: Task List Matches Project's Tasks**
    - **Property 18: Task Creation Persists and Returns Data**
    - **Property 19: Task Updates Persist**
    - **Property 20: Task Deletion Removes from Database**
    - **Property 21: Task Reordering Persists**
    - test and commit
    - **Validate: Requirements 5.1, 5.3, 5.5, 5.7, 5.9**

  - [x]* 11.3 Write unit tests for TaskService
    - Test task creation
    - Test update within 200ms
    - Test deletion
    - Test reordering
    - test and commit
    - _Requirements: 5.3, 5.5, 5.7, 5.9_

- [x] 12. Checkpoint - Verify backend services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implement backend WebSocket Service
  - [x] 13.1 Create WebSocketService with broadcasting
    - Configure Socket.io or ws for WebSocket server
    - Implement broadcastToProject() to send to clients in a project
    - Implement broadcastToUser() to send to a specific user
    - Implement getConnectedUsers() to list connected users
    - Implement room management (join/leave project)
    - Integrate with State Manager for real-time updates
    - test and commit
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 7.7_

  - [x] 13.2 Write property tests for WebSocketService
    - **Property 23: Task Operations Broadcast to Project Clients**
    - **Property 26: Connected Users Display Matches Actual**
    - **Property 31: WebSocket Messages Update State**
    - test and commit
    - **Validate: Requirements 6.2, 6.3, 6.4, 6.7, 7.7**

  - [x] 13.3 Write unit tests for WebSocketService
    - Test broadcast to project clients
    - Test broadcast within 100ms
    - Test room management
    - test and commit
    - _Requirements: 6.2, 6.3, 6.4_

- [x] 14. Implement REST API routes
  - [x] 14.1 Create authentication routes
    - POST /api/auth/register
    - POST /api/auth/login
    - POST /api/auth/logout
    - POST /api/auth/refresh
    - Implement JWT authentication middleware
    - test and commit
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8_

  - [x] 14.2 Create project routes
    - GET /api/projects (project list)
    - POST /api/projects (create project)
    - GET /api/projects/:id (project details)
    - PUT /api/projects/:id (modify project)
    - DELETE /api/projects/:id (delete project)
    - Apply authentication middleware
    - test and commit
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 14.3 Create task routes
    - GET /api/projects/:projectId/tasks (task list)
    - POST /api/projects/:projectId/tasks (create task)
    - PUT /api/tasks/:id (modify task)
    - DELETE /api/tasks/:id (delete task)
    - PUT /api/projects/:projectId/tasks/reorder (reorganize)
    - Apply authentication middleware
    - test and commit
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ]* 14.4 Write API integration tests
    - Test full CRUD flow for projects
    - Test full CRUD flow for tasks
    - Test authentication and permissions
    - test and commit
    - _Requirements: 3.2, 4.3, 4.5, 4.7, 5.3, 5.5, 5.7_

- [x] 15. Implement frontend UI Components
  - [x] 15.1 Create LoginComponent
    - Form with email and password
    - Client-side validation
    - Authentication error handling
    - JWT token storage after login
    - test and commit
    - _Requirements: 3.1, 3.4, 11.4_

  - [x] 15.2 Create RegisterComponent
    - Form with email, password, name
    - Client-side validation (password strength, email format)
    - Registration error handling
    - Redirection after successful registration
    - test and commit
    - _Requirements: 3.6, 3.7, 11.4_

  - [x] 15.3 Create ProjectListComponent
    - Display project list
    - Button to create a new project
    - Navigation to ProjectDetailComponent
    - test and commit
    - _Requirements: 4.1, 4.2_

  - [x] 15.4 Create ProjectFormComponent
    - Form to create/edit a project
    - Fields: name, description
    - Client-side validation
    - Error handling
    - test and commit
    - _Requirements: 4.2, 4.4, 11.4_

  - [x] 15.5 Create TaskListComponent
    - Display a project's task list
    - Drag-and-drop support for reordering
    - Inline task editing
    - Delete buttons
    - test and commit
    - _Requirements: 5.1, 5.4, 5.6, 5.8_

  - [x] 15.6 Create TaskFormComponent
    - Form to create/edit a task
    - Fields: title, description, status, assignee
    - Client-side validation
    - Error handling
    - test and commit
    - _Requirements: 5.2, 5.4, 11.4_

  - [x]* 15.7 Write unit tests for UI Components
    - Test component rendering
    - Test user interactions
    - Test form validation
    - test and commit
    - _Requirements: 3.1, 4.2, 5.2, 11.4_

- [x] 16. Implement task filtering and search
  - [x] 16.1 Create TaskFilterComponent
    - Search input with debouncing
    - Filters by status (todo, in-progress, done)
    - Filters by assignee
    - Support for combined filters
    - Real-time filtering
    - test and commit
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 10.4_

  - [x] 16.2 Write property tests for filtering
    - **Property 32: Search Filters Tasks in Real-Time**
    - **Property 33: Status Filter Shows Matching Tasks**
    - **Property 34: Assignee Filter Shows Matching Tasks**
    - **Property 35: Combined Filters Apply Simultaneously**
    - **Property 37: Search Input Is Debounced**
    - test and commit
    - **Validate: Requirements 8.2, 8.4, 8.6, 8.7, 10.4**

  - [x] 16.3 Write unit tests for filtering
    - Test filtering by search
    - Test filtering by status
    - Test filtering by assignee
    - Test combined filters
    - test and commit
    - _Requirements: 8.2, 8.4, 8.6, 8.7_

- [ ] 17. Implement responsive design with native CSS
  - [x] 17.1 Create base styles and responsive layout
    - Create CSS variables (colors, spacing, typography)
    - Implement main layout with flexbox/grid
    - Create media queries for desktop (1920x1080+)
    - Create media queries for tablet (768x1024)
    - Create media queries for mobile (375x667)
    - Implement mobile menu for viewport < 768px
    - Use relative units (rem, em, %)
    - test and commit
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 17.2 Create component styles
    - Styles for LoginComponent and RegisterComponent
    - Styles for ProjectListComponent and ProjectFormComponent
    - Styles for TaskListComponent and TaskFormComponent
    - Styles for TaskFilterComponent
    - Styles for error messages and toasts
    - ARIA support and keyboard navigation
    - test and commit
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 17.3 Test responsive design
    - Test display on different screen sizes
    - Test mobile menu
    - Test accessibility (ARIA, keyboard navigation)
    - test and commit
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 18. Checkpoint - Verify frontend-backend integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Implement performance optimizations
  - [x] 19.1 Optimize frontend
    - Implement lazy loading for route components
    - Implement event delegation for list items
    - Implement debouncing for search
    - Optimize bundle size (code splitting)
    - Implement client-side caching
    - test and commit
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

  - [x] 19.2 Optimize backend
    - Implement response caching for frequent data
    - Implement database connection pooling
    - Optimize database queries (indexes)
    - Implement compression (gzip)
    - test and commit
    - _Requirements: 10.6, 10.7, 12.4_

  - [x] 19.3 Write property tests for performance
    - **Property 36: Route Navigation Completes Within 300ms**
    - **Property 38: Cached Data Responds Within 50ms**
    - test and commit
    - **Validate: Requirements 10.3, 10.6, 10.7**

  - [x] 19.4 Test performance
    - Test initial load (< 2s on 3G)
    - Test route navigation (< 300ms)
    - Test cached responses (< 50ms)
    - test and commit
    - _Requirements: 10.1, 10.3, 10.7_

- [x] 20. Implement full error management
  - [x] 20.1 Improve frontend error management
    - Implement APIClient with retry and exponential backoff
    - Implement toast notifications for temporary errors
    - Implement modals for critical errors (Double Confirmation)
    - Implement inline errors for validation
    - Implement status indicator for WebSocket
    - test and commit
    - _Requirements: 11.1, 11.3, 11.4_

  - [x] 20.2 Improve backend error management
    - Improve global error handler with structured logging
    - Implement standardized error codes
    - Implement transaction rollback on errors
    - Implement health checks for database
    - test and commit
    - _Requirements: 11.2, 11.5, 11.6, 12.3_

  - [x] 20.3 Write property tests for error management
    - **Property 39: Network Failures Display Error Messages**
    - **Property 40: Server Errors Return Structured Response**
    - **Property 41: Invalid Form Data Shows Field-Specific Errors**
    - **Property 42: Server Logs All Errors**
    - **Property 43: Unhandled Exceptions Return 500**
    - test and commit
    - **Validate: Requirements 11.1, 11.2, 11.4, 11.5, 11.6**

  - [x] 20.4 Write unit tests for error management
    - Test retry with exponential backoff
    - Test user-friendly error messages
    - Test error logging
    - test and commit
    - _Requirements: 11.1, 11.2, 11.5_

- [x] 21. Implement persistence and transactions
  - [x] 21.1 Improve transaction management
    - Implement transactions for multi-table operations
    - Implement commit before response
    - Implement rollback on errors
    - Implement validation before persistence
    - test and commit
    - _Requirements: 12.2, 12.3, 12.5_

  - [x] 21.2 Write property tests for persistence
    - **Property 44: Transactions Commit Before Response**
    - **Property 45: Failed Operations Rollback Transactions**
    - **Property 46: Invalid Data Rejected Before Persistence**
    - test and commit
    - **Validate: Requirements 12.2, 12.3, 12.5**

  - [x] 21.3 Write unit tests for transactions
    - Test commit before response
    - Test rollback on errors
    - Test validation before persistence
    - test and commit
    - _Requirements: 12.2, 12.3, 12.5_

- [x] 22. Final integration and wiring
  - [x] 22.1 Connect all components
    - Integrate Router with all components
    - Integrate State Manager with WebSocket Manager
    - Integrate WebSocket Manager with backend WebSocket Service
    - Integrate all UI components with State Manager
    - Configure routes with route guards
    - Test full end-to-end flow
    - test and commit
    - _Requirements: 2.2, 2.3, 2.8, 6.1, 6.2, 6.3, 6.4, 7.7_

  - [x] 22.2 Write end-to-end integration tests
    - Test full flow: login → create project → create task → real-time collaboration
    - Test WebSocket reconnection and synchronization
    - Test route guards and redirections
    - test and commit
    - _Requirements: 2.8, 3.2, 4.3, 5.3, 6.2, 6.5, 6.6_

- [ ] 23. Final checkpoint - Verify all tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Documentation and deployment
  - [x] 24.1 Create documentation
    - README.md with setup instructions
    - API documentation (endpoints, formats)
    - Frontend component documentation
    - Contribution guide
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 24.2 Prepare deployment
    - Configure environment variables
    - Create Dockerfiles for frontend and backend
    - Create docker-compose.yml for local dev
    - Configure production build scripts
    - _Requirements: 1.5, 12.1_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific cases and edge cases
- Implementation follows a bottom-up approach: core components → services → UI → integration
