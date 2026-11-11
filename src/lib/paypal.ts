// Server-only PayPal REST helpers.
// Intentionally NOT a "use server" module: nothing here may be callable from the browser.

export interface PaypalAmount {
  currency_code?: string;
  value?: string;
}

export interface PaypalCapture {
  id?: string;
  status?: string;
  amount?: PaypalAmount;
}

export interface PaypalPurchaseUnitResponse {
  reference_id?: string;
  custom_id?: string;
  amount?: PaypalAmount;
  payments?: { captures?: PaypalCapture[] };
}

export interface PaypalOrderResponse {
  id?: string;
  status?: string;
  debug_id?: string;
  name?: string;
  message?: string;
  details?: Array<{
    issue?: string;
    description?: string;
    field?: string;
  }>;
  purchase_units?: PaypalPurchaseUnitResponse[];
  [key: string]: unknown;
}

export interface PaypalResult {
  ok: boolean;
  status: number;
  data: PaypalOrderResponse;
  /** Set when no request was sent because PayPal auth failed. */
  tokenError?: boolean;
}

export const generateAccessToken = async (): Promise<string | null> => {
  const paypal_id = process.env.NEXT_PUBLIC_PAYPAL_ID as string;
  const paypal_secret = process.env.PAYPAL_KEY as string;

  try {
    const auth = Buffer.from(paypal_id + ":" + paypal_secret).toString(
      "base64",
    );
    const response = await fetch(`${process.env.PAYPAL_BASE}/v1/oauth2/token`, {
      method: "POST",
      body: "grant_type=client_credentials",
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    if (!response.ok) {
      console.error("[PayPal] token request failed:", response.status);
      return null;
    }
    const data = await response.json();
    return typeof data.access_token === "string" ? data.access_token : null;
  } catch (error) {
    console.error("Failed to generate Access Token:", error);
    return null;
  }
};

const paypalRequest = async (
  path: string,
  init: { method: "GET" | "POST"; body?: unknown; requestId?: string },
): Promise<PaypalResult> => {
  const accessToken = await generateAccessToken();
  if (!accessToken) {
    return {
      ok: false,
      status: 503,
      data: { message: "Invalid Token" },
      tokenError: true,
    };
  }

  const response = await fetch(`${process.env.PAYPAL_BASE}${path}`, {
    method: init.method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      // Makes retried POSTs idempotent on PayPal's side.
      ...(init.requestId ? { "PayPal-Request-Id": init.requestId } : {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });

  const data = (await response.json().catch(() => ({}))) as PaypalOrderResponse;
  return { ok: response.ok, status: response.status, data };
};

export const createPaypalCheckoutOrder = (payload: unknown) =>
  paypalRequest("/v2/checkout/orders", { method: "POST", body: payload });

export const getPaypalOrder = (paypalOrderId: string) =>
  paypalRequest(`/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}`, {
    method: "GET",
  });

export const capturePaypalOrder = (paypalOrderId: string, requestId: string) =>
  paypalRequest(
    `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    { method: "POST", requestId },
  );

/** True when a PayPal amount equals the expected value and currency. */
export const paypalAmountMatches = (
  actual: PaypalAmount | undefined,
  expected: { currency_code: string; value: string },
): boolean => {
  if (!actual?.value || !actual.currency_code) return false;
  if (actual.currency_code !== expected.currency_code) return false;
  const a = Number(actual.value);
  const e = Number(expected.value);
  return (
    Number.isFinite(a) && Number.isFinite(e) && a.toFixed(2) === e.toFixed(2)
  );
};

export interface PaypalWebhookEvent {
  id?: string;
  event_type?: string;
  resource_type?: string;
  resource?: {
    id?: string;
    status?: string;
    custom_id?: string;
    supplementary_data?: { related_ids?: { order_id?: string } };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * Ask PayPal whether a webhook delivery is genuine.
 * Fails closed: any missing header, missing PAYPAL_WEBHOOK_ID or PayPal error
 * returns false.
 */
export const verifyWebhookSignature = async (
  headers: Headers,
  event: PaypalWebhookEvent,
): Promise<boolean> => {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    console.error("[PayPal] PAYPAL_WEBHOOK_ID is not set");
    return false;
  }

  const auth_algo = headers.get("paypal-auth-algo");
  const cert_url = headers.get("paypal-cert-url");
  const transmission_id = headers.get("paypal-transmission-id");
  const transmission_sig = headers.get("paypal-transmission-sig");
  const transmission_time = headers.get("paypal-transmission-time");
  if (
    !auth_algo ||
    !cert_url ||
    !transmission_id ||
    !transmission_sig ||
    !transmission_time
  ) {
    return false;
  }

  try {
    const result = await paypalRequest(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: {
          auth_algo,
          cert_url,
          transmission_id,
          transmission_sig,
          transmission_time,
          webhook_id: webhookId,
          webhook_event: event,
        },
      },
    );
    return result.ok && result.data.verification_status === "SUCCESS";
  } catch (error) {
    console.error("[PayPal] webhook verification error:", error);
    return false;
  }
};
