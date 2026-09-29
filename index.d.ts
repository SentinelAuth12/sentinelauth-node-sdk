export interface SentinelAuthOptions {
  baseUrl?: string;
  timeout?: number;
}

export interface SendOTPOptions {
  to: string;
  channel?: 'sms' | 'email';
  appName?: string;
}

export interface SendOTPResponse {
  success: boolean;
  message?: string;
  verification_id?: string;
  channel?: 'sms' | 'email';
  destination?: string;
  status?: string;
  expires_in?: number;
  quota?: {
    used: number;
    limit: number;
    remaining: number;
  };
}

export interface VerifyOTPOptions {
  verificationId: string;
  code: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  verified: boolean;
  message?: string;
  verification_id?: string;
  channel?: string;
  response_time_ms?: number;
}

export interface EnrollTOTPOptions {
  userIdentifier: string;
  accountName?: string;
  issuer?: string;
}

export interface EnrollTOTPResponse {
  success: boolean;
  factor_id: string;
  user_identifier: string;
  secret: string;
  qr_code_url: string;
  otpauth_url: string;
  status: string;
}

export interface VerifyTOTPOptions {
  factorId: string;
  code: string;
}

export interface VerifyTOTPResponse {
  success: boolean;
  verified: boolean;
  factor_id: string;
  message?: string;
}

export interface QuotaResponse {
  success: boolean;
  plan: string;
  monthly_limit: number;
  used: number;
  remaining: number;
  reset_date: string;
}

export class SentinelAuthError extends Error {
  statusCode: number;
  data: any;
  constructor(message: string, statusCode?: number, data?: any);
}

export class SentinelAuth {
  constructor(apiKey: string, options?: SentinelAuthOptions);

  sendOTP(params: SendOTPOptions): Promise<SendOTPResponse>;
  send(params: SendOTPOptions): Promise<SendOTPResponse>;
  sendSMS(to: string, appName?: string): Promise<SendOTPResponse>;
  sendEmail(to: string, appName?: string): Promise<SendOTPResponse>;

  verifyOTP(params: VerifyOTPOptions): Promise<VerifyOTPResponse>;
  verify(params: VerifyOTPOptions): Promise<VerifyOTPResponse>;

  enrollTOTP(params: EnrollTOTPOptions): Promise<EnrollTOTPResponse>;
  verifyTOTP(params: VerifyTOTPOptions): Promise<VerifyTOTPResponse>;

  getQuota(): Promise<QuotaResponse>;
}

export default SentinelAuth;
