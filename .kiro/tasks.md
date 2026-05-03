# Plan d'Implémentation: Collaborateam

## Vue d'Ensemble

Collaborateam est une plateforme de gestion de tâches collaborative en temps réel construite avec une **architecture hexagonale**, VanillaJS pur (pas de frameworks frontend), CSS natif, et un backend Node.js.

L'architecture monorepo suit une structure claire :

- **packages/domain** : Logique métier pure (entities, value objects, domain services)
- **packages/application** : Use cases, ports (interfaces), orchestration
- **packages/infrastructure** : Adapters (implémentations concrètes)
- **apps/api** : Backend Node.js/Express avec Dependency Injection
- **apps/web** : Frontend VanillaJS/Vite
- **tooling/** : Configuration partagée (vitest, prettier)

L'implémentation suit les **principes SOLID** et une approche incrémentale : setup du monorepo hexagonal, domain entities, application use cases & ports, infrastructure adapters, et intégration finale. Chaque étape construit sur la précédente pour assurer une intégration progressive.

## Tâches

- [x] 1. Setup du monorepo avec architecture hexagonale
  - Créer la structure packages/{domain,application,infrastructure}
  - Créer la structure apps/{api,web}
  - Configurer pnpm workspaces pour tous les packages
  - Configurer les exports dans package.json (pas de barrel files)
  - tester et faire un commit
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 2. Implémenter le Router avec architecture hexagonale
  - [x] 2.1 Créer les Domain Services pour le Router
    - Créer RouteMatcher dans packages/domain/src/services/
    - Implémenter pathToRegex() pour routes dynamiques (/projects/:id)
    - Implémenter extractParamNames() pour extraction des paramètres
    - Créer QueryStringParser dans packages/domain/src/services/
    - Implémenter parse() pour parsing des query strings
    - Implémenter parsePath() pour séparation pathname/query
    - tester et faire un commit
    - _Requirements: 2.8, 2.9, 2.10, 2.11_

  - [x] 2.2 Créer les Ports (Interfaces) dans Application Layer
    - Créer IHistoryAdapter dans packages/application/src/ports/browser/
    - Définir pushState(), back(), forward(), getPathname(), getSearch(), onPopState()
    - Créer ILinkInterceptor dans packages/application/src/ports/browser/
    - Définir intercept(), destroy()
    - Créer IRouteRenderer dans packages/application/src/ports/browser/
    - Définir render(), renderNotFound()
    - tester et faire un commit
    - _Requirements: 2.2, 2.3, 2.6, 2.7_

  - [x] 2.3 Créer le Router dans Application Layer
    - Créer Router dans packages/application/src/router/
    - Injecter les dépendances via constructeur (DI)
    - Implémenter navigate(), back(), forward()
    - Créer RouteRegistry pour gestion des routes
    - Créer GuardExecutor pour exécution des guards
    - Créer RouteGuard interface
    - Implémenter la gestion des routes 404
    - tester et faire un commit
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7, 2.12, 2.13, 2.14, 2.15_

  - [x] 2.4 Créer les Adapters dans Infrastructure Layer
    - Créer BrowserHistoryAdapter dans packages/infrastructure/src/browser/
    - Implémenter IHistoryAdapter avec History API
    - Créer DOMLinkInterceptor dans packages/infrastructure/src/browser/
    - Implémenter ILinkInterceptor avec DOM events
    - Créer EventRouteRenderer dans packages/infrastructure/src/browser/
    - Implémenter IRouteRenderer avec custom events
    - tester et faire un commit
    - _Requirements: 2.6, 2.7_

  - [x] 2.5 Créer RouterFactory pour Dependency Injection
    - Créer RouterFactory dans packages/application/src/router/
    - Implémenter createBrowserRouter() pour production
    - Implémenter createCustomRouter() pour tests
    - Configurer tous les adapters et domain services
    - tester et faire un commit
    - _Requirements: 2.16_

  - [x]\* 2.6 Écrire les property tests pour le Router
    - **Property 1: Navigation Updates URL Without Reload**
    - **Property 2: URL Changes Render Correct Component**
    - **Property 3: Dynamic Route Parameters Extraction**
    - **Property 4: Query String Parsing**
    - **Property 5: Route Guards Block Unauthorized Access**
    - **Property 6: Invalid Routes Show 404**
    - tester et faire un commit
    - **Valide: Requirements 2.6, 2.7, 2.8, 2.9, 2.10, 2.11, 2.12, 2.13, 2.14, 2.15**

  - [x]\* 2.7 Écrire les unit tests pour le Router
    - Tester RouteMatcher (domain) sans dépendances
    - Tester QueryStringParser (domain) sans dépendances
    - Tester Router (application) avec mocks des ports
    - Tester les adapters (infrastructure) avec vraies dépendances
    - tester et faire un commit
    - _Requirements: 2.6, 2.7, 2.12, 2.13, 2.16_

- [x] 3. Implémenter le State Manager
  - [x] 3.1 Créer la classe StateManager avec gestion d'état immutable
    - Implémenter getState() et setState() avec immutabilité (Object.freeze)
    - Implémenter le système de subscriptions avec path-based filtering
    - Implémenter le support middleware (logging, persistence)
    - Assurer les notifications dans les 10ms
    - tester et faire un commit
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [x]\* 3.2 Écrire les property tests pour le State Manager
    - **Property 27: State Change Notifies Subscribers**
    - **Property 28: Subscriber Notification Within 10ms**
    - **Property 29: State Updates Are Immutable**
    - **Property 30: Middleware Called on State Changes**
    - tester et faire un commit
    - **Valide: Requirements 7.2, 7.3, 7.4, 7.6**

  - [x]\* 3.3 Écrire les unit tests pour le State Manager
    - Tester les subscriptions et notifications
    - Tester l'immutabilité des updates
    - Tester le middleware
    - tester et faire un commit
    - _Requirements: 7.2, 7.3, 7.4, 7.6_

- [x] 4. Implémenter le WebSocket Manager
  - [x] 4.1 Créer la classe WebSocketManager avec reconnexion automatique
    - Implémenter connect(), disconnect(), send()
    - Implémenter le système d'événements (on/off)
    - Implémenter la reconnexion avec exponential backoff
    - Implémenter le heartbeat pour détecter les connexions mortes
    - Implémenter le room-based messaging (isolation par projet)
    - tester et faire un commit
    - _Requirements: 6.1, 6.5_

  - [x]\* 4.2 Écrire les property tests pour le WebSocket Manager
    - **Property 24: WebSocket Reconnection on Connection Loss**
    - **Property 25: State Synchronization After Reconnection**
    - tester et faire un commit
    - **Valide: Requirements 6.5, 6.6**

  - [x]\* 4.3 Écrire les unit tests pour le WebSocket Manager
    - Tester l'établissement de connexion
    - Tester la reconnexion après perte de connexion
    - Tester l'arrêt après max tentatives
    - tester et faire un commit
    - _Requirements: 6.1, 6.5_

- [x] 5. Checkpoint - Vérifier les composants core frontend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implémenter la classe Component de base
  - [x] 6.1 Créer la classe Component avec lifecycle
    - Implémenter mount(), unmount(), update()
    - Implémenter render() avec virtual DOM léger
    - Implémenter setState() et getState()
    - Implémenter le système d'événements (on/emit)
    - Implémenter event delegation automatique
    - Implémenter cleanup automatique (removeEventListener)
    - tester et faire un commit
    - _Requirements: 2.3, 5.4_

  - [x]\* 6.2 Écrire les unit tests pour Component
    - Tester le lifecycle (mount/unmount)
    - Tester les updates de props
    - Tester le système d'événements
    - tester et faire un commit
    - _Requirements: 2.3_

- [x] 7. Implémenter les Parsers (Task et Project)
  - [x] 7.1 Créer TaskParser avec parse() et serialize()
    - Implémenter parse(json) pour convertir JSON vers Task
    - Implémenter serialize(task) pour convertir Task vers JSON
    - Implémenter validate(task) avec règles de validation
    - tester et faire un commit
    - _Requirements: 5.10, 5.11, 5.12_

  - [x] 7.2 Créer ProjectParser avec parse() et serialize()
    - Implémenter parse(json) pour convertir JSON vers Project
    - Implémenter serialize(project) pour convertir Project vers JSON
    - Implémenter validate(project) avec règles de validation
    - tester et faire un commit
    - _Requirements: 4.8, 4.9, 4.10_

  - [x]\* 7.3 Écrire les property tests pour les Parsers
    - **Property 16: Project Serialization Round-Trip**
    - **Property 22: Task Serialization Round-Trip**
    - tester et faire un commit
    - **Valide: Requirements 4.10, 5.12**

  - [x]\* 7.4 Écrire les unit tests pour les Parsers
    - Tester la validation des données invalides
    - Tester les edge cases (champs optionnels, valeurs limites)
    - tester et faire un commit
    - _Requirements: 4.8, 4.9, 5.10, 5.11_

- [x] 8. Setup du backend Node.js
  - [x] 8.1 Configurer Express ou bun.serve et middleware de base
    - Initialiser Express app
    - Configurer CORS, body-parser, helmet
    - Configurer le logging (winston ou pino)
    - Configurer le global error handler
    - Setup de la connexion database (PostgreSQL)
    - Implémenter les migrations de base de données
    - tester et faire un commit
    - _Requirements: 11.2, 11.5, 12.1, 12.6_

  - [x]\* 8.2 Écrire les unit tests pour le setup backend
    - Tester le global error handler
    - Tester les migrations
    - tester et faire un commit
    - _Requirements: 11.2, 11.5_

- [x] 9. Implémenter l'Authentication Service
  - [x] 9.1 Créer AuthService avec register(), login(), verifyToken()
    - Implémenter register() avec bcrypt hashing (cost factor: 12)
    - Implémenter login() avec validation et JWT generation
    - Implémenter verifyToken() pour valider les JWT
    - Implémenter refreshToken() pour renouveler les tokens
    - Configurer JWT avec expiration (access: 15min, refresh: 7 jours)
    - Implémenter rate limiting sur login (5 tentatives/15min)
    - tester et faire un commit
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7_

  - [x]\* 9.2 Écrire les property tests pour AuthService
    - **Property 7: Valid Credentials Return JWT Token**
    - **Property 8: Invalid Credentials Return Error**
    - **Property 10: Successful Registration Creates User and Returns Token**
    - tester et faire un commit
    - **Valide: Requirements 3.2, 3.3, 3.7**

  - [x]\* 9.3 Écrire les unit tests pour AuthService
    - Tester le retour de JWT sur login valide
    - Tester le rejet des credentials invalides dans les 500ms
    - Tester le hashing bcrypt des mots de passe
    - tester et faire un commit
    - _Requirements: 3.2, 3.3_

- [x] 10. Implémenter le Project Service
  - [x] 10.1 Créer ProjectService avec CRUD operations
    - Implémenter create() pour créer un projet
    - Implémenter findAll() pour lister les projets d'un user
    - Implémenter findById() pour récupérer un projet
    - Implémenter update() pour modifier un projet (< 200ms)
    - Implémenter delete() avec cascade des tasks
    - tester et faire un commit
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x]\* 10.2 Écrire les property tests pour ProjectService
    - **Property 12: Project List Matches User's Projects**
    - **Property 13: Project Creation Persists and Returns Data**
    - **Property 14: Project Updates Persist**
    - **Property 15: Project Deletion Cascades to Tasks**
    - tester et faire un commit
    - **Valide: Requirements 4.1, 4.3, 4.5, 4.7**

  - [x]\* 10.3 Écrire les unit tests pour ProjectService
    - Tester la création de projet
    - Tester la mise à jour dans les 200ms
    - Tester la suppression avec cascade
    - tester et faire un commit
    - _Requirements: 4.3, 4.5, 4.7_

- [x] 11. Implémenter le Task Service
  - [x] 11.1 Créer TaskService avec CRUD operations
    - Implémenter create() pour créer une task
    - Implémenter findByProject() pour lister les tasks d'un projet
    - Implémenter update() pour modifier une task (< 200ms)
    - Implémenter delete() pour supprimer une task
    - Implémenter reorder() pour réorganiser les tasks
    - tester et faire un commit
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x]\* 11.2 Écrire les property tests pour TaskService
    - **Property 17: Task List Matches Project's Tasks**
    - **Property 18: Task Creation Persists and Returns Data**
    - **Property 19: Task Updates Persist**
    - **Property 20: Task Deletion Removes from Database**
    - **Property 21: Task Reordering Persists**
    - tester et faire un commit
    - **Valide: Requirements 5.1, 5.3, 5.5, 5.7, 5.9**

  - [x]\* 11.3 Écrire les unit tests pour TaskService
    - Tester la création de task
    - Tester la mise à jour dans les 200ms
    - Tester la suppression
    - Tester le reordering
    - tester et faire un commit
    - _Requirements: 5.3, 5.5, 5.7, 5.9_

- [x] 12. Checkpoint - Vérifier les services backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Implémenter le WebSocket Service backend
  - [x] 13.1 Créer WebSocketService avec broadcasting
    - Configurer Socket.io ou ws pour WebSocket server
    - Implémenter broadcastToProject() pour envoyer aux clients d'un projet
    - Implémenter broadcastToUser() pour envoyer à un user spécifique
    - Implémenter getConnectedUsers() pour lister les users connectés
    - Implémenter la gestion des rooms (join/leave project)
    - Intégrer avec State Manager pour updates temps réel
    - tester et faire un commit
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.7, 7.7_

  - [x] 13.2 Écrire les property tests pour WebSocketService
    - **Property 23: Task Operations Broadcast to Project Clients**
    - **Property 26: Connected Users Display Matches Actual**
    - **Property 31: WebSocket Messages Update State**
    - tester et faire un commit
    - **Valide: Requirements 6.2, 6.3, 6.4, 6.7, 7.7**

  - [x] 13.3 Écrire les unit tests pour WebSocketService
    - Tester le broadcast aux clients d'un projet
    - Tester le broadcast dans les 100ms
    - Tester la gestion des rooms
    - tester et faire un commit
    - _Requirements: 6.2, 6.3, 6.4_

- [x] 14. Implémenter les routes API REST
  - [x] 14.1 Créer les routes d'authentification
    - POST /api/auth/register
    - POST /api/auth/login
    - POST /api/auth/logout
    - POST /api/auth/refresh
    - Implémenter le middleware d'authentification JWT
    - tester et faire un commit
    - _Requirements: 3.1, 3.2, 3.6, 3.7, 3.8_

  - [x] 14.2 Créer les routes de projets
    - GET /api/projects (liste des projets)
    - POST /api/projects (créer un projet)
    - GET /api/projects/:id (détails d'un projet)
    - PUT /api/projects/:id (modifier un projet)
    - DELETE /api/projects/:id (supprimer un projet)
    - Appliquer le middleware d'authentification
    - tester et faire un commit
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

  - [x] 14.3 Créer les routes de tasks
    - GET /api/projects/:projectId/tasks (liste des tasks)
    - POST /api/projects/:projectId/tasks (créer une task)
    - PUT /api/tasks/:id (modifier une task)
    - DELETE /api/tasks/:id (supprimer une task)
    - PUT /api/projects/:projectId/tasks/reorder (réorganiser)
    - Appliquer le middleware d'authentification
    - tester et faire un commit
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [ ]\* 14.4 Écrire les tests d'intégration API
    - Tester le flow complet CRUD pour projects
    - Tester le flow complet CRUD pour tasks
    - Tester l'authentification et les permissions
    - tester et faire un commit
    - _Requirements: 3.2, 4.3, 4.5, 4.7, 5.3, 5.5, 5.7_

- [x] 15. Implémenter les UI Components frontend
  - [x] 15.1 Créer LoginComponent
    - Formulaire avec email et password
    - Validation côté client
    - Gestion des erreurs d'authentification
    - Stockage du JWT token après login
    - tester et faire un commit
    - _Requirements: 3.1, 3.4, 11.4_

  - [x] 15.2 Créer RegisterComponent
    - Formulaire avec email, password, name
    - Validation côté client (password strength, email format)
    - Gestion des erreurs de registration
    - Redirection après registration réussie
    - tester et faire un commit
    - _Requirements: 3.6, 3.7, 11.4_

  - [x] 15.3 Créer ProjectListComponent
    - Affichage de la liste des projets
    - Bouton pour créer un nouveau projet
    - Navigation vers ProjectDetailComponent
    - tester et faire un commit
    - _Requirements: 4.1, 4.2_

  - [x] 15.4 Créer ProjectFormComponent
    - Formulaire pour créer/éditer un projet
    - Champs: name, description
    - Validation côté client
    - Gestion des erreurs
    - tester et faire un commit
    - _Requirements: 4.2, 4.4, 11.4_

  - [x] 15.5 Créer TaskListComponent
    - Affichage de la liste des tasks d'un projet
    - Support du drag-and-drop pour réorganiser
    - Inline editing des tasks
    - Boutons de suppression
    - tester et faire un commit
    - _Requirements: 5.1, 5.4, 5.6, 5.8_

  - [x] 15.6 Créer TaskFormComponent
    - Formulaire pour créer/éditer une task
    - Champs: title, description, status, assignee
    - Validation côté client
    - Gestion des erreurs
    - tester et faire un commit
    - _Requirements: 5.2, 5.4, 11.4_

  - [x]\* 15.7 Écrire les unit tests pour les UI Components
    - Tester le rendering des components
    - Tester les interactions utilisateur
    - Tester la validation des formulaires
    - tester et faire un commit
    - _Requirements: 3.1, 4.2, 5.2, 11.4_

- [x] 16. Implémenter le filtrage et la recherche de tasks
  - [x] 16.1 Créer TaskFilterComponent
    - Input de recherche avec debouncing
    - Filtres par status (todo, in-progress, done)
    - Filtres par assignee
    - Support des filtres combinés
    - Filtrage en temps réel
    - tester et faire un commit
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 10.4_

  - [x] 16.2 Écrire les property tests pour le filtrage
    - **Property 32: Search Filters Tasks in Real-Time**
    - **Property 33: Status Filter Shows Matching Tasks**
    - **Property 34: Assignee Filter Shows Matching Tasks**
    - **Property 35: Combined Filters Apply Simultaneously**
    - **Property 37: Search Input Is Debounced**
    - tester et faire un commit
    - **Valide: Requirements 8.2, 8.4, 8.6, 8.7, 10.4**

  - [x] 16.3 Écrire les unit tests pour le filtrage
    - Tester le filtrage par recherche
    - Tester le filtrage par status
    - Tester le filtrage par assignee
    - Tester les filtres combinés
    - tester et faire un commit
    - _Requirements: 8.2, 8.4, 8.6, 8.7_

- [ ] 17. Implémenter le design responsive avec CSS natif
  - [x] 17.1 Créer les styles de base et layout responsive
    - Créer les variables CSS (couleurs, spacing, typography)
    - Implémenter le layout principal avec flexbox/grid
    - Créer les media queries pour desktop (1920x1080+)
    - Créer les media queries pour tablet (768x1024)
    - Créer les media queries pour mobile (375x667)
    - Implémenter le menu mobile pour viewport < 768px
    - Utiliser des unités relatives (rem, em, %)
    - tester et faire un commit
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

  - [x] 17.2 Créer les styles des components
    - Styles pour LoginComponent et RegisterComponent
    - Styles pour ProjectListComponent et ProjectFormComponent
    - Styles pour TaskListComponent et TaskFormComponent
    - Styles pour TaskFilterComponent
    - Styles pour les messages d'erreur et toasts
    - Support ARIA et navigation au clavier
    - tester et faire un commit
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]\* 17.3 Tester le responsive design
    - Tester l'affichage sur différentes tailles d'écran
    - Tester le menu mobile
    - Tester l'accessibilité (ARIA, keyboard navigation)
    - tester et faire un commit
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [x] 18. Checkpoint - Vérifier l'intégration frontend-backend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 19. Implémenter les optimisations de performance
  - [x] 19.1 Optimiser le frontend
    - Implémenter lazy loading pour les route components
    - Implémenter event delegation pour les list items
    - Implémenter le debouncing pour la recherche
    - Optimiser le bundle size (code splitting)
    - Implémenter le caching côté client
    - tester et faire un commit
    - _Requirements: 10.2, 10.3, 10.4, 10.5_

  - [x] 19.2 Optimiser le backend
    - Implémenter response caching pour données fréquentes
    - Implémenter database connection pooling
    - Optimiser les requêtes database (indexes)
    - Implémenter compression (gzip)
    - tester et faire un commit
    - _Requirements: 10.6, 10.7, 12.4_

  - [x] 19.3 Écrire les property tests pour la performance
    - **Property 36: Route Navigation Completes Within 300ms**
    - **Property 38: Cached Data Responds Within 50ms**
    - tester et faire un commit
    - **Valide: Requirements 10.3, 10.6, 10.7**

  - [x] 19.4 Tester la performance
    - Tester le chargement initial (< 2s sur 3G)
    - Tester la navigation entre routes (< 300ms)
    - Tester les réponses cached (< 50ms)
    - tester et faire un commit
    - _Requirements: 10.1, 10.3, 10.7_

- [x] 20. Implémenter la gestion d'erreurs complète
  - [x] 20.1 Améliorer la gestion d'erreurs frontend
    - Implémenter APIClient avec retry et exponential backoff
    - Implémenter les toast notifications pour erreurs temporaires
    - Implémenter les modals pour erreurs critiques (Double Confirmation)
    - Implémenter les inline errors pour validation
    - Implémenter le status indicator pour WebSocket
    - tester et faire un commit
    - _Requirements: 11.1, 11.3, 11.4_

  - [x] 20.2 Améliorer la gestion d'erreurs backend
    - Améliorer le global error handler avec logging structuré
    - Implémenter les error codes standardisés
    - Implémenter le transaction rollback sur erreurs
    - Implémenter les health checks pour database
    - tester et faire un commit
    - _Requirements: 11.2, 11.5, 11.6, 12.3_

  - [x] 20.3 Écrire les property tests pour la gestion d'erreurs
    - **Property 39: Network Failures Display Error Messages**
    - **Property 40: Server Errors Return Structured Response**
    - **Property 41: Invalid Form Data Shows Field-Specific Errors**
    - **Property 42: Server Logs All Errors**
    - **Property 43: Unhandled Exceptions Return 500**
    - tester et faire un commit
    - **Valide: Requirements 11.1, 11.2, 11.4, 11.5, 11.6**

  - [x] 20.4 Écrire les unit tests pour la gestion d'erreurs
    - Tester le retry avec exponential backoff
    - Tester les messages d'erreur user-friendly
    - Tester le logging des erreurs
    - tester et faire un commit
    - _Requirements: 11.1, 11.2, 11.5_

- [x] 21. Implémenter la persistence et les transactions
  - [x] 21.1 Améliorer la gestion des transactions
    - Implémenter les transactions pour opérations multi-tables
    - Implémenter le commit avant response
    - Implémenter le rollback sur erreurs
    - Implémenter la validation avant persistence
    - tester et faire un commit
    - _Requirements: 12.2, 12.3, 12.5_

  - [x] 21.2 Écrire les property tests pour la persistence
    - **Property 44: Transactions Commit Before Response**
    - **Property 45: Failed Operations Rollback Transactions**
    - **Property 46: Invalid Data Rejected Before Persistence**
    - tester et faire un commit
    - **Valide: Requirements 12.2, 12.3, 12.5**

  - [x] 21.3 Écrire les unit tests pour les transactions
    - Tester le commit avant response
    - Tester le rollback sur erreurs
    - Tester la validation avant persistence
    - tester et faire un commit
    - _Requirements: 12.2, 12.3, 12.5_

- [x] 22. Intégration finale et wiring
  - [x] 22.1 Connecter tous les composants
    - Intégrer Router avec tous les components
    - Intégrer State Manager avec WebSocket Manager
    - Intégrer WebSocket Manager avec backend WebSocket Service
    - Intégrer tous les UI components avec State Manager
    - Configurer les routes avec route guards
    - Tester le flow complet end-to-end
    - tester et faire un commit
    - _Requirements: 2.2, 2.3, 2.8, 6.1, 6.2, 6.3, 6.4, 7.7_

  - [x] 22.2 Écrire les tests d'intégration end-to-end
    - Tester le flow complet: login → créer projet → créer task → collaboration temps réel
    - Tester la reconnexion WebSocket et synchronisation
    - Tester les route guards et redirections
    - tester et faire un commit
    - _Requirements: 2.8, 3.2, 4.3, 5.3, 6.2, 6.5, 6.6_

- [ ] 23. Checkpoint final - Vérifier tous les tests
  - Ensure all tests pass, ask the user if questions arise.

- [x] 24. Documentation et déploiement
  - [x] 24.1 Créer la documentation
    - README.md avec instructions de setup
    - Documentation API (endpoints, formats)
    - Documentation des composants frontend
    - Guide de contribution
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 24.2 Préparer le déploiement
    - Configurer les variables d'environnement
    - Créer les Dockerfiles pour frontend et backend
    - Créer docker-compose.yml pour dev local
    - Configurer les scripts de production build
    - _Requirements: 1.5, 12.1_

## Notes

- Les tâches marquées avec `*` sont optionnelles et peuvent être sautées pour un MVP plus rapide
- Chaque tâche référence les requirements spécifiques pour la traçabilité
- Les checkpoints assurent une validation incrémentale
- Les property tests valident les propriétés de correction universelles
- Les unit tests valident les cas spécifiques et edge cases
- L'implémentation suit une approche bottom-up: core components → services → UI → intégration
