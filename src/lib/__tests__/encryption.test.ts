import { encrypt, decrypt } from '../encryption'

describe('encryption', () => {
  it('encrypts and decrypts a string', () => {
    const plain = 'secret-password-123'
    const encrypted = encrypt(plain)
    expect(encrypted).not.toBe(plain)
    expect(encrypted.length).toBeGreaterThan(0)
    const decrypted = decrypt(encrypted)
    expect(decrypted).toBe(plain)
  })

  it('produces different ciphertext for same plaintext (due to random IV)', () => {
    const plain = 'same'
    const a = encrypt(plain)
    const b = encrypt(plain)
    expect(a).not.toBe(b)
    expect(decrypt(a)).toBe(plain)
    expect(decrypt(b)).toBe(plain)
  })
})
