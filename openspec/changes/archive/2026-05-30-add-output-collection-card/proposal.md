## Why

当前 AI 产出文件后需要两次输出：先通过 `save_output_file` 持久化到"工作产物"卡片，再通过 `provide_file` 在聊天中生成下载卡片。用户无法在聊天流中直接浏览工作产物文件集合并批量下载，流程冗余且体验割裂。

## What Changes

- 新增 `present_output_files` 工具，AI 可在聊天中展示工作产物文件集合卡片
- 新增产物集合卡片组件 `createOutputCollectionCard()`，在聊天流中渲染：文件树列表（目录结构）、每个文件的预览按钮、一键下载全部文件的按钮
- 预览功能复用现有 `openFileModal` 逻辑
- **BREAKING**: 无破坏性变更。`provide_file` 和 `save_output_file` 行为保持不变

## Capabilities

### New Capabilities
- `output-collection-card`: AI 通过工具调用在聊天面板中展示工作产物文件集合，支持文件预览和一键批量下载

### Modified Capabilities
<!-- 无现有 spec 需求变更，纯新增功能 -->

## Impact

- **新增代码**: `chat.js`（工具定义 + 卡片创建 + 扩展 `executeToolCall`），`panel.css`（卡片样式），`i18n.js`（翻译键）
- **依赖**: 复用 `output-files.js` 的 `getOutputFile` / `searchOutputFiles`，复用 `knowledge.js` 的 `openFileModal`
- **工具定义**: TOOLS 数组新增 `present_output_files`
- **无需新增依赖库**: 下载使用浏览器原生 Blob API，文件预览复用现有模态框
