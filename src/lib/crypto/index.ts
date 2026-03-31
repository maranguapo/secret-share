const PBKDF2_ITERATIONS = 310_000
const KEY_LENGTH = 256
const HASH = 'SHA-256'

// Converte qualquer Uint8Array para ArrayBuffer puro (sem SharedArrayBuffer)
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer
}

function randomBytes(length: number): ArrayBuffer {
  return toArrayBuffer(crypto.getRandomValues(new Uint8Array(length)))
}

async function deriveKey(passphrase: string, salt: ArrayBuffer): Promise<CryptoKey> {
  const enc = new TextEncoder()

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(enc.encode(passphrase)),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: HASH },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

// ─── ENCRYPT ──────────────────────────────────────────────────────────────────

export interface EncryptedPayload {
  ciphertext: string
  iv: string
  salt: string
}

export async function encrypt(
  plaintext: string,
  passphrase: string
): Promise<EncryptedPayload> {
  const enc = new TextEncoder()
  const salt = randomBytes(16)
  const iv   = randomBytes(12)
  const key  = await deriveKey(passphrase, salt)

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    toArrayBuffer(enc.encode(plaintext))
  )

  return {
    ciphertext: toBase64(ciphertextBuffer),
    iv:         toBase64(iv),
    salt:       toBase64(salt),
  }
}

// ─── DECRYPT ──────────────────────────────────────────────────────────────────

export async function decrypt(
  payload: EncryptedPayload,
  passphrase: string
): Promise<string> {
  const salt       = fromBase64(payload.salt)
  const iv         = fromBase64(payload.iv)
  const ciphertext = fromBase64(payload.ciphertext)
  const key        = await deriveKey(passphrase, salt)

  try {
    const plaintextBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    )
    return new TextDecoder().decode(plaintextBuffer)
  } catch {
    throw new Error('Decryption failed: wrong passphrase or tampered data.')
  }
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function fromBase64(b64: string): ArrayBuffer {
  return toArrayBuffer(Uint8Array.from(atob(b64), c => c.charCodeAt(0)))
}