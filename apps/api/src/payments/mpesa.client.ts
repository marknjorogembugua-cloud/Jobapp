import { Injectable, Logger, ServiceUnavailableException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

interface StkPushResult {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

/**
 * Thin wrapper around Safaricom's Daraja API (OAuth + Lipa Na M-Pesa Online /
 * STK Push). Needs MPESA_* env vars (see .env.example) from a Daraja sandbox
 * or production app — none are provisioned in this dev environment, so this
 * is unverified against the real API.
 */
@Injectable()
export class MpesaClient {
  private readonly logger = new Logger(MpesaClient.name);
  private cachedToken: { value: string; expiresAt: number } | null = null;

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get<string>("MPESA_ENV") === "production"
      ? "https://api.safaricom.co.ke"
      : "https://sandbox.safaricom.co.ke";
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.value;
    }

    const consumerKey = this.config.get<string>("MPESA_CONSUMER_KEY");
    const consumerSecret = this.config.get<string>("MPESA_CONSUMER_SECRET");
    const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

    const response = await fetch(`${this.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: { Authorization: `Basic ${credentials}` },
    });
    if (!response.ok) {
      this.logger.error(`M-Pesa OAuth failed: ${response.status} ${await response.text()}`);
      throw new ServiceUnavailableException("Could not authenticate with M-Pesa");
    }
    const body = (await response.json()) as { access_token: string; expires_in: string };
    this.cachedToken = {
      value: body.access_token,
      expiresAt: Date.now() + (Number(body.expires_in) - 60) * 1000,
    };
    return body.access_token;
  }

  private timestamp(): string {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return (
      `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
    );
  }

  async stkPush(params: { phone: string; amount: number; accountReference: string }): Promise<StkPushResult> {
    const shortcode = this.config.get<string>("MPESA_SHORTCODE");
    const passkey = this.config.get<string>("MPESA_PASSKEY");
    const callbackUrl = this.config.get<string>("MPESA_CALLBACK_URL");
    const timestamp = this.timestamp();
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
    const accessToken = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/mpesa/stkpush/v1/processrequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: Math.round(params.amount),
        PartyA: params.phone,
        PartyB: shortcode,
        PhoneNumber: params.phone,
        CallBackURL: callbackUrl,
        AccountReference: params.accountReference.slice(0, 12),
        TransactionDesc: "Amon booking payment",
      }),
    });

    const body = await response.json();
    if (!response.ok) {
      this.logger.error(`M-Pesa STK push failed: ${response.status} ${JSON.stringify(body)}`);
      throw new ServiceUnavailableException("Could not start M-Pesa payment");
    }
    return body as StkPushResult;
  }
}
