import { describe, expect, test } from "bun:test";
import { maskEmail, parseActiveAccountLabel } from "../src/account.ts";

describe("maskEmail", () => {
  test("keeps the first and last two local-part characters", () => {
    expect(maskEmail("alice@example.com")).toBe("al***ce@example.com");
  });

  test("uses one character on each side for short local parts", () => {
    expect(maskEmail("abcd@example.com")).toBe("a***d@example.com");
    expect(maskEmail("ab@example.com")).toBe("a***b@example.com");
  });
});

describe("parseActiveAccountLabel", () => {
  test("returns the masked email for the active account", () => {
    const value = JSON.stringify({
      version: 1,
      activeAccountId: "alice@example.com",
      accounts: {
        "alice@example.com": {
          accountId: "alice@example.com",
          email: "alice@example.com",
          access: "must-not-leak",
          refresh: "must-not-leak",
        },
      },
    });

    expect(parseActiveAccountLabel(value)).toBe("al***ce@example.com");
  });

  test("rejects malformed stores", () => {
    expect(parseActiveAccountLabel("not json")).toBeUndefined();
    expect(parseActiveAccountLabel(JSON.stringify({ accounts: [] }))).toBeUndefined();
  });
});
