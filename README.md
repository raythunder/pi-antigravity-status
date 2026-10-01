<p align="center">
  <img alt="pi-antigravity-status — Antigravity quota at a glance" src="https://raw.githubusercontent.com/raythunder/pi-antigravity-status/main/assets/pi-antigravity-status-cover.webp" width="100%">
</p>

<p align="center"><b>English</b> · <a href="https://github.com/raythunder/pi-antigravity-status/blob/main/README.zh-CN.md">简体中文</a></p>

<p align="center">
  <a href="https://www.npmjs.com/package/pi-antigravity-status"><img alt="npm version" src="https://img.shields.io/npm/v/pi-antigravity-status?style=flat-square&logo=npm&logoColor=white&color=CB3837"></a>
  <a href="https://www.npmjs.com/package/pi-antigravity-status"><img alt="npm downloads" src="https://img.shields.io/npm/dm/pi-antigravity-status?style=flat-square&logo=npm&logoColor=white&label=downloads"></a>
  <a href="https://github.com/raythunder/pi-antigravity-status"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-raythunder%2Fpi--antigravity--status-181717?style=flat-square&logo=github&logoColor=white"></a>
  <a href="https://pi.dev"><img alt="Pi Extension" src="https://img.shields.io/badge/Pi-Extension-7C3AED?style=flat-square"></a>
</p>
<p align="center">
  <a href="https://github.com/Rahularya01/pi-antigravity"><img alt="Antigravity Provider" src="https://img.shields.io/badge/Provider-pi--antigravity-4285F4?style=flat-square&logo=google&logoColor=white"></a>
  <img alt="Pi 0.80 or later" src="https://img.shields.io/badge/Pi-0.80%2B-555555?style=flat-square">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Status API" src="https://img.shields.io/badge/UI-setStatus()-009688?style=flat-square">
</p>

`pi-antigravity-status` adds a compact quota indicator for the active
[`pi-antigravity`](https://github.com/Rahularya01/pi-antigravity) account to the Pi status line.
It displays the active account, five-hour allowance, weekly allowance, reset countdowns, and
remaining-quota progress bars without replacing the existing footer.

```text
AG ra***er@gmail.com │ 5h 1h40m ███░░░░░ 31.8% │ Week 17h33m █████░░░ 67.8%
```

> This project is an unofficial companion extension for `pi-antigravity`. It is not affiliated
> with or endorsed by Google.

## Features

- Displays quota only while the active model uses the `antigravity` provider.
- Shows the five-hour and weekly shared quota pools for the active model family.
- Uses an eight-cell progress bar while retaining the exact percentage and reset countdown.
- Falls back to per-model quota when aggregate quota groups are unavailable.
- Masks the email local part as two leading and two trailing characters when its length permits;
  shorter local parts retain one character at each end.
- Never renders OAuth tokens, project IDs, or other credential fields.
- Coexists with `statusline-pi` and other extensions through an independent Extension Status key.

## Requirements

- Pi Coding Agent `>= 0.80.0`
- [`pi-antigravity`](https://www.npmjs.com/package/pi-antigravity) `>= 0.8.1`
- A Google account authorized for the relevant Antigravity / Cloud Code Assist services

This extension is functionally dependent on `pi-antigravity`:

- `pi-antigravity` registers the `antigravity` provider and manages Google OAuth, credentials,
  and linked accounts.
- This extension retrieves the provider credential through Pi's `modelRegistry`, reads the active
  account metadata from `antigravity-accounts.json`, and requests the quota endpoints.
- The extension does not import or duplicate the provider's runtime implementation.
- Pi does not automatically install another Pi package declared through `peerDependencies`, so
  `pi-antigravity` must be installed separately.

Without an installed and authenticated `pi-antigravity` provider, no quota status is displayed.

## Install

Install the provider and the status extension:

```bash
pi install npm:pi-antigravity
pi install npm:pi-antigravity-status
```

Restart Pi or run `/reload`, then authenticate and select an Antigravity model:

```text
/login antigravity
/model antigravity/gemini-3.8-flash
```

For environments where `pi-antigravity` is already installed and authenticated, install only the
status extension and run `/reload`.

Git installation is also supported:

```bash
pi install https://github.com/raythunder/pi-antigravity-status
```

## Usage

The status entry refreshes automatically:

- Immediately after an Antigravity session starts
- After the selected model or active account changes
- From cached quota data once per minute to update reset countdowns
- From the quota API at most once every five minutes

Force an immediate refresh with:

```text
/antigravity-status refresh
```

## Status-Line Compatibility

The extension calls only:

```ts
ctx.ui.setStatus("antigravity-usage", text);
```

It does not call `ctx.ui.setFooter()`. `statusline-pi` reads Extension Status entries and appends
them to its existing output, allowing both extensions to remain active without a fork or footer
replacement.

## Development

```bash
bun test
```

The test suite covers account masking, credential parsing, quota parsing, fallback behavior,
progress-bar formatting, and status-line output.

## Friendly Links

- [LINUX DO](https://linux.do/)

## Acknowledgements

- [`pi-antigravity`](https://github.com/Rahularya01/pi-antigravity) for the provider, quota API
  behavior, and linked-account storage format.
- [Pi Extension API](https://pi.dev) for `ctx.ui.setStatus()` and Extension Status integration.
