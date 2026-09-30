import { describe, expect, test } from "bun:test";
import {
  formatProgressBar,
  formatUsageStatus,
  type UsageSnapshot,
} from "../src/status.ts";

const NOW = Date.parse("2026-09-30T08:40:00Z");

const usage: UsageSnapshot = {
  fetchedAt: NOW,
  groups: [
    {
      displayName: "Gemini Models",
      buckets: [
        {
          displayName: "Weekly Limit Remaining",
          remainingFraction: 0.678,
          resetTime: "2026-10-01T02:12:42Z",
        },
        {
          displayName: "Five Hour Limit Remaining",
          remainingFraction: 0.318,
          resetTime: "2026-09-30T10:19:58Z",
        },
      ],
    },
    {
      displayName: "Claude and GPT models",
      buckets: [
        {
          displayName: "Weekly Limit Remaining",
          remainingFraction: 1,
          resetTime: "2026-10-07T10:13:09Z",
        },
        {
          displayName: "Five Hour Limit Remaining",
          remainingFraction: 1,
          resetTime: "2026-09-30T15:13:09Z",
        },
      ],
    },
  ],
  models: [],
};

describe("formatUsageStatus", () => {
  test("shows the active account and Gemini shared quota without replacing the existing footer", () => {
    expect(
      formatUsageStatus({
        accountLabel: "r***@gmail.com",
        modelId: "gemini-3.8-flash",
        usage,
        now: NOW,
      }),
    ).toBe("AG r***@gmail.com │ 5h 1h40m ███░░░░░ 31.8% │ Week 17h33m █████░░░ 67.8%");
  });

  test("selects the Claude and GPT quota pool for a Claude model", () => {
    expect(
      formatUsageStatus({
        accountLabel: "r***@gmail.com",
        modelId: "claude-sonnet-4-6",
        usage,
        now: NOW,
      }),
    ).toBe("AG r***@gmail.com │ 5h 6h33m ████████ 100% │ Week 7d2h ████████ 100%");
  });

  test("falls back to per-model quota when aggregate groups are unavailable", () => {
    expect(
      formatUsageStatus({
        accountLabel: "r***@gmail.com",
        modelId: "gemini-3.8-flash",
        usage: {
          fetchedAt: NOW,
          groups: [],
          models: [
            {
              modelId: "gemini-3.8-flash-high",
              remainingFraction: 0.318,
              resetTime: "2026-09-30T10:19:58Z",
            },
          ],
        },
        now: NOW,
      }),
    ).toBe("AG r***@gmail.com │ quota 1h40m ███░░░░░ 31.8%");
  });

  test("returns a compact unavailable state when no quota data exists", () => {
    expect(
      formatUsageStatus({
        accountLabel: "r***@gmail.com",
        modelId: "gemini-3.8-flash",
        usage: { fetchedAt: NOW, groups: [], models: [] },
        now: NOW,
      }),
    ).toBe("AG r***@gmail.com │ quota unavailable");
  });
});

describe("formatProgressBar", () => {
  test("renders an empty bar at zero percent", () => {
    expect(formatProgressBar(0)).toBe("░░░░░░░░");
  });

  test("renders a full bar at one hundred percent", () => {
    expect(formatProgressBar(1)).toBe("████████");
  });

  test("rounds intermediate percentages to the nearest cell", () => {
    expect(formatProgressBar(0.318)).toBe("███░░░░░");
  });
});
