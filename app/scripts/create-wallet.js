import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

// Load .env.local file
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split(/\r?\n/).forEach(line => {
      const matched = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (matched) {
        const key = matched[1];
        let val = matched[2] || '';
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.replace(/\\n/gm, '\n');
        }
        val = val.replace(/(^['"]|['"]$)/g, '').trim();
        process.env[key] = val;
      }
    });
  }
}

// HTTP Request Helper
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (postData) {
      req.write(JSON.stringify(postData));
    }
    req.end();
  });
}

// Encrypt Entity Secret using RSA-OAEP with SHA-256
function encryptEntitySecret(publicKeyPem, entitySecretHex) {
  const buffer = Buffer.from(entitySecretHex, 'hex');
  const encrypted = crypto.publicEncrypt(
    {
      key: publicKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    buffer
  );
  return encrypted.toString('base64');
}

async function createWalletFlow() {
  console.log('==================================================');
  console.log('   Creating Circle Developer-Controlled Wallet     ');
  console.log('==================================================\n');

  loadEnv();

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

  if (!apiKey || !entitySecret) {
    console.error('❌ Error: CIRCLE_API_KEY and CIRCLE_ENTITY_SECRET must be defined in .env.local');
    process.exit(1);
  }

  // 1. Fetch Public Key from Circle
  console.log('[Step 1] Fetching Public Key...');
  const apiHost = 'api.circle.com'; // Verified active host from check-circle.js
  
  const pubKeyOptions = {
    hostname: apiHost,
    path: '/v1/w3s/config/entity/publicKey',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'User-Agent': 'StableBonds-Relayer/1.0.0'
    }
  };

  let publicKeyPem = null;
  try {
    const { statusCode, body } = await makeRequest(pubKeyOptions);
    if (statusCode === 200 && body.data?.publicKey) {
      publicKeyPem = body.data.publicKey;
      console.log('✅ Public Key fetched successfully.\n');
    } else {
      console.error(`❌ Failed to fetch public key. Status: ${statusCode}`, body);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error connecting to Circle API:', err.message);
    process.exit(1);
  }

  // 2. Create Wallet Set
  console.log('[Step 2] Creating Wallet Set...');
  const walletSetName = `StableBonds Set ${Date.now()}`;
  const walletSetCiphertext = encryptEntitySecret(publicKeyPem, entitySecret);
  const walletSetIdempotencyKey = crypto.randomUUID();

  const createSetOptions = {
    hostname: apiHost,
    path: '/v1/w3s/developer/walletSets',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'StableBonds-Relayer/1.0.0'
    }
  };

  const walletSetPayload = {
    idempotencyKey: walletSetIdempotencyKey,
    name: walletSetName,
    entitySecretCiphertext: walletSetCiphertext
  };

  let walletSetId = null;
  try {
    const { statusCode, body } = await makeRequest(createSetOptions, walletSetPayload);
    if (statusCode === 201 || statusCode === 200) {
      walletSetId = body.data?.walletSet?.id;
      console.log(`✅ Wallet Set Created successfully.`);
      console.log(`   - ID: ${walletSetId}`);
      console.log(`   - Name: ${walletSetName}\n`);
    } else {
      console.error(`❌ Failed to create Wallet Set. Status: ${statusCode}`, body);
      process.exit(1);
    }
  } catch (err) {
    console.error('❌ Error creating Wallet Set:', err.message);
    process.exit(1);
  }

  // 3. Create Wallet on ARC-TESTNET
  console.log('[Step 3] Creating Developer-Controlled Wallet on ARC-TESTNET...');
  // A fresh encrypted ciphertext is required for this new request
  const walletCiphertext = encryptEntitySecret(publicKeyPem, entitySecret);
  const walletIdempotencyKey = crypto.randomUUID();

  const createWalletOptions = {
    hostname: apiHost,
    path: '/v1/w3s/developer/wallets',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'StableBonds-Relayer/1.0.0'
    }
  };

  const walletPayload = {
    idempotencyKey: walletIdempotencyKey,
    blockchains: ['ARC-TESTNET'],
    entitySecretCiphertext: walletCiphertext,
    walletSetId: walletSetId,
    count: 1
  };

  try {
    const { statusCode, body } = await makeRequest(createWalletOptions, walletPayload);
    if (statusCode === 201 || statusCode === 200) {
      const wallets = body.data?.wallets || [];
      if (wallets.length > 0) {
        const wallet = wallets[0];
        console.log(`✅ Developer Controlled Wallet Created!`);
        console.log(`   - Wallet ID: ${wallet.id}`);
        console.log(`   - Address: ${wallet.address}`);
        console.log(`   - Blockchain: ${wallet.blockchain}\n`);

        // 4. Save to .env.local
        const envFilePath = path.resolve(process.cwd(), '.env.local');
        let envContent = fs.readFileSync(envFilePath, 'utf8');

        if (envContent.includes('CIRCLE_WALLET_ID=')) {
          envContent = envContent.replace(/CIRCLE_WALLET_ID=.*/, `CIRCLE_WALLET_ID=${wallet.id}`);
        } else {
          envContent += `\nCIRCLE_WALLET_ID=${wallet.id}\n`;
        }

        fs.writeFileSync(envFilePath, envContent, 'utf8');
        console.log(`✅ Auto-saved CIRCLE_WALLET_ID to .env.local!\n`);

        console.log('==================================================');
        console.log('   Wallet Generation Success (COMPLETED)          ');
        console.log('==================================================');
      } else {
        console.error('❌ Wallet creation succeeded but no wallets were returned in the response.');
      }
    } else {
      console.error(`❌ Failed to create wallet. Status: ${statusCode}`, body);
    }
  } catch (err) {
    console.error('❌ Error creating wallet:', err.message);
  }
}

createWalletFlow();
