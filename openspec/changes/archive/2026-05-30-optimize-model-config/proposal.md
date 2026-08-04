## Why

当前"设置"页的模型配置区存在三个体验问题：① "供应商"一词不够直观，用户难以理解其含义；② Model Name 和 Model Type 两个字段在实际使用中总是填写相同值，分开填写增加操作成本且容易让用户困惑；③ 保存配置后缺乏连通性验证，用户无法立即知道配置是否正确，只能在后续聊天失败后才能发现问题。

## What Changes

- **BREAKING**: 导航标签"供应商"改名为"大模型"，同步更新中英文 i18n 文本
- **BREAKING**: 移除 Model Type 独立字段，将其与 Model Name 合并为一个"模型名称"字段，减少表单字段数
- 保存配置后自动发起连通性检测请求，成功则继续执行后续流程，失败则展示具体错误信息

## Capabilities

### New Capabilities
- `model-connectivity-check`: 保存模型配置后自动检测与 LLM 服务商的连通性，向 API 端点发送探测请求，成功则跳转聊天页，失败则展示错误详情

### Modified Capabilities
- `settings-provider-defaults`: Model Type 字段的默认值和预填充逻辑随字段合并而移除；导航标签名称变更；新增连通性检测流程

## Impact

- **Affected code**: `chrome-extension/src/panel/panel.html`（表单 HTML）、`chrome-extension/src/panel/config.js`（保存逻辑、表单操作）、`chrome-extension/src/panel/i18n.js`（中英文文本）、`chrome-extension/src/panel/panel.js`（导航切换的 section 标识）、`chrome-extension/src/panel/session-manager.js`（导出日志中 modelType 引用）
- **Affected specs**: `openspec/specs/settings-provider-defaults/spec.md` — 需创建 delta spec
- **Breaking changes**: 存储键 `modelType` 字段废弃，导出日志的 `provider` 字段改用 `modelName` 值
