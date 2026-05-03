import { describe, it, expect, beforeAll } from "vitest";
import { faker } from "@faker-js/faker";
import { handleAuthRoutes } from "./routes/auth.routes.js";
import { handleProjectRoutes } from "./routes/projects.routes.js";
import { handleTaskRoutes } from "./routes/tasks.routes.js";
import { checkConnection } from "@workspace/infrastructure/db/db";
import { runMigrations } from "@workspace/infrastructure/db/migrate";

// Improved helper to simulate Request object with .get() method for headers
const mockRequest = (method, url, body = null, headers = {}) => {
  const h = new Map(
    Object.entries({
      "content-type": "application/json",
      ...headers,
    }).map(([k, v]) => [k.toLowerCase(), v]),
  );

  return {
    method,
    headers: {
      get: (name) => h.get(name.toLowerCase()) || null,
    },
    json: async () => body,
  };
};

// Helper to get data from response
const getResData = async (res) => {
  return res.json().catch(() => ({}));
};

describe("API Full Integration Flow", () => {
  let authToken = null;
  let testProjectId = null;
  let testTaskId = null;

  beforeAll(async () => {
    const isConnected = await checkConnection();
    if (!isConnected) {
      console.warn(
        "WARNING: Database connection failed. Integration tests may fail.",
      );
      return;
    }

    console.warn("🌱 Running migrations on test database...");
    const migrationResult = await runMigrations();
    if (!migrationResult.ok) {
      console.error("❌ Migration failed:", migrationResult.error);
    } else {
      console.warn("✅ Migrations completed!");
    }
  });

  const testUser = {
    username: `testuser_${faker.string.alphanumeric(8)}`,
    email: faker.internet.email().toLowerCase(),
    password: "Password123!",
  };

  describe("Authentication Flow", () => {
    it("POST /api/auth/register should create a new user", async () => {
      const req = mockRequest("POST", "/api/auth/register", testUser);
      const url = new URL("http://localhost/api/auth/register");

      const res = await handleAuthRoutes(req, url);
      const data = await getResData(res);

      expect(res.status).toBe(201);
      expect(data.user.username.toLowerCase()).toBe(
        testUser.username.toLowerCase(),
      );
      expect(data.accessToken).toBeDefined();
    });

    it("POST /api/auth/login should return a token", async () => {
      const req = mockRequest("POST", "/api/auth/login", {
        email: testUser.email,
        password: testUser.password,
      });
      const url = new URL("http://localhost/api/auth/login");

      const res = await handleAuthRoutes(req, url);
      const data = await getResData(res);

      expect(res.status).toBe(200);
      expect(data.accessToken).toBeDefined();
      authToken = data.accessToken;
    });
  });

  describe("Projects Flow", () => {
    it("POST /api/projects should create a project", async () => {
      const projectData = {
        name: "Integration Project",
        description: "Test desc",
      };
      const req = mockRequest("POST", "/api/projects", projectData, {
        Authorization: `Bearer ${authToken}`,
      });
      const url = new URL("http://localhost/api/projects");

      const res = await handleProjectRoutes(req, url);
      const data = await getResData(res);

      expect(res.status).toBe(201);
      expect(data.project.name).toBe(projectData.name);
      testProjectId = data.project.id;
    });

    it("GET /api/projects should list projects", async () => {
      const req = mockRequest("GET", "/api/projects", null, {
        Authorization: `Bearer ${authToken}`,
      });
      const url = new URL("http://localhost/api/projects");

      const res = await handleProjectRoutes(req, url);
      const data = await getResData(res);

      expect(res.status).toBe(200);
      expect(Array.isArray(data.projects)).toBe(true);
      expect(data.projects.some((p) => p.id === testProjectId)).toBe(true);
    });

    it("PUT /api/projects/:id should update a project", async () => {
      const updateData = { name: "Updated Project" };
      const req = mockRequest(
        "PUT",
        `/api/projects/${testProjectId}`,
        updateData,
        {
          Authorization: `Bearer ${authToken}`,
        },
      );
      const url = new URL(`http://localhost/api/projects/${testProjectId}`);

      const res = await handleProjectRoutes(req, url);
      const data = await getResData(res);

      expect(res.status).toBe(200);
      expect(data.project.name).toBe(updateData.name);
    });
  });

  describe("Tasks Flow", () => {
    it("POST /api/projects/:id/tasks should create a task", async () => {
      const taskData = { title: "Integration Task", description: "Task desc" };
      const req = mockRequest(
        "POST",
        `/api/projects/${testProjectId}/tasks`,
        taskData,
        {
          Authorization: `Bearer ${authToken}`,
        },
      );
      const url = new URL(
        `http://localhost/api/projects/${testProjectId}/tasks`,
      );

      const res = await handleTaskRoutes(req, url);
      const data = await getResData(res);

      expect(res.status).toBe(201);
      expect(data.task.title).toBe(taskData.title);
      testTaskId = data.task.id;
    });

    it("GET /api/projects/:id/tasks should list tasks with pagination", async () => {
      const req = mockRequest(
        "GET",
        `/api/projects/${testProjectId}/tasks`,
        null,
        {
          Authorization: `Bearer ${authToken}`,
        },
      );
      const url = new URL(
        `http://localhost/api/projects/${testProjectId}/tasks?limit=10&offset=0`,
      );

      const res = await handleTaskRoutes(req, url);
      const data = await getResData(res);

      expect(res.status).toBe(200);
      expect(Array.isArray(data.tasks)).toBe(true);
      expect(data.tasks.length).toBeGreaterThan(0);
    });

    it("PUT /api/tasks/:id should update a task status", async () => {
      const updateData = { status: "done", projectId: testProjectId };
      const req = mockRequest("PUT", `/api/tasks/${testTaskId}`, updateData, {
        Authorization: `Bearer ${authToken}`,
      });
      const url = new URL(`http://localhost/api/tasks/${testTaskId}`);

      const res = await handleTaskRoutes(req, url);
      const data = await getResData(res);

      expect(res.status).toBe(200);
      expect(data.task.status).toBe("done");
    });
  });

  describe("Cleanup Flow", () => {
    it("DELETE /api/tasks/:id should remove the task", async () => {
      const req = mockRequest(
        "DELETE",
        `/api/tasks/${testTaskId}`,
        { projectId: testProjectId },
        {
          Authorization: `Bearer ${authToken}`,
        },
      );
      const url = new URL(`http://localhost/api/tasks/${testTaskId}`);

      const res = await handleTaskRoutes(req, url);
      expect(res.status).toBe(200);
    });

    it("DELETE /api/projects/:id should remove the project", async () => {
      const req = mockRequest(
        "DELETE",
        `/api/projects/${testProjectId}`,
        null,
        {
          Authorization: `Bearer ${authToken}`,
        },
      );
      const url = new URL(`http://localhost/api/projects/${testProjectId}`);

      const res = await handleProjectRoutes(req, url);
      expect(res.status).toBe(200);
    });
  });
});
