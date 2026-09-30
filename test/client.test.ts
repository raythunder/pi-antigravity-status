import { describe, expect, test } from "bun:test";
import { parseApiKey, parseModelQuotas, parseQuotaGroups } from "../src/client.ts";

describe("parseApiKey", () => {
  test("accepts the credential format returned by pi-antigravity", () => {
    expect(parseApiKey(JSON.stringify({ token: "secret", projectId: "project-1" }))).toEqual({
      token: "secret",
      projectId: "project-1",
    });
  });

  test("rejects incomplete credentials without echoing their contents", () => {
    expect(() => parseApiKey(JSON.stringify({ token: "secret" }))).toThrow(
      "Invalid Antigravity credentials",
    );
  });
});

describe("parseQuotaGroups", () => {
  test("keeps only finite quota fractions and clamps them to the valid range", () => {
    expect(
      parseQuotaGroups({
        groups: [
          {
            displayName: "Gemini Models",
            buckets: [
              { displayName: "Five Hour Limit Remaining", remainingFraction: 0.318 },
              { displayName: "Weekly Limit Remaining", remainingFraction: 2 },
              { displayName: "Invalid", remainingFraction: "unknown" },
            ],
          },
        ],
      }),
    ).toEqual([
      {
        displayName: "Gemini Models",
        buckets: [
          { displayName: "Five Hour Limit Remaining", remainingFraction: 0.318 },
          { displayName: "Weekly Limit Remaining", remainingFraction: 1 },
        ],
      },
    ]);
  });
});

describe("parseModelQuotas", () => {
  test("extracts per-model fallback quota", () => {
    expect(
      parseModelQuotas({
        models: {
          "gemini-3.8-flash-high": {
            quotaInfo: {
              remainingFraction: 0.318,
              resetTime: "2026-09-30T10:19:58Z",
            },
          },
          "internal-model": { isInternal: true, quotaInfo: { remainingFraction: 1 } },
        },
      }),
    ).toEqual([
      {
        modelId: "gemini-3.8-flash-high",
        remainingFraction: 0.318,
        resetTime: "2026-09-30T10:19:58Z",
      },
    ]);
  });
});
