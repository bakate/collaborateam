/**
 * UUID v4 Validation Regex
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Checks if a string is a valid UUID.
 * @param {string} id 
 * @returns {boolean}
 */
export const isValidUuid = (id) => {
  if (typeof id !== 'string') return false;
  return UUID_REGEX.test(id);
};
