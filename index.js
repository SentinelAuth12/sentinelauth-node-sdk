'use strict';

const https = require('https');
const { URL } = require('url');

/**
 * Custom Error for SentinelAuth API exceptions
 */
class SentinelAuthError extends Error {
  constructor(message, statusCode = 500, data = null) {
    super(message);
    this.name = 'SentinelAuthError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

/**
 * SentinelAuth Official Node.js SDK
 */
class SentinelAuth {
  /**
   * Initialize SentinelAuth client
   * @param {string} apiKey - Your SentinelAuth API Secret Key (e.g. sk_live_... or sk_test_...)
   * @param {Object} [options] - Optional configurations
   * @param {string} [options.baseUrl] - Custom API base URL
   * @param {number} [options.timeout] - Request timeout in ms (default: 15000)
   */
  constructor(apiKey, options = {}) {
    if (!apiKey || typeof apiKey !== 'string') {
      throw new SentinelAuthError('Missing or invalid SentinelAuth API key. Pass your secret key to constructor.');
    }

    this.apiKey = apiKey.trim();
    this.baseUrl = (options.baseUrl || 'https://sentinelauth.com.au/wp-json/sentinelauth/v1').replace(/\/+$/, '');
    this.timeout = options.timeout || 15000;
  }

  /**
   * Internal HTTP request helper (zero external dependencies)
   * @private
   */
  async _request(method, path, body = null) {
    const fullUrl = new URL(this.baseUrl + (path.startsWith('/') ? path : '/' + path));

    // Prefer native fetch if available (Node 18+)
    if (typeof globalThis.fetch === 'function') {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), this.timeout) : null;

      try {
        const fetchOptions = {
          method,
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'SentinelAuth-NodeSDK/1.0.0'
          },
          signal: controller ? controller.signal : undefined
        };

        if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
          fetchOptions.body = JSON.stringify(body);
        }

        const res = await globalThis.fetch(fullUrl.toString(), fetchOptions);
        const text = await res.text();

        let json = {};
        try {
          json = text ? JSON.parse(text) : {};
        } catch (e) {
          json = { message: text };
        }

        if (!res.ok) {
          const errCode = json.code || json.error || 'api_error';
          const errMsg = json.message || `Request failed with status ${res.status}`;
          throw new SentinelAuthError(errMsg, res.status, json);
        }

        return json;
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    }

    // Fallback: Node.js native https module
    return new Promise((resolve, reject) => {
      const payloadStr = body ? JSON.stringify(body) : null;
      const reqOptions = {
        hostname: fullUrl.hostname,
        port: fullUrl.port || 443,
        path: fullUrl.pathname + fullUrl.search,
        method: method.toUpperCase(),
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'SentinelAuth-NodeSDK/1.0.0',
          ...(payloadStr ? { 'Content-Length': Buffer.byteLength(payloadStr) } : {})
        },
        timeout: this.timeout
      };

      const req = https.request(reqOptions, (res) => {
        let rawData = '';
        res.setEncoding('utf8');
        res.on('data', chunk => { rawData += chunk; });
        res.on('end', () => {
          let json = {};
          try {
            json = rawData ? JSON.parse(rawData) : {};
          } catch (e) {
            json = { message: rawData };
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json);
          } else {
            const errMsg = json.message || `Request failed with status ${res.statusCode}`;
            reject(new SentinelAuthError(errMsg, res.statusCode, json));
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new SentinelAuthError(`Request timed out after ${this.timeout}ms`, 408));
      });

      req.on('error', (err) => {
        reject(new SentinelAuthError(err.message, 500, err));
      });

      if (payloadStr) {
        req.write(payloadStr);
      }
      req.end();
    });
  }

  /**
   * Dispatch a one-time verification code via SMS or Email
   * @param {Object} params
   * @param {string} params.to - Mobile number (+614... or 04...) or Email address
   * @param {'sms'|'email'} [params.channel='sms'] - Delivery channel
   * @param {string} [params.appName] - Optional branding name
   * @returns {Promise<Object>}
   */
  async sendOTP({ to, channel = 'sms', appName } = {}) {
    if (!to) {
      throw new SentinelAuthError('Recipient destination (to) is required.');
    }

    const payload = {
      to,
      channel: channel.toLowerCase()
    };
    if (appName) payload.app_name = appName;

    return this._request('POST', '/send-otp', payload);
  }

  /**
   * Alias for sendOTP
   */
  async send(params) {
    return this.sendOTP(params);
  }

  /**
   * Shorthand to send an SMS verification code
   * @param {string} to - Destination mobile number (E.164 format or Australian local format)
   * @param {string} [appName] - Optional branding name
   */
  async sendSMS(to, appName) {
    return this.sendOTP({ to, channel: 'sms', appName });
  }

  /**
   * Shorthand to send an Email verification code
   * @param {string} to - Destination email address
   * @param {string} [appName] - Optional branding name
   */
  async sendEmail(to, appName) {
    return this.sendOTP({ to, channel: 'email', appName });
  }

  /**
   * Verify a submitted OTP code
   * @param {Object} params
   * @param {string} params.verificationId - Verification ID returned from sendOTP
   * @param {string} params.code - 6-digit verification code entered by user
   * @returns {Promise<Object>}
   */
  async verifyOTP({ verificationId, code } = {}) {
    if (!verificationId) {
      throw new SentinelAuthError('verificationId is required to verify OTP.');
    }
    if (!code) {
      throw new SentinelAuthError('Verification code is required.');
    }

    return this._request('POST', '/verify-otp', {
      verification_id: verificationId,
      code: String(code).trim()
    });
  }

  /**
   * Alias for verifyOTP
   */
  async verify(params) {
    return this.verifyOTP(params);
  }

  /**
   * Enroll a new TOTP 2FA Factor (Authenticator App)
   * @param {Object} params
   * @param {string} params.userIdentifier - Unique identifier for end-user (e.g. user_id or email)
   * @param {string} [params.accountName] - Display label in authenticator app
   * @param {string} [params.issuer] - Company or application issuer name
   * @returns {Promise<Object>} Includes factor_id, secret, qr_code_url, and otpauth_url
   */
  async enrollTOTP({ userIdentifier, accountName, issuer } = {}) {
    if (!userIdentifier) {
      throw new SentinelAuthError('userIdentifier is required to enroll a TOTP factor.');
    }

    const payload = {
      user_identifier: userIdentifier
    };
    if (accountName) payload.account_name = accountName;
    if (issuer) payload.issuer = issuer;

    return this._request('POST', '/totp/enroll', payload);
  }

  /**
   * Verify a 6-digit rolling TOTP code from an authenticator app
   * @param {Object} params
   * @param {string} params.factorId - Factor ID (e.g. totp_fac_...) or user identifier
   * @param {string} params.code - 6-digit rolling code from authenticator app
   * @returns {Promise<Object>}
   */
  async verifyTOTP({ factorId, code } = {}) {
    if (!factorId) {
      throw new SentinelAuthError('factorId is required to verify TOTP code.');
    }
    if (!code) {
      throw new SentinelAuthError('6-digit code is required.');
    }

    return this._request('POST', '/totp/verify', {
      factor_id: factorId,
      code: String(code).trim()
    });
  }

  /**
   * Fetch remaining monthly API quota and rate limits
   * @returns {Promise<Object>}
   */
  async getQuota() {
    return this._request('GET', '/quota');
  }
}

module.exports = SentinelAuth;
module.exports.SentinelAuth = SentinelAuth;
module.exports.SentinelAuthError = SentinelAuthError;
module.exports.default = SentinelAuth;
