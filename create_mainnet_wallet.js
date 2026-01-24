const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const CIRCLE_API_KEY = 'LIVE_API_KEY:73e007de2197a2221b178890c790d6b2:b13d288f9c2e7f14e4285dc90caaed7b';
const ENTITY_SECRET_RAW = '235572cb3f8ac80ff2923b9787d6e5579ef652c93e435a7706c1c067eb790de6';

function generateEntitySecretCiphertext() {
  const publicKeyPem = fs.readFileSync('circle_entity_public_mainnet.pem', 'utf8');
  const entitySecretBytes = Buffer.from(ENTITY_SECRET_RAW, 'hex');
  const encrypted = crypto.publicEncrypt({
    key: publicKeyPem,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256'
  }, entitySecretBytes);
  return encrypted.toString('base64');
}

function makeRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.circle.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${CIRCLE_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function createWalletSet() {
  console.log('Creating mainnet wallet set...');
  const result = await makeRequest('POST', '/v1/w3s/developer/walletSets', {
    name: 'Agent Treasury - Arc Mainnet',
    idempotencyKey: crypto.randomUUID(),
    entitySecretCiphertext: generateEntitySecretCiphertext()
  });

  console.log('Wallet Set Response:', JSON.stringify(result, null, 2));

  if (result.data && result.data.data && result.data.data.walletSet) {
    const walletSetId = result.data.data.walletSet.id;
    console.log('\n✅ Wallet Set ID:', walletSetId);
    return walletSetId;
  } else {
    throw new Error('Failed to create wallet set');
  }
}

async function createWallet(walletSetId) {
  console.log('\nCreating mainnet Arc wallet...');
  const result = await makeRequest('POST', '/v1/w3s/developer/wallets', {
    accountType: 'EOA',
    blockchains: ['ARC-MAINNET'],
    count: 1,
    walletSetId: walletSetId,
    idempotencyKey: crypto.randomUUID(),
    entitySecretCiphertext: generateEntitySecretCiphertext()
  });

  console.log('Wallet Response:', JSON.stringify(result, null, 2));

  if (result.data && result.data.data && result.data.data.wallets && result.data.data.wallets[0]) {
    const wallet = result.data.data.wallets[0];
    console.log('\n✅ Wallet ID:', wallet.id);
    console.log('✅ Wallet Address:', wallet.address);
    return wallet;
  } else {
    throw new Error('Failed to create wallet');
  }
}

async function main() {
  try {
    const walletSetId = await createWalletSet();
    const wallet = await createWallet(walletSetId);

    console.log('\n\n🎉 MAINNET WALLET CREATED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('Wallet Set ID:', walletSetId);
    console.log('Wallet ID:', wallet.id);
    console.log('Wallet Address:', wallet.address);
    console.log('\n📝 Add these to your .env file:');
    console.log(`CIRCLE_WALLET_ID=${wallet.id}`);
    console.log(`AGENT_WALLET_ADDRESS=${wallet.address}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
