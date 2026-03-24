// ═══════════════════════════════════════════════════════════
// ENCRYPTION SERVICE — The scrambling machine
// Plain English: Before saving sensitive information like
// PAN numbers, bank accounts, or Aadhaar — this service
// scrambles it using AES-256 encryption. Even if someone
// somehow accessed the database directly, they'd see
// random gibberish instead of real data.
//
// AES-256 is the same encryption used by banks and governments.
// ═══════════════════════════════════════════════════════════

import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyBuffer: Buffer;

  constructor() {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
    }
    this.keyBuffer = Buffer.from(key, 'utf8');
  }

  // ── ENCRYPT ───────────────────────────────────────────
  // Plain English: Takes readable text (e.g. "ABCDE1234F")
  // and returns scrambled text (e.g. "8f3a2b...") that can
  // only be unscrambled with the secret key.
  encrypt(plaintext: string): string {
    if (!plaintext) return plaintext;

    // Generate a random initialisation vector (like a salt for encryption)
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.keyBuffer, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // The authentication tag proves the data wasn't tampered with
    const authTag = cipher.getAuthTag();

    // Store: iv + authTag + encrypted data (all needed for decryption)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  // ── DECRYPT ───────────────────────────────────────────
  // Plain English: Takes the scrambled text and returns
  // the original readable text. Only works with the correct
  // secret key.
  decrypt(encryptedData: string): string {
    if (!encryptedData) return encryptedData;

    try {
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.keyBuffer, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch {
      throw new Error('Decryption failed — data may be corrupted or key is wrong');
    }
  }

  // ── HASH (one-way, for searching) ─────────────────────
  // Plain English: Sometimes you need to search by PAN number
  // without decrypting everything. A hash lets you check
  // "does this PAN exist?" without revealing the actual PAN.
  // This is one-way — you can't reverse it.
  hash(value: string): string {
    return crypto
      .createHmac('sha256', this.keyBuffer)
      .update(value.toUpperCase().trim())
      .digest('hex');
  }
}
