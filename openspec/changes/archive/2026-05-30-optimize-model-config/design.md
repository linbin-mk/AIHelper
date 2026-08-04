## Context

当前模型配置页有三个体验问题：导航标签"供应商"不直观，Model Name/Model Type 总是相同值却分开填写，保存后无连通性验证。这是纯前端 Chrome 扩展，配置存储在 `chrome.storage.local`，API 调用遵循 OpenAI 兼容协议。

## Goals / Non-Goals

**Goals:**
- 将导航标签"供应商"改为"大模型"，中英文 i18n 同步更新
- 将 Model Name 和 Model Type 合并为一个"模型名称"字段，减少用户操作
- 保存配置后自动检测与 LLM 服务商的连通性，结果展示在保存按钮下方

**Non-Goals:**
- 不改变 `data-section` 内部标识符和 DOM 元素 ID
- 不改变 `ai_helper_model_config` 存储键结构（保留 modelType 键兼容旧数据，仅不再写入新值）
- 不修改导出日志的 JSON 结构字段名

## Decisions

### 1. 合并 Model Name 和 Model Type 为单一字段

**决策**: 从 HTML 表单中移除 Model Type 输入框，`modelTypeEl` DOM 引用从 config.js 删除。所有使用 `modelType` 的地方统一改用 `modelName`。存储时不再写入 `modelType` 字段。

**理由**: Model Name 和 Model Type 在 LLM API 调用中作用相同（都映射到请求 body 的 `model` 字段），实际使用中用户总是填写相同值，分开两个字段增加的操作成本远大于其提供的灵活性。

**替代方案**: 保留两个字段但添加"与 Model Name 相同"的复选框 —— 被否决，因为增加了复杂度却没有真正的用户场景。

### 2. 连通性检测使用 /v1/models 端点

**决策**: 保存配置后，向 `{apiBaseUrl}/v1/models` 发送 GET 请求，携带 `Authorization: Bearer {apiKey}` 头。收到 2xx 响应视为成功，其他状态码或网络错误视为失败并展示错误详情。

**理由**: `/v1/models` 是 OpenAI 兼容 API 中最轻量的端点，不需要构建 message context，响应体积小，适合作为健康检查。GET 请求简单且副作用最小。

**替代方案**: 使用 `/v1/chat/completions` 发送一条空消息探测 —— 被否决，因为可能产生 token 消耗费用且有副作用。

### 3. 移除保存后自动跳转，结果展示在按钮下方

**决策**: 移除保存成功后自动跳转聊天页的逻辑。连通性检测成功后，按钮显示"已保存"（2 秒后恢复），同时在按钮下方显示"连接成功"提示；检测失败时，按钮下方展示错误详情。无论成功或失败，用户都留在设置页。

**理由**: 保存配置后不应强制用户离开设置页。错误信息可能较长，放在按钮下方可保证按钮始终可见，避免被挤出视口。

### 4. 内部标识符保持不变

**决策**: `data-section="provider"`、`id="settings-provider"`、`id="modelName"` 等 DOM 标识符不变。仅修改用户可见的 i18n 文本。

**理由**: 避免引入不必要的 CSS 和 JS 选择器改动，降低回归风险。

### 5. 结果信息展示位置

**决策**: 在保存按钮下方新增 `#connectivityStatus` 元素，用于展示成功/失败信息。按钮本身保持"已保存"反馈（2 秒后恢复），额外状态文字出现在按钮下方。错误样式使用 `.config-error` 红色，成功样式使用绿色。

## Risks / Trade-offs

- **[Risk] 某些服务商的 /v1/models 端点需要管理员权限** → 如果检测失败但 API Key 本身有效，用户可能被误导。**缓解**: 错误信息中展示具体的 HTTP 状态码和响应内容，帮助用户判断是权限问题还是连接问题。
- **[Risk] 旧版本已保存的 modelType 字段在新版本中被忽略** → 不影响功能，因为所有调用 LLM API 的代码都只使用 modelName。导出日志的 modelConfig.provider 改用 modelName 值。
