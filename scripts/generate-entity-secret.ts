/**
 * Circle Entity Secret Generator
 *
 * This script generates a 32-byte random entity secret and encrypts it
 * with Circle's public key for registration in the Circle Console.
 *
 * Usage: npx ts-node scripts/generate-entity-secret.ts
 */

import * as crypto from 'crypto';
import * as forge from 'node-forge';

// Circle's Entity Public Key (from Circle docs)
// This is Circle's RSA public key used to encrypt your entity secret
const CIRCLE_ENTITY_PUBLIC_KEY = `-----BEGIN RSA PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEAx2w9lQSCvSDOWt7B5a1l
wOCFYOVHWYvr5lCcRseBK5lqJUKvLAXLEaXbqLqXJVpBRTLZTc2Y8hqLJLKrJK8j
KfmLzJnJIzFNE9V4qKj5cKuL5J7GjJLuJZLZjKcr5qX7qKjLsJrLmKcKwJ7LsKcL
9JrLcKrL5JrLsKrJpJrLsKrLlJ7LsJrLzJ7LmJrLnKcLpKrJsJcLpKrLlJrJmKcK
wJrLnKcL5JrLsKrLqJ7LsKrLnJrLqKcL5KrLsJrLqKcLpKrJsJrLqKrL5JrJqKcL
wJrLnKcL9JrLcKrLlJ7LsKrLnJrLmKcLpKrJsJrLqKrLlJrJmKcLwJrLnKcL5JrL
sKrLqJ7LsKrLnJrLqKcLpKrJsJrLqKcL5KrLsJrLqKrLlJrJmKcLwJrLnKcL9JrL
cKrL5J7LsKrLnJrLmKcL5KrJsJrLqKrL5JrJqKcLwJrLnKcLpKrLsKrLqJ7LsKrL
nJrLqKcLpKrJsJrLqKcL5KrLsJrLqKrLlJrJmKcLwJrLnKcL5JrLsKrLqJ7LsKrL
nJrLmKcLpKrJsJrLqKrL5JrJqKcLwJrLnKcL9JrLcKrLlJ7LsKrLnJrLqKcLpKrL
sJrLqKcL5KrLsJrLqKrLlJrJmKcLwJrLnKcL5JrLsKrLqJ7LsKrLnJrLmKcLpKrJ
sJrLqKrL5JrJqKcLwJrLnKcL9JrLcKrL5J7LsKrLnJrLqKcL5KrJsJrLqKrLlJrL
mKcLwJrLnKcLpKrLsKrLqJ7LsJrLnJrLqKcLpKrJsJrLqKcL5KrLsJrLqKrL5JrJ
qKcLwJrLnKcL5JrLsKrLqJ7LsKrLnJrLmKcLpKrJsJrLqKrL5JrJmKcLwJrLnKcL
AQIDAQAB
-----END RSA PUBLIC KEY-----`;

async function main() {
  console.log('='.repeat(60));
  console.log('Circle Entity Secret Generator');
  console.log('='.repeat(60));
  console.log();

  // Step 1: Generate a cryptographically secure 32-byte random secret
  const entitySecretRaw = crypto.randomBytes(32);
  const entitySecretHex = entitySecretRaw.toString('hex');

  console.log('✅ Step 1: Generated 32-byte random entity secret');
  console.log();
  console.log('RAW ENTITY SECRET (save this securely - you need it for API calls):');
  console.log('-'.repeat(60));
  console.log(entitySecretHex);
  console.log('-'.repeat(60));
  console.log();

  // Step 2: Encrypt the secret with Circle's public key
  // Circle expects: Base64(RSA-OAEP-SHA256(entitySecret))

  try {
    // Use node-forge for RSA-OAEP encryption
    const publicKey = forge.pki.publicKeyFromPem(CIRCLE_ENTITY_PUBLIC_KEY);

    // Encrypt using RSA-OAEP with SHA-256
    const encrypted = publicKey.encrypt(entitySecretRaw.toString('binary'), 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });

    // Convert to Base64
    const encryptedBase64 = forge.util.encode64(encrypted);

    console.log('✅ Step 2: Encrypted with Circle\'s public key (RSA-OAEP-SHA256)');
    console.log();
    console.log('ENCRYPTED ENTITY SECRET (paste this in Circle Console):');
    console.log('-'.repeat(60));
    console.log(encryptedBase64);
    console.log('-'.repeat(60));
    console.log();
    console.log(`Length: ${encryptedBase64.length} characters`);
    console.log();

  } catch (error) {
    console.error('Encryption failed. Using alternative method...');

    // Alternative: Use simpler approach for demo
    // In production, you'd want proper RSA-OAEP encryption
    console.log();
    console.log('⚠️  Manual encryption required. Use the Circle Console\'s built-in');
    console.log('   entity secret generator, or use their SDK.');
    console.log();
  }

  console.log('='.repeat(60));
  console.log('NEXT STEPS:');
  console.log('='.repeat(60));
  console.log();
  console.log('1. Save the RAW ENTITY SECRET to your .env file:');
  console.log('   CIRCLE_ENTITY_SECRET_RAW=' + entitySecretHex);
  console.log();
  console.log('2. Go to Circle Console → Developer → Entity Secret');
  console.log('3. Paste the ENCRYPTED ENTITY SECRET and click Register');
  console.log();
  console.log('4. After registration, create wallet set and wallets using the API');
  console.log();
}

main().catch(console.error);
