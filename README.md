# SentinelAuth Node.js SDK

Official Node.js SDK for **[SentinelAuth](https://sentinelauth.com.au)** — Developer-first Two-Factor Authentication (2FA), Multi-Factor Authentication (MFA), SMS OTP, Email Verification, and TOTP Authenticator APIs designed for Australia and global applications.

[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/sentinelauth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)
[![Website](https://img.shields.io/badge/website-sentinelauth.com.au-blue)](https://sentinelauth.com.au)
[![Documentation](https://img.shields.io/badge/docs-sentinelauth.com.au%2Fdocs-purple)](https://sentinelauth.com.au/docs/)

---

## Features

- ⚡ **Zero External Dependencies** — Ultra-lightweight; runs natively on Node.js 14+ with built-in HTTP/Fetch engine.
- 📱 **SMS OTP Verification** — Low-latency SMS delivery with automatic Australian number formatting (`+614...` or `04...`).
- 📧 **Email OTP Verification** — High-deliverability transactional verification emails.
- 🔐 **TOTP / 2FA Authenticator Support** — Enroll and verify Google Authenticator, Microsoft Authenticator, and Authy factors with QR code generation.
- 🛡️ **Zero-Plaintext Security** — Cryptographically hashed tokens; raw verification codes are never stored in databases.
- 📘 **TypeScript Ready** — Includes complete TypeScript type declarations (`index.d.ts`) out of the box.

---

## Installation

Install via npm:

```bash
npm install sentinelauth
```

Or via Yarn / pnpm:

```bash
yarn add sentinelauth
# or
pnpm add sentinelauth
```

---

## Quick Start

### 1. Initialize Client

Obtain your API key from the **[SentinelAuth Developer Dashboard](https://sentinelauth.com.au/dashboard/api-keys/)**.

```javascript
const SentinelAuth = require('sentinelauth');

const client = new SentinelAuth('sk_live_your_api_key_here');
```

In TypeScript or ES Modules:

```typescript
import SentinelAuth from 'sentinelauth';

const client = new SentinelAuth(process.env.SENTINELAUTH_API_KEY!);
```

---

### 2. Send an OTP (SMS or Email)

#### Dispatch SMS OTP:
```javascript
async function sendSMS() {
  const result = await client.sendSMS('+61412345678', 'MyCompany');

  console.log('Verification ID:', result.verification_id);
  console.log('Status:', result.status); // 'pending' or 'sent'
  // Save result.verification_id in your user session or database
}
```

#### Dispatch Email OTP:
```javascript
async function sendEmail() {
  const result = await client.sendEmail('alex@company.com', 'MyCompany');
  console.log('Delivered to:', result.destination);
}
```

#### Generic `send()` method:
```javascript
const result = await client.send({
  to: '+61412345678',
  channel: 'sms', // 'sms' | 'email'
  appName: 'SentinelAuth Demo'
});
```

---

### 3. Verify an OTP Code

When the user enters the 6-digit code received on their phone or email:

```javascript
async function verifyCode(verificationId, enteredCode) {
  try {
    const result = await client.verifyOTP({
      verificationId: verificationId,
      code: enteredCode
    });

    if (result.verified) {
      console.log('✅ User successfully authenticated!');
    }
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}
```

---

### 4. TOTP Authenticator (Google / Microsoft Authenticator)

#### Step A: Enroll a Factor & Show QR Code
```javascript
const factor = await client.enrollTOTP({
  userIdentifier: 'usr_100234',
  accountName: 'alex@example.com',
  issuer: 'MyCompany 2FA'
});

console.log('Factor ID:', factor.factor_id);
console.log('QR Code URL for User:', factor.qr_code_url);
console.log('Manual Secret Key:', factor.secret);
```

#### Step B: Verify TOTP Rolling Code
```javascript
const verification = await client.verifyTOTP({
  factorId: factor.factor_id, // or 'usr_100234'
  code: '849201' // 6 digits from authenticator app
});

if (verification.verified) {
  console.log('✅ TOTP 2FA code is valid!');
}
```

---

### 5. Check API Quota & Usage

```javascript
const quota = await client.getQuota();
console.log(`Plan: ${quota.plan}`);
console.log(`Used: ${quota.used} / ${quota.monthly_limit} requests`);
console.log(`Remaining: ${quota.remaining}`);
```

---

## Error Handling

All API errors throw `SentinelAuthError` containing HTTP status code and response payload:

```javascript
try {
  await client.sendSMS('invalid-number');
} catch (error) {
  console.error('Error Code:', error.statusCode); // e.g. 400
  console.error('Message:', error.message);
  console.error('Details:', error.data);
}
```

---

## Client Options

```javascript
const client = new SentinelAuth('sk_live_...', {
  timeout: 10000, // Timeout in ms (default: 15000)
  baseUrl: 'https://sentinelauth.com.au/wp-json/sentinelauth/v1' // Optional custom gateway
});
```

---

## Links & Resources

- **Website:** [https://sentinelauth.com.au](https://sentinelauth.com.au)
- **API Documentation:** [https://sentinelauth.com.au/docs/](https://sentinelauth.com.au/docs/)
- **Dashboard & API Keys:** [https://sentinelauth.com.au/dashboard/api-keys/](https://sentinelauth.com.au/dashboard/api-keys/)
- **Interactive Sandbox & Testing:** [https://sentinelauth.com.au/dashboard/test-api/](https://sentinelauth.com.au/dashboard/test-api/)
- **GitHub Organization:** [https://github.com/SentinelAuth12](https://github.com/SentinelAuth12)

---

## License

MIT License © 2026 SentinelAuth. Built for developers.
