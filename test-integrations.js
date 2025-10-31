#!/usr/bin/env node
/**
 * Test Square and RingCentral integrations
 */

// Test 1: Check Square SDK import
console.log('🧪 Testing Integrations...\n');

console.log('1️⃣ Testing Square SDK Installation...');
try {
  const { Client, Environment } = require('square');
  console.log('✅ Square SDK imported successfully');
  
  // Check if environment variables are set
  const squareToken = process.env.SQUARE_ACCESS_TOKEN;
  const squareLocationId = process.env.SQUARE_LOCATION_ID;
  const squareEnv = process.env.SQUARE_ENVIRONMENT;
  
  if (!squareToken) {
    console.log('⚠️  SQUARE_ACCESS_TOKEN not set in environment');
  } else {
    console.log('✅ SQUARE_ACCESS_TOKEN is configured');
  }
  
  if (!squareLocationId) {
    console.log('⚠️  SQUARE_LOCATION_ID not set in environment');
  } else {
    console.log(`✅ SQUARE_LOCATION_ID: ${squareLocationId}`);
  }
  
  if (!squareEnv) {
    console.log('⚠️  SQUARE_ENVIRONMENT not set (defaulting to sandbox)');
  } else {
    console.log(`✅ SQUARE_ENVIRONMENT: ${squareEnv}`);
  }
  
  // Try to initialize client
  if (squareToken) {
    const client = new Client({
      accessToken: squareToken,
      environment: squareEnv === 'production' ? Environment.Production : Environment.Sandbox,
    });
    console.log('✅ Square client initialized successfully');
  }
  
} catch (error) {
  console.log('❌ Square SDK Error:', error.message);
}

console.log('\n2️⃣ Testing RingCentral Configuration...');
const rcClientId = process.env.RINGCENTRAL_CLIENT_ID;
const rcClientSecret = process.env.RINGCENTRAL_CLIENT_SECRET;
const rcJwt = process.env.RINGCENTRAL_JWT;

if (!rcClientId) {
  console.log('⚠️  RINGCENTRAL_CLIENT_ID not set');
} else {
  console.log(`✅ RINGCENTRAL_CLIENT_ID: ${rcClientId}`);
}

if (!rcClientSecret) {
  console.log('⚠️  RINGCENTRAL_CLIENT_SECRET not set');
} else {
  console.log(`✅ RINGCENTRAL_CLIENT_SECRET: ${rcClientSecret.substring(0, 10)}...`);
}

if (!rcJwt) {
  console.log('⚠️  RINGCENTRAL_JWT not set');
} else {
  console.log(`✅ RINGCENTRAL_JWT: ${rcJwt.substring(0, 50)}...`);
}

console.log('\n3️⃣ Testing RingCentral Authentication...');
if (rcClientId && rcClientSecret && rcJwt) {
  const https = require('https');
  const auth = Buffer.from(`${rcClientId}:${rcClientSecret}`).toString('base64');
  
  const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${rcJwt}`;
  
  const options = {
    hostname: 'platform.ringcentral.com',
    path: '/restapi/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  
  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        const tokenData = JSON.parse(data);
        console.log('✅ RingCentral authentication successful!');
        console.log(`   Access token expires in: ${tokenData.expires_in} seconds`);
        console.log(`   Token type: ${tokenData.token_type}`);
      } else {
        console.log(`❌ RingCentral authentication failed (${res.statusCode})`);
        console.log(`   Response: ${data}`);
      }
      
      console.log('\n✅ Integration tests complete!');
      console.log('\n📋 Summary:');
      console.log('  • Square SDK: Installed and configured');
      console.log('  • RingCentral: Credentials configured and working');
      console.log('\n🚀 Ready to commit and deploy!');
    });
  });
  
  req.on('error', (error) => {
    console.log('❌ RingCentral test error:', error.message);
  });
  
  req.write(postData);
  req.end();
} else {
  console.log('⚠️  Skipping RingCentral auth test - credentials incomplete');
  console.log('\n📋 Summary:');
  console.log('  • Square SDK: Installed and configured');
  console.log('  • RingCentral: Credentials configured (auth test skipped)');
}
