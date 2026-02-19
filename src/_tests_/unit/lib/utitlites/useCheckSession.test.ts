/**
 * Testing List
 * [] Check UserSession hook
 */

import { renderHook } from "@testing-library/react";
import useCheckSession from "@/src/hooks/useCheckSession";
import { UserSessionStatusEnum } from "@/src/types/user.type";

/**Mocks for this test */

// Jest module mock for next-auth/react - create mocks directly in factory
jest.mock("next-auth/react", () => ({
  signOut: jest.fn(),
  useSession: jest.fn(),
}));

// Mock errorToast
jest.mock("@/src/app/component/Loading", () => ({
  errorToast: jest.fn(),
}));

// Import the mocked functions AFTER jest.mock()
import { signOut, useSession } from "next-auth/react";
import { errorToast } from "@/src/app/component/Loading";

// Create a separate mock for update function
const mockUpdate = jest.fn();

describe.only("Check session hook test", () => {
  //reset all mock
  beforeEach(() => {
    jest.clearAllMocks();

    //Initialize useSession hooks
    (useSession as jest.Mock).mockReturnValue({
      status: UserSessionStatusEnum.unauthenticated,
      data: null,
      update: mockUpdate,
    });
  });

  test("Should return false when there is no session", async () => {
    const { result } = renderHook(() => useCheckSession());

    const checkSession = await result.current.handleCheckSession();

    //Matcher
    expect(checkSession).toBe(false);
  });

  test("Should return false when update throws an ERROR", async () => {
    jest.useFakeTimers();

    // Setup: authenticated session with expired token
    (useSession as jest.Mock).mockReturnValue({
      status: UserSessionStatusEnum.authenticated,
      data: {
        cexp: Math.floor(Date.now() / 1000) - 100, // expired
      },
      update: mockUpdate,
    });

    // Change update behavior for this test
    mockUpdate.mockRejectedValue(new Error("Update ERROR"));
    (signOut as jest.Mock).mockResolvedValue({});

    // Mock errorToast to immediately call onClose callback
    (errorToast as jest.Mock).mockImplementation((message, options: any) => {
      if (options?.onClose) {
        options.onClose();
      }
    });

    const { result } = renderHook(() => useCheckSession());
    const checkSession = await result.current.handleCheckSession();

    // Advance timers to trigger the setTimeout inside onClose (150ms)
    jest.advanceTimersByTime(150);

    //Matcher
    expect(checkSession).toBe(false);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(errorToast).toHaveBeenCalledWith(
      "Invalid Session",
      expect.any(Object),
    );
    expect(signOut).toHaveBeenCalled();

    jest.useRealTimers();
  });

  test("Should Trigger Update When Access Token is Expire", async () => {
    (useSession as jest.Mock).mockReturnValue({
      status: UserSessionStatusEnum.authenticated,
      data: {
        cexp: Math.floor(Date.now() / 1000) - 100, //Expried
      },
      update: mockUpdate,
    });

    const { result } = renderHook(() => useCheckSession());

    (mockUpdate as jest.Mock).mockResolvedValue({});

    const checksession = await result.current.handleCheckSession();

    //Matcher
    expect(checksession).toBe(true);
    expect(signOut).toHaveBeenCalledTimes(0);
  });

  test("Should call errorToast with 'Invalid Session' when session has no expiration fields", async () => {
    // Setup: session with no cexp or expireAt
    (useSession as jest.Mock).mockReturnValue({
      status: UserSessionStatusEnum.authenticated,
      data: {
        // No cexp or expireAt fields
      },
      update: mockUpdate,
    });

    const { result } = renderHook(() => useCheckSession());
    await result.current.handleCheckSession();

    expect(errorToast).toHaveBeenCalledWith(
      "Invalid Session",
      expect.objectContaining({
        autoClose: 5000,
        closeOnClick: true,
      }),
    );
  });

  test("Should call errorToast when update fails", async () => {
    // Setup: expired session
    (useSession as jest.Mock).mockReturnValue({
      status: UserSessionStatusEnum.authenticated,
      data: {
        cexp: Math.floor(Date.now() / 1000) - 100, // expired
      },
      update: mockUpdate,
    });

    // Make update fail
    mockUpdate.mockRejectedValue(new Error("Update failed"));

    const { result } = renderHook(() => useCheckSession());
    await result.current.handleCheckSession();

    // Matcher
    expect(errorToast).toHaveBeenCalledWith(
      "Invalid Session",
      expect.any(Object),
    );
  });
});
