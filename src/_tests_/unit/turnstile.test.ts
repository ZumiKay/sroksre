import { verifyTurnstile } from "@/src/lib/turnstile";

const fetchMock = jest.fn();
global.fetch = fetchMock;

const respond = (body: object, ok = true) =>
  fetchMock.mockResolvedValueOnce({ ok, json: async () => body });

describe("verifyTurnstile", () => {
  const originalSecret = process.env.TURNSTILE_SECRET_KEY;

  beforeEach(() => {
    fetchMock.mockReset();
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    process.env.TURNSTILE_SECRET_KEY = originalSecret;
  });

  it("posts the secret and token to Cloudflare siteverify", async () => {
    respond({ success: true, "error-codes": [] });

    await expect(verifyTurnstile("tok-123")).resolves.toEqual({
      success: true,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    );
    expect(init.method).toBe("POST");
    const body = init.body as URLSearchParams;
    expect(body.get("secret")).toBe("test-secret");
    expect(body.get("response")).toBe("tok-123");
  });

  it("fails when Cloudflare rejects the token", async () => {
    respond({ success: false, "error-codes": ["timeout-or-duplicate"] });
    await expect(verifyTurnstile("used-token")).resolves.toEqual({
      success: false,
    });
  });

  it("fails on a non-OK HTTP response", async () => {
    respond({ success: true }, false);
    await expect(verifyTurnstile("tok")).resolves.toEqual({ success: false });
  });

  it("fails when the request throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network down"));
    await expect(verifyTurnstile("tok")).resolves.toEqual({ success: false });
  });

  it.each([undefined, null, "", 123])(
    "fails without calling Cloudflare when the token is %p",
    async (token) => {
      await expect(verifyTurnstile(token)).resolves.toEqual({
        success: false,
      });
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("fails closed without calling Cloudflare when the secret is missing", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;
    await expect(verifyTurnstile("tok")).resolves.toEqual({ success: false });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
