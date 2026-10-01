interface AccountRecord {
  accountId?: unknown;
  email?: unknown;
}

interface AccountStore {
  activeAccountId?: unknown;
  accounts?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function maskEmail(email: string): string {
  const normalized = email.trim();
  const separatorIndex = normalized.indexOf("@");
  if (separatorIndex <= 0 || separatorIndex === normalized.length - 1) return normalized;

  const localPart = normalized.slice(0, separatorIndex);
  const domain = normalized.slice(separatorIndex);
  if (localPart.length <= 1) return `${localPart}***${domain}`;
  if (localPart.length <= 4) return `${localPart[0]}***${localPart.at(-1)}${domain}`;
  return `${localPart.slice(0, 2)}***${localPart.slice(-2)}${domain}`;
}

function maskAccountId(accountId: string): string {
  return accountId.includes("@")
    ? maskEmail(accountId)
    : accountId.length > 14
      ? `${accountId.slice(0, 13)}…`
      : accountId;
}

export function parseActiveAccountLabel(contents: string): string | undefined {
  try {
    const store = JSON.parse(contents) as AccountStore;
    if (!isRecord(store) || typeof store.activeAccountId !== "string" || !isRecord(store.accounts)) {
      return undefined;
    }

    const account = store.accounts[store.activeAccountId] as AccountRecord | undefined;
    if (!isRecord(account)) return undefined;
    if (typeof account.email === "string" && account.email.trim()) return maskEmail(account.email);
    if (typeof account.accountId === "string" && account.accountId.trim()) {
      return maskAccountId(account.accountId);
    }
    return maskAccountId(store.activeAccountId);
  } catch {
    return undefined;
  }
}

export function readActiveAccountLabel(
  agentDir = process.env.PI_CODING_AGENT_DIR || join(homedir(), ".pi", "agent"),
): string | undefined {
  try {
    return parseActiveAccountLabel(readFileSync(join(agentDir, "antigravity-accounts.json"), "utf8"));
  } catch {
    return undefined;
  }
}
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
