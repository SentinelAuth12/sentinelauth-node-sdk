/**
 * SentinelAuth Node.js SDK Quickstart Example
 *
 * Run: node examples/quickstart.js
 */

const SentinelAuth = require('../index');

// Replace with your API key from https://sentinelauth.com.au/dashboard/api-keys/
const apiKey = process.env.SENTINELAUTH_API_KEY || 'sk_test_demo_key';

const client = new SentinelAuth(apiKey);

async function main() {
  try {
    console.log('--- 1. Send SMS OTP ---');
    const smsResult = await client.sendSMS('+61412345678', 'MyCompany');
    console.log('SMS Dispatch Response:', smsResult);

    // console.log('\n--- 2. Verify SMS OTP ---');
    // const verifyResult = await client.verifyOTP({
    //   verificationId: smsResult.verification_id,
    //   code: '123456'
    // });
    // console.log('Verification Response:', verifyResult);

    console.log('\n--- 3. Enroll 2FA / TOTP Factor ---');
    const totpEnroll = await client.enrollTOTP({
      userIdentifier: 'usr_sample_1001',
      accountName: 'alex@example.com',
      issuer: 'SentinelAuth Demo'
    });
    console.log('TOTP Factor Enrolled:', {
      factor_id: totpEnroll.factor_id,
      qr_code_url: totpEnroll.qr_code_url
    });

    console.log('\n--- 4. Check API Quota ---');
    const quota = await client.getQuota();
    console.log('Quota status:', quota);

  } catch (error) {
    console.error('Error occurred:', error.statusCode, error.message);
  }
}

main();
