import { describe, expect, test } from "bun:test";
import { maskEmail, parseActiveAccountLabel } from "../src/account.ts";

describe("maskEmail", () => {
  test("keeps only the first local-part character and domain", () => {
    expect(maskEmail("alice@example.com")).toBe("a***@example.com");
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

    expect(parseActiveAccountLabel(value)).toBe("a***@example.com");
  });

  test("rejects malformed stores", () => {
    expect(parseActiveAccountLabel("not json")).toBeUndefined();
    expect(parseActiveAccountLabel(JSON.stringify({ accounts: [] }))).toBeUndefined();
  });
});
