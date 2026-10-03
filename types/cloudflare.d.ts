declare namespace Cloudflare {
  interface Env {
    STRIPE_SECRET_KEY?: string;
    STRIPE_PRICE_ID?: string;
    STRIPE_PRICE_ID_PT?: string;
    STRIPE_PRICE_ID_ES?: string;
    STRIPE_PRICE_ID_RU?: string;
    STRIPE_PRICE_ID_ZH?: string;
    STRIPE_WEBHOOK_SECRET?: string;
    REPORT_ENCRYPTION_KEY?: string;
    PUBLIC_BASE_URL?: string;
    REPORT_FROM_EMAIL?: string;
    RESEND_API_KEY?: string;
  }
}
