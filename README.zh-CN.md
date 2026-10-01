<p align="center">
  <img alt="pi-antigravity-status — Antigravity 配额状态概览" src="https://raw.githubusercontent.com/raythunder/pi-antigravity-status/main/assets/pi-antigravity-status-cover.webp" width="100%">
</p>

<p align="center"><a href="https://github.com/raythunder/pi-antigravity-status/blob/main/README.md">English</a> · <b>简体中文</b></p>

<p align="center">
  <a href="https://www.npmjs.com/package/pi-antigravity-status"><img alt="npm 版本" src="https://img.shields.io/npm/v/pi-antigravity-status?style=flat-square&logo=npm&logoColor=white&color=CB3837"></a>
  <a href="https://www.npmjs.com/package/pi-antigravity-status"><img alt="npm 下载量" src="https://img.shields.io/npm/dm/pi-antigravity-status?style=flat-square&logo=npm&logoColor=white&label=downloads"></a>
  <a href="https://github.com/raythunder/pi-antigravity-status"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-raythunder%2Fpi--antigravity--status-181717?style=flat-square&logo=github&logoColor=white"></a>
  <a href="https://pi.dev"><img alt="Pi 扩展" src="https://img.shields.io/badge/Pi-Extension-7C3AED?style=flat-square"></a>
</p>
<p align="center">
  <a href="https://github.com/Rahularya01/pi-antigravity"><img alt="Antigravity Provider" src="https://img.shields.io/badge/Provider-pi--antigravity-4285F4?style=flat-square&logo=google&logoColor=white"></a>
  <img alt="Pi 0.80 或更高版本" src="https://img.shields.io/badge/Pi-0.80%2B-555555?style=flat-square">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white">
  <img alt="Status API" src="https://img.shields.io/badge/UI-setStatus()-009688?style=flat-square">
</p>

`pi-antigravity-status` 在 Pi 状态栏中显示当前
[`pi-antigravity`](https://github.com/Rahularya01/pi-antigravity) 账号的配额状态，包括当前账号、
5 小时配额、每周配额、重置倒计时和剩余额度进度条。插件采用独立的 Extension Status，
不会替换现有 footer。

```text
AG ra***er@gmail.com │ 5h 1h40m ███░░░░░ 31.8% │ Week 17h33m █████░░░ 67.8%
```

> 本项目是 `pi-antigravity` 的非官方配套扩展，与 Google 不存在从属或认可关系。

## 功能特性

- 仅在当前模型使用 `antigravity` Provider 时显示配额状态。
- 显示当前模型系列对应的 5 小时共享配额和每周共享配额。
- 使用 8 格进度条表示剩余额度，同时保留精确百分比和重置倒计时。
- 聚合配额不可用时，自动回退到当前模型的独立配额。
- 邮箱本地部分在长度允许时保留首尾各 2 个字符；较短账号保留首尾各 1 个字符。
- OAuth token、Project ID 和其他凭据字段不会进入状态栏。
- 通过独立的 Extension Status key 与 `statusline-pi` 及其他扩展并存。

## 运行要求

- Pi Coding Agent `>= 0.80.0`
- [`pi-antigravity`](https://www.npmjs.com/package/pi-antigravity) `>= 0.8.1`
- 已获得相应 Antigravity / Cloud Code Assist 服务权限的 Google 账号

本项目在功能上依赖 `pi-antigravity`：

- `pi-antigravity` 负责注册 `antigravity` Provider，并管理 Google OAuth、凭据和关联账号。
- 本插件通过 Pi 的 `modelRegistry` 获取 Provider 凭据，读取 `antigravity-accounts.json` 中的
  当前账号元数据，并请求配额接口。
- 本插件不导入或复制 `pi-antigravity` 的运行时代码。
- Pi 不会自动安装通过 `peerDependencies` 声明的其他 Pi Package，因此必须单独安装
  `pi-antigravity`。

缺少已安装并完成认证的 `pi-antigravity` Provider 时，插件不会显示配额状态。

## 安装

依次安装 Provider 和状态栏插件：

```bash
pi install npm:pi-antigravity
pi install npm:pi-antigravity-status
```

重启 Pi 或执行 `/reload`，然后完成认证并选择 Antigravity 模型：

```text
/login antigravity
/model antigravity/gemini-3.8-flash
```

已完成 `pi-antigravity` 安装和认证的环境，仅需安装状态栏插件并执行 `/reload`。

Git 安装方式：

```bash
pi install https://github.com/raythunder/pi-antigravity-status
```

## 使用方式

状态栏按照以下策略自动刷新：

- Antigravity 会话启动后立即刷新
- 当前模型或活动账号发生变化后刷新
- 每分钟基于缓存数据更新重置倒计时
- 配额 API 的请求频率不超过每 5 分钟一次

手动刷新命令：

```text
/antigravity-status refresh
```

## 状态栏兼容性

插件仅调用：

```ts
ctx.ui.setStatus("antigravity-usage", text);
```

插件不会调用 `ctx.ui.setFooter()`。`statusline-pi` 会读取并追加 Extension Status，
因此两个扩展可以同时启用，无需 fork 或替换现有状态栏实现。

## 开发与验证

```bash
bun test
```

测试范围包括账号脱敏、凭据解析、配额解析、回退逻辑、进度条格式和状态栏输出。

## 友情链接

- [LINUX DO](https://linux.do/)

## 致谢

- [`pi-antigravity`](https://github.com/Rahularya01/pi-antigravity)：提供 Provider、配额接口行为和
  关联账号存储格式。
- [Pi Extension API](https://pi.dev)：提供 `ctx.ui.setStatus()` 和 Extension Status 集成能力。
