import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const IV_LENGTH = 16 // For AES, this is always 16

// Extract encryption key from environment, fallback to a local safe value if missing
const getEncryptionKey = (): Buffer => {
  const envKey = process.env.ENCRYPTION_KEY
  if (!envKey) {
    throw new Error('ENCRYPTION_KEY environment variable is missing. It must be defined in production and local dev settings.')
  }
  if (envKey.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-character hex string representing a 32-byte key.')
  }
  return Buffer.from(envKey, 'hex')
}

/**
 * Encrypts a text string using AES-256-CBC
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const key = getEncryptionKey()
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Format as IV:encryptedText so we know which IV to use when decrypting
  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypts an AES-256-CBC encrypted string
 */
export function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(':')
  if (parts.length !== 2) {
    throw new Error('Invalid encrypted text format')
  }
  
  const iv = Buffer.from(parts[0], 'hex')
  const encrypted = parts[1]
  const key = getEncryptionKey()
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  
  return decrypted
}
