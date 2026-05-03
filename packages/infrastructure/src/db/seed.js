import { sql } from "./db.js";
import { logger } from "../logger/logger.js";
import { faker } from "@faker-js/faker";

export const seedDatabase = async () => {
  logger.info("Starting database seeding...");

  try {
    // 1. Clear existing data (cascade will delete projects and tasks)
    await sql`TRUNCATE TABLE users CASCADE`;

    // 2. Create Users
    const users = Array.from({ length: 5 }).map(() => ({
      username: faker.internet.username(),
      email: faker.internet.email(),
      password_hash: "hashed_password_placeholder", // TODO: use bcrypt when AuthService is ready
    }));

    const insertedUsers = await sql`
      INSERT INTO users ${sql(users, "username", "email", "password_hash")}
      RETURNING id, username, email
    `;

    logger.info(`Inserted ${insertedUsers.length} users`);

    // 3. Create Projects
    const projects = insertedUsers.flatMap((user) => {
      // 1 to 3 projects per user
      const count = faker.number.int({ min: 1, max: 3 });
      return Array.from({ length: count }).map(() => ({
        name: faker.company.name(),
        description: faker.company.catchPhrase(),
        owner_id: user.id,
      }));
    });

    const insertedProjects = await sql`
      INSERT INTO projects ${sql(projects, "name", "description", "owner_id")}
      RETURNING id, name
    `;

    logger.info(`Inserted ${insertedProjects.length} projects`);

    // 4. Create Tasks
    const tasks = insertedProjects.flatMap((project) => {
      // 3 to 10 tasks per project
      const count = faker.number.int({ min: 3, max: 10 });
      return Array.from({ length: count }).map(() => ({
        title: faker.lorem.words({ min: 3, max: 6 }),
        description: faker.lorem.paragraph(),
        status: faker.helpers.arrayElement(["todo", "in_progress", "done"]),
        project_id: project.id,
      }));
    });

    const insertedTasks = await sql`
      INSERT INTO tasks ${sql(tasks, "title", "description", "status", "project_id")}
      RETURNING id
    `;

    logger.info(`Inserted ${insertedTasks.length} tasks`);
    logger.info("Database seeding completed successfully!");

    return { ok: true };
  } catch (error) {
    logger.error({ err: error.message }, "Database seeding failed");
    return { ok: false, error };
  } finally {
    // End the connection gracefully after seeding
    await sql.end();
  }
};

// If ran directly via CLI
if (import.meta.main || process.argv[1] === new URL(import.meta.url).pathname) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
