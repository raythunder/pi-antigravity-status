import type { ModelQuota, QuotaGroup, UsageSnapshot } from "./status.js";

export interface AntigravityCredential {
  token: string;
  projectId: string;
}

interface FetchUsageSnapshotOptions {
  apiKey: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

const DEFAULT_ENDPOINTS = [
  "https://daily-cloudcode-pa.googleapis.com",
  "https://daily-cloudcode-pa.sandbox.googleapis.com",
  "https://cloudcode-pa.googleapis.com",
] as const;

const USER_AGENT =
  "antigravity/cli/1.2.4 (aidev_client; os_type=linux; arch=amd64; cl=982146307; auth_method=consumer)";
const REQUEST_TIMEOUT_MS = 8_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function clampFraction(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return Math.max(0, Math.min(1, value));
}

export function parseApiKey(apiKey: string): AntigravityCredential {
  try {
    const value: unknown = JSON.parse(apiKey);
    if (!isRecord(value) || typeof value.token !== "string" || typeof value.projectId !== "string") {
      throw new Error("invalid shape");
    }
    if (!value.token || !value.projectId) throw new Error("missing value");
    return { token: value.token, projectId: value.projectId };
  } catch {
    throw new Error("Invalid Antigravity credentials");
  }
}

export function parseQuotaGroups(value: unknown): QuotaGroup[] {
  if (!isRecord(value) || !Array.isArray(value.groups)) return [];

  return value.groups.flatMap((rawGroup): QuotaGroup[] => {
    if (!isRecord(rawGroup) || !Array.isArray(rawGroup.buckets)) return [];
    const buckets = rawGroup.buckets.flatMap((rawBucket): QuotaGroup["buckets"] => {
      if (!isRecord(rawBucket)) return [];
      const remainingFraction = clampFraction(rawBucket.remainingFraction);
      if (remainingFraction === undefined) return [];
      return [
        {
          displayName:
            typeof rawBucket.displayName === "string"
              ? rawBucket.displayName
              : typeof rawBucket.bucketId === "string"
                ? rawBucket.bucketId
                : "Limit",
          remainingFraction,
          ...(typeof rawBucket.resetTime === "string" ? { resetTime: rawBucket.resetTime } : {}),
        },
      ];
    });

    if (buckets.length === 0) return [];
    return [
      {
        displayName:
          typeof rawGroup.displayName === "string" ? rawGroup.displayName : "Quota group",
        buckets,
      },
    ];
  });
}

export function parseModelQuotas(value: unknown): ModelQuota[] {
  if (!isRecord(value) || !isRecord(value.models)) return [];

  return Object.entries(value.models).flatMap(([modelId, rawModel]): ModelQuota[] => {
    if (!isRecord(rawModel) || rawModel.isInternal === true || /^chat_/i.test(modelId)) return [];
    const quotaInfo = isRecord(rawModel.quotaInfo) ? rawModel.quotaInfo : undefined;
    const remainingFraction = clampFraction(quotaInfo?.remainingFraction);
    if (remainingFraction === undefined) return [];
    return [
      {
        modelId,
        remainingFraction,
        ...(typeof quotaInfo?.resetTime === "string" ? { resetTime: quotaInfo.resetTime } : {}),
      },
    ];
  });
}

function configuredEndpoints(): string[] {
  const configured = process.env.ANTIGRAVITY_BASE_URL?.trim() || process.env.NOAGY_BASE_URL?.trim();
  if (!configured) return [...DEFAULT_ENDPOINTS];

  const url = new URL(configured);
  const allowedHost = url.hostname === "googleapis.com" || url.hostname.endsWith(".googleapis.com");
  if (url.protocol !== "https:" || !allowedHost || url.username || url.password) {
    throw new Error("Invalid Antigravity API base URL");
  }
  return [url.origin];
}

function requestSignal(signal: AbortSignal | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

async function postFirstSuccessful(
  path: string,
  credential: AntigravityCredential,
  body: Record<string, unknown>,
  fetchImpl: typeof fetch,
  signal: AbortSignal | undefined,
): Promise<unknown> {
  let lastStatus: number | undefined;
  for (const endpoint of configuredEndpoints()) {
    try {
      const response = await fetchImpl(`${endpoint}${path}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${credential.token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
          "User-Agent": process.env.ANTIGRAVITY_USER_AGENT || process.env.NOAGY_USER_AGENT || USER_AGENT,
        },
        body: JSON.stringify(body),
        signal: requestSignal(signal),
      });
      lastStatus = response.status;
      if (response.ok) return (await response.json()) as unknown;
    } catch {
      if (signal?.aborted) throw new Error("Antigravity quota request cancelled");
    }
  }
  throw new Error(`Antigravity quota request failed${lastStatus ? ` (${lastStatus})` : ""}`);
}

export async function fetchUsageSnapshot({
  apiKey,
  fetchImpl = fetch,
  signal,
}: FetchUsageSnapshotOptions): Promise<UsageSnapshot> {
  const credential = parseApiKey(apiKey);
  const [summary, models] = await Promise.allSettled([
    postFirstSuccessful(
      "/v1internal:retrieveUserQuotaSummary",
      credential,
      {},
      fetchImpl,
      signal,
    ),
    postFirstSuccessful(
      "/v1internal:fetchAvailableModels",
      credential,
      { project: credential.projectId },
      fetchImpl,
      signal,
    ),
  ]);

  if (summary.status === "rejected" && models.status === "rejected") {
    throw new Error("Antigravity quota request failed");
  }

  return {
    groups: summary.status === "fulfilled" ? parseQuotaGroups(summary.value) : [],
    models: models.status === "fulfilled" ? parseModelQuotas(models.value) : [],
    fetchedAt: Date.now(),
  };
}
