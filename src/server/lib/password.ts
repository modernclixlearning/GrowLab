/**
 * GrowLab Password Utilities
 * 
 * Bcrypt-based password hashing and verification.
 */

import bcrypt from 'bcryptjs'

/** Number of salt rounds for bcrypt */
const SALT_ROUNDS = 12

/**
 * Hash a plaintext password
 * 
 * @param password - Plaintext password to hash
 * @returns Bcrypt hash of the password
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

/**
 * Verify a password against a hash
 * 
 * @param password - Plaintext password to verify
 * @param hash - Bcrypt hash to compare against
 * @returns True if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
