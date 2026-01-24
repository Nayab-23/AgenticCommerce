const crypto = require('crypto');
const fs = require('fs');

// Your entity secret (SAME as testnet)
const entitySecretRaw = '235572cb3f8ac80ff2923b9787d6e5579ef652c93e435a7706c1c067eb790de6';

// Mainnet public key
const publicKeyPem = fs.readFileSync('circle_entity_public_mainnet.pem', 'utf8');

// Encrypt RAW BYTES with RSA-OAEP SHA-256
const entitySecretBytes = Buffer.from(entitySecretRaw, 'hex');
const encrypted = crypto.publicEncrypt({
  key: publicKeyPem,
  padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
  oaepHash: 'sha256'
}, entitySecretBytes);

const encryptedBase64 = encrypted.toString('base64');
console.log('\n✅ Encrypted Entity Secret (for MAINNET):');
console.log(encryptedBase64);
console.log('\n📋 Next step: Register this in Circle Console → Mainnet → Dev Controlled → Configurator\n');
