import crypto from 'crypto';
import pino from 'pino';

// Using Pino for extremely fast, secure, JSON structured logging 
// suitable for immutable ledgers or ELK stacks
const logger = pino({
  name: 'audit-vault',
  level: 'info',
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
});

// 32 bytes hex string for AES-256
if (!process.env.ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  throw new Error("CRITICAL FLIGHT ERROR: Set the ENCRYPTION_KEY");
}
if (!process.env.ENCRYPTION_KEY) {
  logger.warn("WARNING: Using ephemeral encryption key. Data will be lost on restart.");
}
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16; 

export function encryptKey(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

export function decryptKey(text: string): string {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const authTag = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

export function auditLog(action: string, user: string, details: any) {
    logger.info({ action, user, details });
}
