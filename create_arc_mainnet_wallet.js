const crypto = require('crypto');
const fs = require('fs');
const https = require('https');

const CIRCLE_API_KEY = 'LIVE_API_KEY:73e007de2197a2221b178890c790d6b2:b13d288f9c2e7f14e4285dc90caaed7b';
const ENTITY_SECRET_RAW = '235572cb3f8ac80ff2923b9787d6e5579ef652c93e435a7706c1c067eb790de6';
const WALLET_SET_ID = 'bcd994bd-d859-5bfe-aca7-3ea42f53179f';

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

async function testArcBlockchains() {
  // Try various Arc mainnet identifiers
  const blockchains = [
    'ARC',
    'ARC-MAINNET',
    'ARC_MAINNET',
    'ARCMAINNET',
    'ARC-SEPOLIA',
    'ARCSEPOLIA',
    'ARC-NETWORK',
    'ARCNETWORK'
  ];

  console.log('Testing Arc blockchain identifiers for mainnet beta...\n');

  for (const blockchain of blockchains) {
    console.log(`Trying: ${blockchain}`);
    const result = await makeRequest('POST', '/v1/w3s/developer/wallets', {
      accountType: 'EOA',
      blockchains: [blockchain],
      count: 1,
      walletSetId: WALLET_SET_ID,
      idempotencyKey: crypto.randomUUID(),
      entitySecretCiphertext: generateEntitySecretCiphertext()
    });

    if (result.status === 201 || result.status === 200) {
      console.log(`✅ SUCCESS with ${blockchain}!`);
      console.log('Response:', JSON.stringify(result.data, null, 2));

      if (result.data && result.data.data && result.data.data.wallets && result.data.data.wallets[0]) {
        const wallet = result.data.data.wallets[0];
        console.log('\n🎉 ARC MAINNET WALLET CREATED!');
        console.log('Wallet ID:', wallet.id);
        console.log('Wallet Address:', wallet.address);
        console.log('Blockchain:', wallet.blockchain);
        console.log('\n📝 Update .env:');
        console.log(`CIRCLE_WALLET_ID=${wallet.id}`);
        console.log(`AGENT_WALLET_ADDRESS=${wallet.address}`);
      }
      return;
    } else {
      const msg = result.data.message || result.data.errors?.[0]?.message || JSON.stringify(result.data);
      console.log(`❌ Failed: ${msg}`);
    }
    console.log('');
  }

  console.log('\n⚠️  None of the Arc identifiers worked.');
  console.log('You may need to:');
  console.log('1. Check with Circle support for the exact Arc mainnet blockchain identifier');
  console.log('2. Verify your API key has beta access to Arc mainnet');
  console.log('3. Check if there\'s special onboarding required for Arc mainnet beta');
}

testArcBlockchains();
