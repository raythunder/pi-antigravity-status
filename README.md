# pi-antigravity-status

为 Pi 的 `pi-antigravity` Provider 增加当前账号配额状态行。

## 显示内容

```text
AG r***@gmail.com │ 5h 1h40m ███░░░░░ 31.8% │ Week 17h33m █████░░░ 67.8%
```

- 只在当前模型 Provider 为 `antigravity` 时显示。
- 邮箱只保留首字符和域名，不显示 OAuth token、Project ID 等敏感字段。
- 优先显示当前模型所属共享池的 5 小时和每周剩余额度。
- 8 格进度条表示剩余额度，并保留精确百分比和重置倒计时。
- 聚合配额接口不可用时，自动回退到当前模型的剩余额度。

## 与现有状态栏兼容

插件只调用 `ctx.ui.setStatus("antigravity-usage", text)`，不会调用 `ctx.ui.setFooter()`。
`statusline-pi` 会读取并追加 Extension Status，因此两者不会互相覆盖，也不需要 fork。

## 刷新策略

- 启动 Antigravity 会话时立即刷新。
- 切换模型或账号后自动更新。
- 每 5 分钟最多请求一次配额 API；每分钟使用缓存更新重置倒计时。
- 手动刷新：`/antigravity-status refresh`。

## 安装

先安装并登录 `pi-antigravity`，再安装本插件：

```bash
pi install npm:pi-antigravity-status
```

也可以直接从 GitHub 安装：`pi install https://github.com/raythunder/pi-antigravity-status`。

安装后重启 Pi，或在现有 Pi 会话中运行 `/reload`。

## 验证

```bash
bun test
```

实现依据：

- [`pi-antigravity`](https://github.com/Rahularya01/pi-antigravity) 的配额接口与账号存储格式。
- Pi Extension API 的 `ctx.ui.setStatus()` 与 `FooterDataProvider.getExtensionStatuses()`。
