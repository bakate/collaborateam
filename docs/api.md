# API Documentation

The Collaborateam API is a REST-like API with WebSocket support for real-time updates.

## 🔐 Authentication

Most endpoints require a valid JWT token in the `Authorization` header.

```text
Authorization: Bearer <your_access_token>
```

### Endpoints

- **POST `/api/auth/register`**: Register a new user.
  - Body: `{ username, email, password }`
- **POST `/api/auth/login`**: Authenticate and get tokens.
  - Body: `{ email, password }`
- **POST `/api/auth/refresh`**: Refresh access token.
  - Body: `{ refreshToken }`
- **GET `/api/auth/me`**: Get current user profile.

---

## 📁 Projects

- **GET `/api/projects`**: List all projects accessible by the user.
- **POST `/api/projects`**: Create a new project.
  - Body: `{ name, description }`
- **GET `/api/projects/:id`**: Get project details.
- **PUT `/api/projects/:id`**: Update a project.
  - Body: `{ name, description }`
- **DELETE `/api/projects/:id`**: Delete a project and its tasks.

---

## 📋 Tasks

- **GET `/api/projects/:projectId/tasks`**: List tasks for a project.
  - Query params: `status`, `assigneeId`, `page`, `limit`.
- **POST `/api/projects/:projectId/tasks`**: Create a task.
  - Body: `{ title, description, status, assigneeId }`
- **PUT `/api/tasks/:id`**: Update a task.
  - Body: `{ title, description, status, assigneeId }`
- **DELETE `/api/tasks/:id`**: Delete a task.

---

## 🔄 WebSocket (Real-time)

Connect to `ws://localhost:3000/ws` after authentication.

### Messages Sent by Server

- **`PROJECT_CREATED`**: A new project was added.
- **`TASK_UPDATED`**: A task status or details changed.
- **`USER_JOINED`**: A user started collaborating on a project.

### Protocol Example

```json
{
  "type": "TASK_UPDATED",
  "payload": {
    "id": "task_123",
    "status": "completed",
    "updatedBy": "user_456"
  }
}
```

---

## ⚠️ Error Responses

Errors follow a standard format:

```json
{
  "error": "Error message description",
  "details": { ... } // Optional validation details
}
```

Common status codes:
- `400`: Bad Request (Validation failed)
- `401`: Unauthorized (Missing or invalid token)
- `403`: Forbidden (Insufficient permissions)
- `404`: Not Found
- `409`: Conflict (e.g., Email already exists)
- `500`: Internal Server Error
