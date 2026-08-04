## 1. 国际化

- [x] 1.1 在 `i18n.js` 中新增产物集合卡片翻译键：

## 2. 工具定义

- [x] 2.1 在 `chat.js` 的 `TOOLS` 数组中新增 `present_output_files` 工具定义，参数包含：

## 3. 卡片组件

- [x] 3.1 在 `chat.js` 中实现 `createOutputCollectionCard({pathPrefix, showTree, emptyMessage})` 函数：

- [x] 3.2 实现下载全部按钮的点击处理：

- [x] 3.3 文件列表区域设置 `max-height: 280px` 和 `overflow-y: auto`，防止大量文件撑破面板

## 4. CSS 样式

- [x] 4.1 在 `panel.css` 中新增产物集合卡片样式：

## 5. executeToolCall 集成

- [x] 5.1 在 `chat.js` 的 `executeToolCall()` 函数中添加 `present_output_files` 分支：

## 6. 验证

- [x] 6.1 人工验证：完整流程测试（AI 先 `save_output_file`，再 `present_output_files`），确认卡片正确渲染、预览功能可用、批量下载功能可用
- [ ] 6.2 边界验证：空产物场景、大量文件场景（50+）、深色/浅色主题切换、中英文切换（跳过，后续回测）
