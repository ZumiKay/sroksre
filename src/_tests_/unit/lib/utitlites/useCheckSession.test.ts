jest.mock("next-auth/react", () => ({
  useSession: jest.fn(),
}));

import { renderHook, act } from "@testing-library/react";
import { useSession } from "next-auth/react";
import useCheckSession from "@/src/hooks/useCheckSession";
import { UserSessionStatusEnum } from "@/src/types/user.type";

const mockUpdate = jest.fn();

const setupSession = (overrides: { status?: string; data?: any } = {}) => {
  (useSession as jest.Mock).mockReturnValue({
    status: overrides.status ?? UserSessionStatusEnum.unauthenticated,
    data: overrides.data ?? null,
    update: mockUpdate,
  });
};

describe("useCheckSession", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── Initial / mount behaviour ─────────────────────────────────────────────
  describe("initial state", () => {
    it("sessionExpired is false on mount with no session", () => {
      setupSession();
      const { result } = renderHook(() => useCheckSession());
      expect(result.current.sessionExpired).toBe(false);
    });

    it("sets sessionExpired to true on mount when expires === '0'", () => {
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: { expires: "0" },
      });
      const { result } = renderHook(() => useCheckSession());
      expect(result.current.sessionExpired).toBe(true);
    });

    it("leaves sessionExpired false on mount with a valid session", () => {
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {
          expires: "2099-01-01",
          cexp: Math.floor(Date.now() / 1000) + 3600,
        },
      });
      const { result } = renderHook(() => useCheckSession());
      expect(result.current.sessionExpired).toBe(false);
    });
  });

  // ─── handleCheckSession ────────────────────────────────────────────────────
  describe("handleCheckSession", () => {
    it("returns false when status is 'loading'", async () => {
      setupSession({ status: UserSessionStatusEnum.loading, data: null });
      const { result } = renderHook(() => useCheckSession());

      const valid = await result.current.handleCheckSession();

      expect(valid).toBe(false);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("returns false when session data is null", async () => {
      setupSession({
        status: UserSessionStatusEnum.unauthenticated,
        data: null,
      });
      const { result } = renderHook(() => useCheckSession());

      const valid = await result.current.handleCheckSession();

      expect(valid).toBe(false);
    });

    it("returns false and sets sessionExpired when session has no cexp or expireAt", async () => {
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {}, // no cexp, no expireAt
      });
      const { result } = renderHook(() => useCheckSession());

      let valid: boolean;
      await act(async () => {
        valid = await result.current.handleCheckSession();
      });

      expect(valid!).toBe(false);
      expect(result.current.sessionExpired).toBe(true);
    });

    it("calls update() and returns true when cexp is expiring within 3 minutes", async () => {
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {
          expires: "2099-01-01",
          cexp: Math.floor(Date.now() / 1000) + 60, // 60 s left — inside 180 s window
        },
      });
      mockUpdate.mockResolvedValue({ expires: "2099-01-01" });

      const { result } = renderHook(() => useCheckSession());

      let valid: boolean;
      await act(async () => {
        valid = await result.current.handleCheckSession();
      });

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(valid!).toBe(true);
      expect(result.current.sessionExpired).toBe(false);
    });

    it("calls update() and returns true when cexp has already expired", async () => {
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {
          expires: "2099-01-01",
          cexp: Math.floor(Date.now() / 1000) - 100, // expired
        },
      });
      mockUpdate.mockResolvedValue({ expires: "2099-01-01" });

      const { result } = renderHook(() => useCheckSession());

      let valid: boolean;
      await act(async () => {
        valid = await result.current.handleCheckSession();
      });

      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(valid!).toBe(true);
    });

    it("returns false and sets sessionExpired when update() returns expires === '0'", async () => {
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {
          expires: "2099-01-01",
          cexp: Math.floor(Date.now() / 1000) - 100,
        },
      });
      mockUpdate.mockResolvedValue({ expires: "0" });

      const { result } = renderHook(() => useCheckSession());

      let valid: boolean;
      await act(async () => {
        valid = await result.current.handleCheckSession();
      });

      expect(valid!).toBe(false);
      expect(result.current.sessionExpired).toBe(true);
    });

    it("returns true when update() returns null (transient network failure)", async () => {
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {
          expires: "2099-01-01",
          cexp: Math.floor(Date.now() / 1000) - 100,
        },
      });
      mockUpdate.mockResolvedValue(null);

      const { result } = renderHook(() => useCheckSession());

      let valid: boolean;
      await act(async () => {
        valid = await result.current.handleCheckSession();
      });

      expect(valid!).toBe(true);
      expect(result.current.sessionExpired).toBe(false);
    });

    it("returns true (optimistic) when update() throws a network error", async () => {
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {
          expires: "2099-01-01",
          cexp: Math.floor(Date.now() / 1000) - 100,
        },
      });
      mockUpdate.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(() => useCheckSession());

      let valid: boolean;
      await act(async () => {
        valid = await result.current.handleCheckSession();
      });

      expect(valid!).toBe(true);
      expect(result.current.sessionExpired).toBe(false);
    });

    it("returns false and sets sessionExpired when expireAt is in the past", async () => {
      const pastDate = new Date(Date.now() - 60_000).toISOString();
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {
          expires: "2099-01-01",
          cexp: Math.floor(Date.now() / 1000) + 3600, // access token fresh
          expireAt: pastDate,
        },
      });

      const { result } = renderHook(() => useCheckSession());

      let valid: boolean;
      await act(async () => {
        valid = await result.current.handleCheckSession();
      });

      expect(valid!).toBe(false);
      expect(result.current.sessionExpired).toBe(true);
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("returns true when expireAt is in the future", async () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {
          expires: "2099-01-01",
          cexp: Math.floor(Date.now() / 1000) + 3600,
          expireAt: futureDate,
        },
      });

      const { result } = renderHook(() => useCheckSession());

      let valid: boolean;
      await act(async () => {
        valid = await result.current.handleCheckSession();
      });

      expect(valid!).toBe(true);
      expect(result.current.sessionExpired).toBe(false);
    });

    it("does not call update() when cexp is more than 3 minutes away", async () => {
      const futureDate = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {
          expires: "2099-01-01",
          cexp: Math.floor(Date.now() / 1000) + 3600, // 1 hour — outside 180 s window
          expireAt: futureDate,
        },
      });

      const { result } = renderHook(() => useCheckSession());

      await act(async () => {
        await result.current.handleCheckSession();
      });

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });

  // ─── clearSessionExpired ───────────────────────────────────────────────────
  describe("clearSessionExpired", () => {
    it("resets sessionExpired back to false", async () => {
      setupSession({
        status: UserSessionStatusEnum.authenticated,
        data: {}, // triggers sessionExpired via handleCheckSession
      });

      const { result } = renderHook(() => useCheckSession());

      await act(async () => {
        await result.current.handleCheckSession();
      });
      expect(result.current.sessionExpired).toBe(true);

      act(() => {
        result.current.clearSessionExpired();
      });
      expect(result.current.sessionExpired).toBe(false);
    });
  });
});
