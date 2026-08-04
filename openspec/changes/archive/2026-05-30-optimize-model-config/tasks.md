## 1. i18n 文本更新

- [x] 1.1 中文 i18n: 将 `settings.provider` 从 `'供应商'` 改为 `'大模型'`
- [x] 1.2 英文 i18n: 将 `settings.provider` 从 `'Provider'` 改为 `'Model'`

## 2. 合并 Model Name 和 Model Type 字段

- [x] 2.1 从 `panel.html` 中删除 Model Type 输入框字段（`#modelType` 的整个 `.config-field`）
- [x] 2.2 从 `config.js` 中删除 `modelTypeEl` DOM 引用和相关操作代码（populateConfigForm 中的 modelType 赋值、保存时的 modelType 收集）
- [x] 2.3 更新 `session-manager.js`：导出日志中 `modelConfig.provider` 改用 `config?.modelName` 代替 `config?.modelType`

## 3. 连通性检测

- [x] 3.1 在 `config.js` 中实现 `testConnectivity(config)` 函数：向 `{apiBaseUrl}/v1/models` 发送 GET 请求（10 秒超时），返回成功/失败及错误详情
- [x] 3.2 修改配置保存流程：`saveModelConfig` 后调用 `testConnectivity`，成功则在按钮显示"已保存"（2 秒后恢复），失败则在按钮显示错误信息
- [x] 3.3 移除保存成功后自动跳转聊天页的逻辑
- [x] 3.4 添加 `.btn-error` 和 `.save-btn:disabled` CSS 样式

## 4. 验证

- [x] 4.1 验证中文界面导航显示"大模型"，英文界面显示"Model"
- [x] 4.2 验证 Model Type 字段已移除，仅保留 Model Name 字段
- [x] 4.3 验证保存有效配置后按钮显示"已保存"且用户留在设置页
- [x] 4.4 验证保存无效配置后按钮显示错误信息且用户留在设置页
