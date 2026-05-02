export const TaskStatus = Object.freeze({
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
});

/**
 * Creates a frozen Task entity.
 * Uses RO-RO (Receive Object, Return Object) pattern.
 */
export const createTask = ({
  id,
  title,
  description = "",
  status = TaskStatus.TODO,
  projectId,
  createdAt,
  updatedAt,
}) => {
  return Object.freeze({
    id,
    title,
    description,
    status,
    projectId,
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: updatedAt ?? new Date().toISOString(),
  });
};
