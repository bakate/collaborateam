import bcrypt from 'bcrypt';

const COST_FACTOR = 12;

export const BcryptPasswordHasher = Object.freeze({
  /**
   * Hashes a plaintext password using bcrypt.
   * @param {Object} input - { password }
   * @returns {Promise<string>}
   */
  async hash({ password }) {
    if (!password) {
      throw new Error('Password is required');
    }
    return bcrypt.hash(password, COST_FACTOR);
  },

  /**
   * Verifies a password against a hash.
   * @param {Object} input - { password, hash }
   * @returns {Promise<boolean>}
   */
  async verify({ password, hash }) {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }
});
