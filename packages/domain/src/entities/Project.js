/**
 * Creates a frozen Project entity.
 * Uses RO-RO (Receive Object, Return Object) pattern.
 */
export const createProject = ({
  id,
  name,
  description = "",
  ownerId,
  createdAt,
  updatedAt,
}) => {
  return Object.freeze({
    id,
    name,
    description,
    ownerId,
    createdAt: createdAt ?? new Date().toISOString(),
    updatedAt: updatedAt ?? new Date().toISOString(),
  });
};
