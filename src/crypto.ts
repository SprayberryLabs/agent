/**
 * AskAlf Agent Encryption
 *
 * - Config encryption at rest (API keys, tokens)
 * - Payload encryption for task data in transit
 * - Machine-derived encryption key (no hardcoded secrets)
 * - Audit log field encryption
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash, scryptSync } from 'crypto';
import { hostname, userInfo } from 'os';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const SALT_LENGTH = 16;

/**
 * Derive an encryption key from machine-specific data.
 * This means the config can only be decrypted on the same machine by the same user.
 * Not bulletproof (someone with root on the same machine can derive it),
 * but it prevents config files from being useful if copied elsewhere.
 */
function deriveMachineKey(): Buffer {
  const machineId = [
    hostname(),
    userInfo().username,
    process.arch,
    process.platform,
    // Add a stable hardware-ish fingerprint
    (() => { try { return require('os').networkInterfaces(); } catch { return 'no-network'; } })(),
  ].join(':');

  const hash = createHash('sha256').update(machineId).digest('hex');
  return scryptSync(hash, 'askalf-agent-v2', KEY_LENGTH);
}

let machineKey: Buffer | null = null;

function getMachineKey(): Buffer {
  if (!machineKey) machineKey = deriveMachineKey();
  return machineKey;
}

// ── Encrypt / Decrypt ──

/**
 * Encrypt a string. Returns base64-encoded ciphertext with embedded IV and auth tag.
 * Format: base64(iv + authTag + ciphertext)
 */
export function encrypt(plaintext: string, key?: Buffer): string {
  const k = key ?? getMachineKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, k, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Pack: iv(12) + tag(16) + ciphertext
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

/**
 * Decrypt a base64-encoded ciphertext produced by encrypt().
 */
export function decrypt(ciphertext: string, key?: Buffer): string {
  const k = key ?? getMachineKey();
  const data = Buffer.from(ciphertext, 'base64');

  if (data.length < IV_LENGTH + TAG_LENGTH + 1) {
    throw new Error('Invalid ciphertext: too short');
  }

  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const encrypted = data.subarray(IV_LENGTH + TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, k, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

// ── Config Encryption Helpers ──

/**
 * Encrypt sensitive config fields (API key, tokens).
 * Returns a config object safe to write to disk.
 */
export function encryptConfig(config: Record<string, unknown>): Record<string, unknown> {
  const encrypted: Record<string, unknown> = { ...config, _encrypted: true };

  if (typeof config['apiKey'] === 'string') {
    encrypted['apiKey'] = encrypt(config['apiKey'] as string);
  }

  return encrypted;
}

/**
 * Decrypt a config read from disk.
 */
export function decryptConfig(config: Record<string, unknown>): Record<string, unknown> {
  if (!config['_encrypted']) return config; // Not encrypted — legacy format

  const decrypted = { ...config };
  delete decrypted['_encrypted'];

  if (typeof config['apiKey'] === 'string') {
    try {
      decrypted['apiKey'] = decrypt(config['apiKey'] as string);
    } catch {
      throw new Error('Failed to decrypt config. Was it created on a different machine?');
    }
  }

  return decrypted;
}

// ── Payload Encryption (for task data in transit) ──

/**
 * Derive a shared key from the API key for payload encryption.
 * Both agent and server derive the same key from the same API key.
 */
export function derivePayloadKey(apiKey: string): Buffer {
  return scryptSync(apiKey, 'askalf-payload-v2', KEY_LENGTH);
}

/**
 * Encrypt a task payload for secure transit.
 */
export function encryptPayload(data: string, apiKey: string): string {
  return encrypt(data, derivePayloadKey(apiKey));
}

/**
 * Decrypt a task payload received from the server.
 */
export function decryptPayload(data: string, apiKey: string): string {
  return decrypt(data, derivePayloadKey(apiKey));
}

// ── Audit Field Encryption ──

/**
 * Encrypt sensitive audit fields (input content) while keeping metadata readable.
 */
export function encryptAuditField(field: string): string {
  return encrypt(field);
}

/**
 * Decrypt an encrypted audit field.
 */
export function decryptAuditField(field: string): string {
  try {
    return decrypt(field);
  } catch {
    return field; // Not encrypted or wrong machine — return as-is
  }
}
