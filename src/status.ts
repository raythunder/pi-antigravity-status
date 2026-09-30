export interface QuotaBucket {
  displayName: string;
  remainingFraction: number;
  resetTime?: string;
}

export interface QuotaGroup {
  displayName: string;
  buckets: QuotaBucket[];
}

export interface ModelQuota {
  modelId: string;
  remainingFraction?: number;
  resetTime?: string;
}

export interface UsageSnapshot {
  groups: QuotaGroup[];
  models: ModelQuota[];
  fetchedAt: number;
}

interface FormatUsageStatusOptions {
  accountLabel: string;
  modelId: string;
  usage: UsageSnapshot;
  now?: number;
}

function clampRemainingFraction(remainingFraction: number): number {
  return Math.max(0, Math.min(1, remainingFraction));
}

function formatPercent(remainingFraction: number): string {
  const percent = Math.round(clampRemainingFraction(remainingFraction) * 1000) / 10;
  return Number.isInteger(percent) ? String(percent) : percent.toFixed(1);
}

export function formatProgressBar(remainingFraction: number, width = 8): string {
  const normalizedWidth = Math.max(0, Math.round(width));
  const filledCells = Math.round(clampRemainingFraction(remainingFraction) * normalizedWidth);
  return `${"█".repeat(filledCells)}${"░".repeat(normalizedWidth - filledCells)}`;
}

function formatReset(resetTime: string | undefined, now: number): string {
  if (!resetTime) return "?";
  const resetAt = Date.parse(resetTime);
  if (!Number.isFinite(resetAt)) return "?";

  const totalMinutes = Math.max(0, Math.round((resetAt - now) / 60_000));
  if (totalMinutes === 0) return "now";

  let days = Math.floor(totalMinutes / 1_440);
  const minutesAfterDays = totalMinutes % 1_440;
  if (days > 0) {
    let hours = Math.round(minutesAfterDays / 60);
    if (hours === 24) {
      days += 1;
      hours = 0;
    }
    return hours > 0 ? `${days}d${hours}h` : `${days}d`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return minutes > 0 ? `${hours}h${minutes}m` : `${hours}h`;
  return `${minutes}m`;
}

function modelUsesClaudeGptPool(modelId: string): boolean {
  return /claude|gpt|oss/i.test(modelId);
}

function selectQuotaGroup(groups: QuotaGroup[], modelId: string): QuotaGroup | undefined {
  const pattern = modelUsesClaudeGptPool(modelId) ? /claude|gpt|oss/i : /gemini/i;
  return groups.find((group) => pattern.test(group.displayName));
}

function selectBucket(group: QuotaGroup, pattern: RegExp): QuotaBucket | undefined {
  return group.buckets.find((bucket) => pattern.test(bucket.displayName));
}

function modelMatchesPublicId(runtimeModelId: string, publicModelId: string): boolean {
  const normalizedPublicId = publicModelId.replace(/^antigravity\//, "");
  return runtimeModelId === normalizedPublicId || runtimeModelId.startsWith(`${normalizedPublicId}-`);
}

function selectModelQuota(models: ModelQuota[], modelId: string): ModelQuota | undefined {
  return models
    .filter(
      (model) =>
        model.remainingFraction !== undefined && modelMatchesPublicId(model.modelId, modelId),
    )
    .sort((left, right) => (left.remainingFraction ?? 1) - (right.remainingFraction ?? 1))[0];
}

function formatBucket(label: string, bucket: QuotaBucket, now: number): string {
  return `${label} ${formatReset(bucket.resetTime, now)} ${formatProgressBar(bucket.remainingFraction)} ${formatPercent(bucket.remainingFraction)}%`;
}

export function formatUsageStatus({
  accountLabel,
  modelId,
  usage,
  now = Date.now(),
}: FormatUsageStatusOptions): string {
  const prefix = `AG ${accountLabel}`;
  const group = selectQuotaGroup(usage.groups, modelId);

  if (group) {
    const fiveHour = selectBucket(group, /five|5\s*hour/i);
    const weekly = selectBucket(group, /week|7\s*day/i);
    const sections = [
      fiveHour ? formatBucket("5h", fiveHour, now) : undefined,
      weekly ? formatBucket("Week", weekly, now) : undefined,
    ].filter((section): section is string => section !== undefined);

    if (sections.length > 0) return `${prefix} │ ${sections.join(" │ ")}`;
  }

  const modelQuota = selectModelQuota(usage.models, modelId);
  if (modelQuota?.remainingFraction !== undefined) {
    return `${prefix} │ ${formatBucket("quota", {
      displayName: modelQuota.modelId,
      remainingFraction: modelQuota.remainingFraction,
      resetTime: modelQuota.resetTime,
    }, now)}`;
  }

  return `${prefix} │ quota unavailable`;
}
