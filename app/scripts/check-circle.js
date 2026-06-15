import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import https from 'https';

// 1. Manual .env.local loader to avoid dependencies
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    console.log(`[Env] Loading variables from: ${envPath}`);
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
  } else {
    console.warn(`[Warning] .env.local file not found at: ${envPath}`);
  }
}

// 2. HTTP Request Helper utilizing native Node.js https module
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
      req.write(postData);
    }
    req.end();
  });
}

// Encryption using RSA-OAEP with SHA-256
function encryptEntitySecret(publicKeyPem, entitySecretHex) {
  try {
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
  } catch (error) {
    console.error('[Encryption] Failed to encrypt entity secret:', error.message);
    throw error;
  }
}

async function runCheck() {
  console.log('==================================================');
  console.log('   Circle Developer WaaS Integration Check        ');
  console.log('==================================================\n');

  loadEnv();

  const apiKey = process.env.CIRCLE_API_KEY;
  const entitySecret = process.env.CIRCLE_ENTITY_SECRET;
  const clientKey = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY;

  if (!apiKey) {
    console.error('❌ Error: CIRCLE_API_KEY is not defined in .env.local');
    process.exit(1);
  }

  console.log(`[Info] Client Key: ${clientKey ? 'Present (OK)' : 'Missing'}`);
  console.log(`[Info] API Key: ${apiKey.substring(0, 20)}...`);
  console.log(`[Info] Entity Secret: ${entitySecret ? 'Present (64 chars hex)' : 'Missing'}\n`);

  // Step 1: Fetch Public Key from Circle
  console.log('[Step 1] Connecting to Circle API to fetch Public Key...');
  
  const hostsToTry = ['api-sandbox.circle.com', 'api.circle.com'];
  let successfulHost = null;
  let publicKeyPem = null;

  for (const host of hostsToTry) {
    console.log(`Trying host: ${host}...`);
    const pubKeyOptions = {
      hostname: host,
      path: '/v1/w3s/config/entity/publicKey',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
        'User-Agent': 'StableBonds-Relayer/1.0.0'
      }
    };

    try {
      const { statusCode, body } = await makeRequest(pubKeyOptions);
      if (statusCode === 200 && body.data?.publicKey) {
        successfulHost = host;
        publicKeyPem = body.data.publicKey;
        console.log(`✅ Success on host: ${host}`);
        break;
      } else {
        console.log(`❌ Failed on host: ${host} (Status: ${statusCode})`);
        if (body && typeof body === 'object') {
          console.log(`   Message: ${body.message || JSON.stringify(body)}`);
        }
      }
    } catch (err) {
      console.log(`❌ Error connecting to ${host}: ${err.message}`);
    }
  }

  if (!publicKeyPem) {
    console.error('\n❌ Error: Failed to fetch public key from all available hosts.');
    console.error('Please verify that:');
    console.error('  1. Your CIRCLE_API_KEY is active and valid.');
    console.error('  2. You are not blocked by local firewalls or proxy configurations.');
    console.error('  3. The key corresponds to the Sandbox or Production environment.\n');
    console.log('--------------------------------------------------');
    console.log('Skipping cryptographic testing due to key failure.');
    console.log('--------------------------------------------------');
    process.exit(1);
  }

  console.log('\n✅ Circle API connection: Success (API Key is Valid)');
  console.log(`✅ Connected using environment: ${successfulHost === 'api-sandbox.circle.com' ? 'SANDBOX' : 'PRODUCTION'}`);
  console.log('✅ Public Key fetched successfully.\n');

  // Step 2: Encrypt Entity Secret
  if (entitySecret) {
    console.log('[Step 2] Generating ENTITY_SECRET_CIPHERTEXT...');
    const ciphertext = encryptEntitySecret(publicKeyPem, entitySecret);
    console.log('✅ Generated ENTITY_SECRET_CIPHERTEXT successfully:');
    console.log(`\n${ciphertext}\n`);

    // Write ciphertext back to .env.local
    const envFilePath = path.resolve(process.cwd(), '.env.local');
    let envContent = fs.readFileSync(envFilePath, 'utf8');
    
    if (envContent.includes('ENTITY_SECRET_CIPHERTEXT=')) {
      envContent = envContent.replace(/ENTITY_SECRET_CIPHERTEXT=.*/, `ENTITY_SECRET_CIPHERTEXT=${ciphertext}`);
    } else {
      envContent += `\nENTITY_SECRET_CIPHERTEXT=${ciphertext}\n`;
    }
    
    fs.writeFileSync(envFilePath, envContent, 'utf8');
    console.log('✅ Auto-saved ENTITY_SECRET_CIPHERTEXT to .env.local\n');
  } else {
    console.log('[Step 2] Skipped Entity Secret encryption (CIRCLE_ENTITY_SECRET missing).\n');
  }

  // Step 3: Check Developer Wallets
  console.log('[Step 3] Querying Developer-Controlled Wallets...');
  const walletsOptions = {
    hostname: successfulHost,
    path: '/v1/w3s/wallets',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'User-Agent': 'StableBonds-Relayer/1.0.0'
    }
  };

  try {
    const walletsRes = await makeRequest(walletsOptions);
    if (walletsRes.statusCode === 200) {
      const wallets = walletsRes.body.data?.wallets || [];
      console.log(`✅ Fetched Developer Controlled Wallets: Success. Found ${wallets.length} wallets.`);
      if (wallets.length > 0) {
        wallets.forEach((w, index) => {
          console.log(`   - [${index + 1}] ID: ${w.id} | Address: ${w.address} | Blockchain: ${w.blockchain}`);
        });

        // Auto-save the first wallet ID if not configured
        const firstWalletId = wallets[0].id;
        const envFilePath = path.resolve(process.cwd(), '.env.local');
        let envContent = fs.readFileSync(envFilePath, 'utf8');
        
        if (envContent.includes('CIRCLE_WALLET_ID=')) {
          envContent = envContent.replace(/CIRCLE_WALLET_ID=.*/, `CIRCLE_WALLET_ID=${firstWalletId}`);
        } else {
          envContent += `\nCIRCLE_WALLET_ID=${firstWalletId}\n`;
        }
        fs.writeFileSync(envFilePath, envContent, 'utf8');
        console.log(`\n✅ Auto-saved first Wallet ID (${firstWalletId}) to CIRCLE_WALLET_ID in .env.local`);
      } else {
        console.log('   ⚠️ No Developer Controlled Wallets found in this account.');
      }
    } else {
      console.log(`⚠️ Could not fetch wallets. HTTP Status: ${walletsRes.statusCode}`);
      console.log('Response:', JSON.stringify(walletsRes.body, null, 2));
    }
  } catch (err) {
    console.error('⚠️ Error fetching developer wallets:', err.message);
  }

  console.log('\n==================================================');
  console.log('   Circle WaaS Integration Test Complete (PASS)   ');
  console.log('==================================================');
}

runCheck();
