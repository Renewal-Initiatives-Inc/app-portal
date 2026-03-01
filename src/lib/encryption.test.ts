import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'

// Must set env before importing
const TEST_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'

describe('encryption', () => {
  beforeEach(() => {
    vi.stubEnv('PAYROLL_ENCRYPTION_KEY', TEST_KEY)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('round-trip encrypt/decrypt returns original plaintext', async () => {
    const { encrypt, decrypt } = await import('./encryption')
    const plaintext = '123-45-6789'
    const encrypted = encrypt(plaintext)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plaintext)
  })

  it('different IVs per encryption call', async () => {
    const { encrypt } = await import('./encryption')
    const plaintext = '123-45-6789'
    const encrypted1 = encrypt(plaintext)
    const encrypted2 = encrypt(plaintext)
    expect(encrypted1).not.toBe(encrypted2)
  })

  it('encrypted format is iv:authTag:ciphertext', async () => {
    const { encrypt } = await import('./encryption')
    const encrypted = encrypt('test')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
    for (const part of parts) {
      expect(() => Buffer.from(part, 'base64')).not.toThrow()
    }
  })

  it('decrypt fails with wrong key', async () => {
    const { encrypt } = await import('./encryption')
    const encrypted = encrypt('test-value')

    vi.stubEnv(
      'PAYROLL_ENCRYPTION_KEY',
      'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789'
    )

    const { decrypt } = await import('./encryption')
    expect(() => decrypt(encrypted)).toThrow()
  })

  it('throws descriptive error if key is missing', async () => {
    vi.stubEnv('PAYROLL_ENCRYPTION_KEY', '')
    const { encrypt } = await import('./encryption')
    expect(() => encrypt('test')).toThrow('PAYROLL_ENCRYPTION_KEY')
  })

  it('throws error for invalid encrypted string format', async () => {
    const { decrypt } = await import('./encryption')
    expect(() => decrypt('not-valid-format')).toThrow('Invalid encrypted string format')
  })

  it('encryptPII/decryptPII round-trip works', async () => {
    const { encryptPII, decryptPII } = await import('./encryption')
    const ssn = '987-65-4321'
    const encrypted = encryptPII(ssn)
    expect(encrypted).not.toBe(ssn)
    expect(decryptPII(encrypted)).toBe(ssn)
  })

  it('handles special characters and unicode', async () => {
    const { encrypt, decrypt } = await import('./encryption')
    const address = '123 Main St, Apt #4B\nSpringfield, MA 01103'
    const encrypted = encrypt(address)
    expect(decrypt(encrypted)).toBe(address)
  })
})
