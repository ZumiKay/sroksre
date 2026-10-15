import { VerifyApiRoute } from "@/src/lib/middlewareaction";
import { Role } from "@/prisma/generated/prisma/enums";
import { timingSafeEquals } from "@/src/app/api/cron/cleanup-sessions/helper";
import { checkpassword, encrypt, decrypt } from "@/src/lib/utilities";

describe("Route Authorization & Security Unit Tests", () => {
  describe("VerifyApiRoute (RBAC Enforcement)", () => {
    describe("Public Routes (No Authentication Required)", () => {
      it("allows unauthenticated GET /products", () => {
        const res = VerifyApiRoute("/products", "GET", null);
        expect(res.success).toBe(true);
      });

      it("allows unauthenticated POST /auth/register", () => {
        const res = VerifyApiRoute("/auth/register", "POST", null);
        expect(res.success).toBe(true);
      });

      it("allows unauthenticated POST /order/cart/check", () => {
        const res = VerifyApiRoute("/order/cart/check", "POST", null);
        expect(res.success).toBe(true);
      });

      it("allows unauthenticated GET /categories", () => {
        const res = VerifyApiRoute("/categories", "GET", null);
        expect(res.success).toBe(true);
      });
    });

    describe("User-level Protected Routes", () => {
      it("rejects unauthenticated requests to /order/cart", () => {
        const res = VerifyApiRoute("/order/cart", "GET", null);
        expect(res.success).toBe(false);
      });

      it("allows USER role to access /order/cart", () => {
        const res = VerifyApiRoute("/order/cart", "GET", Role.USER);
        expect(res.success).toBe(true);
      });

      it("allows ADMIN role to access /order/cart", () => {
        const res = VerifyApiRoute("/order/cart", "POST", Role.ADMIN);
        expect(res.success).toBe(true);
      });
    });

    describe("Admin-only Protected Routes", () => {
      it("rejects unauthenticated requests to /products/crud", () => {
        const res = VerifyApiRoute("/products/crud", "POST", null);
        expect(res.success).toBe(false);
      });

      it("rejects USER role from calling /products/crud POST", () => {
        const res = VerifyApiRoute("/products/crud", "POST", Role.USER);
        expect(res.success).toBe(false);
      });

      it("allows ADMIN role to call /products/crud POST, PUT, and DELETE", () => {
        expect(VerifyApiRoute("/products/crud", "POST", Role.ADMIN).success).toBe(true);
        expect(VerifyApiRoute("/products/crud", "PUT", Role.ADMIN).success).toBe(true);
        expect(VerifyApiRoute("/products/crud", "DELETE", Role.ADMIN).success).toBe(true);
      });

      it("rejects USER role from modifying categories", () => {
        const res = VerifyApiRoute("/categories", "POST", Role.USER);
        expect(res.success).toBe(false);
      });

      it("allows ADMIN role to modify categories", () => {
        const res = VerifyApiRoute("/categories", "POST", Role.ADMIN);
        expect(res.success).toBe(true);
      });
    });
  });

  describe("timingSafeEquals", () => {
    it("returns true for identical secret strings", () => {
      expect(timingSafeEquals("super_secret_token_123", "super_secret_token_123")).toBe(true);
    });

    it("returns false for different length tokens without timing leaks", () => {
      expect(timingSafeEquals("short", "much_longer_token_value")).toBe(false);
    });

    it("returns false for same length but mismatched characters", () => {
      expect(timingSafeEquals("token_ABC", "token_XYZ")).toBe(false);
    });
  });

  describe("checkpassword (Password Validation Rules)", () => {
    it("fails when password is fewer than 8 characters", () => {
      const res = checkpassword("Short1!");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("8 characters");
    });

    it("fails when password lacks an uppercase letter", () => {
      const res = checkpassword("alllowercase123!");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("upppercase");
    });

    it("fails when password lacks special characters", () => {
      const res = checkpassword("NoSpecialChars123");
      expect(res.isValid).toBe(false);
      expect(res.error).toContain("special characters");
    });

    it("passes for strong compliant passwords", () => {
      const res = checkpassword("StrongP@ssw0rd!");
      expect(res.isValid).toBe(true);
      expect(res.error).toBe("");
    });
  });

  describe("encrypt & decrypt (AES-256-CBC Cycle)", () => {
    const secretKey = "my-secret-encryption-key-32-chars";

    it("encrypts and successfully decrypts back to original text", () => {
      const plaintext = "order-id-test-sensitive-payload-9988";
      const encrypted = encrypt(plaintext, secretKey);

      expect(encrypted).toContain(":");
      expect(encrypted).not.toBe(plaintext);

      const decrypted = decrypt(encrypted, secretKey);
      expect(decrypted).toBe(plaintext);
    });

    it("handles short keys by padding to 32 bytes", () => {
      const shortKey = "short_key";
      const plaintext = "hello-world";
      const encrypted = encrypt(plaintext, shortKey);
      const decrypted = decrypt(encrypted, shortKey);
      expect(decrypted).toBe(plaintext);
    });
  });
});
