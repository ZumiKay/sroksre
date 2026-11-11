import { paypalAmountMatches, verifyWebhookSignature } from "@/src/lib/paypal";

describe("paypalAmountMatches", () => {
  const expected = { currency_code: "USD", value: "25.00" };

  it("matches equal amounts regardless of formatting", () => {
    expect(
      paypalAmountMatches({ currency_code: "USD", value: "25" }, expected),
    ).toBe(true);
    expect(
      paypalAmountMatches({ currency_code: "USD", value: "25.00" }, expected),
    ).toBe(true);
  });

  it("rejects different value, currency or missing data", () => {
    expect(
      paypalAmountMatches({ currency_code: "USD", value: "24.99" }, expected),
    ).toBe(false);
    expect(
      paypalAmountMatches({ currency_code: "EUR", value: "25.00" }, expected),
    ).toBe(false);
    expect(paypalAmountMatches(undefined, expected)).toBe(false);
    expect(
      paypalAmountMatches({ currency_code: "USD", value: "abc" }, expected),
    ).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  const headers = () =>
    new Headers({
      "paypal-auth-algo": "SHA256withRSA",
      "paypal-cert-url": "https://api.paypal.com/cert",
      "paypal-transmission-id": "tid",
      "paypal-transmission-sig": "sig",
      "paypal-transmission-time": "2026-11-10T00:00:00Z",
    });
  const event = { id: "WH-1", event_type: "CHECKOUT.ORDER.APPROVED" };
  const mockFetch = jest.fn();

  beforeEach(() => {
    mockFetch.mockReset();
    global.fetch = mockFetch;
    process.env.PAYPAL_BASE = "https://api-m.sandbox.paypal.com";
    process.env.PAYPAL_WEBHOOK_ID = "WEBHOOK-1";
  });

  const respond = (body: object, ok = true) =>
    Promise.resolve({
      ok,
      status: ok ? 200 : 400,
      json: () => Promise.resolve(body),
    } as Response);

  it("fails closed when PAYPAL_WEBHOOK_ID is not set", async () => {
    delete process.env.PAYPAL_WEBHOOK_ID;
    await expect(verifyWebhookSignature(headers(), event)).resolves.toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fails closed when PayPal headers are missing", async () => {
    await expect(verifyWebhookSignature(new Headers(), event)).resolves.toBe(
      false,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("accepts only a SUCCESS verification for this webhook ID", async () => {
    mockFetch
      .mockReturnValueOnce(respond({ access_token: "t" }))
      .mockReturnValueOnce(respond({ verification_status: "SUCCESS" }));

    await expect(verifyWebhookSignature(headers(), event)).resolves.toBe(true);

    const [url, init] = mockFetch.mock.calls[1];
    expect(url).toContain("/v1/notifications/verify-webhook-signature");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      webhook_id: "WEBHOOK-1",
      transmission_id: "tid",
      webhook_event: event,
    });
  });

  it("rejects a FAILURE verification", async () => {
    mockFetch
      .mockReturnValueOnce(respond({ access_token: "t" }))
      .mockReturnValueOnce(respond({ verification_status: "FAILURE" }));

    await expect(verifyWebhookSignature(headers(), event)).resolves.toBe(false);
  });
});
