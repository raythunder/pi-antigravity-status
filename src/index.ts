import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { readActiveAccountLabel } from "./account.js";
import { fetchUsageSnapshot } from "./client.js";
import { formatUsageStatus, type UsageSnapshot } from "./status.js";

const STATUS_KEY = "antigravity-usage";
const REFRESH_INTERVAL_MS = 5 * 60_000;
const TICK_INTERVAL_MS = 60_000;

export default function antigravityStatusExtension(pi: ExtensionAPI): void {
  let activeContext: ExtensionContext | undefined;
  let refreshTimer: ReturnType<typeof setInterval> | undefined;
  let refreshPromise: Promise<void> | undefined;
  let usage: UsageSnapshot | undefined;
  let accountLabel: string | undefined;
  let lastStatusText: string | undefined;

  function isAntigravityContext(ctx: ExtensionContext): boolean {
    return ctx.model?.provider === "antigravity";
  }

  function clearStatus(ctx: ExtensionContext): void {
    if (lastStatusText === undefined) return;
    lastStatusText = undefined;
    ctx.ui.setStatus(STATUS_KEY, undefined);
  }

  function setStatus(ctx: ExtensionContext, text: string): void {
    if (text === lastStatusText) return;
    lastStatusText = text;
    ctx.ui.setStatus(STATUS_KEY, text);
  }

  function publish(ctx: ExtensionContext, fallback = "loading…"): void {
    if (!ctx.hasUI || !isAntigravityContext(ctx)) {
      clearStatus(ctx);
      return;
    }

    const currentLabel = readActiveAccountLabel() || accountLabel || "unknown";
    accountLabel = currentLabel;
    const status = usage
      ? formatUsageStatus({
          accountLabel: currentLabel,
          modelId: ctx.model?.id || "",
          usage,
        })
      : `AG ${currentLabel} │ ${fallback}`;
    setStatus(ctx, status);
  }

  async function refresh(
    ctx: ExtensionContext,
    options: { force?: boolean; notify?: boolean } = {},
  ): Promise<void> {
    activeContext = ctx;
    if (!ctx.hasUI || !isAntigravityContext(ctx)) {
      clearStatus(ctx);
      return;
    }

    const currentLabel = readActiveAccountLabel() || "unknown";
    const accountChanged = accountLabel !== undefined && currentLabel !== accountLabel;
    if (accountChanged) usage = undefined;
    accountLabel = currentLabel;
    const isFresh = usage && Date.now() - usage.fetchedAt < REFRESH_INTERVAL_MS;

    if (!options.force && !accountChanged && isFresh) {
      publish(ctx);
      return;
    }
    if (refreshPromise) return refreshPromise;

    publish(ctx);
    refreshPromise = (async () => {
      try {
        const apiKey = await ctx.modelRegistry.getApiKeyForProvider("antigravity");
        if (!apiKey) throw new Error("No Antigravity credentials");
        usage = await fetchUsageSnapshot({ apiKey, signal: ctx.signal });
        accountLabel = readActiveAccountLabel() || accountLabel;
        publish(ctx);
        if (options.notify) ctx.ui.notify("Antigravity quota refreshed", "info");
      } catch (error) {
        publish(ctx, "quota unavailable");
        if (options.notify) {
          const message = error instanceof Error ? error.message : "Unknown error";
          ctx.ui.notify(`Antigravity quota refresh failed: ${message}`, "warning");
        }
      } finally {
        refreshPromise = undefined;
      }
    })();

    return refreshPromise;
  }

  function startTimer(): void {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(() => {
      if (activeContext) void refresh(activeContext);
    }, TICK_INTERVAL_MS);
    refreshTimer.unref?.();
  }

  pi.on("session_start", async (_event, ctx) => {
    activeContext = ctx;
    startTimer();
    publish(ctx);
    void refresh(ctx, { force: true });
  });

  pi.on("model_select", async (_event, ctx) => {
    activeContext = ctx;
    if (!isAntigravityContext(ctx)) {
      clearStatus(ctx);
      return;
    }
    publish(ctx);
    void refresh(ctx);
  });

  pi.on("message_end", async (_event, ctx) => {
    activeContext = ctx;
    void refresh(ctx);
  });

  pi.on("session_shutdown", async () => {
    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = undefined;
    if (activeContext) clearStatus(activeContext);
    activeContext = undefined;
    usage = undefined;
    accountLabel = undefined;
    lastStatusText = undefined;
  });

  pi.registerCommand("antigravity-status", {
    description: "Refresh the active Antigravity account quota shown in the status line",
    handler: async (args, ctx) => {
      const command = args.trim().toLowerCase();
      if (command && command !== "refresh") {
        ctx.ui.notify("Usage: /antigravity-status [refresh]", "warning");
        return;
      }
      await refresh(ctx, { force: true, notify: true });
    },
  });
}
