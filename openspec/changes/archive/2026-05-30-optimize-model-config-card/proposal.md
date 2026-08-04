## Why

当前大模型配置页在保存后仍显示表单，用户无法直观看到当前配置状态。需要将保存成功后的体验从"文字提示→跳转聊天"改为"信息卡片展示→可编辑"，让用户在同一视图内获得配置状态反馈，减少不必要的页面跳转。

## What Changes

- 保存时先验证表单，再联通性检测，仅检测通过后才写入 chrome.storage.local 并切为卡片模式
- 联通失败时保持在编辑表单，展示当前已有的错误提示，不写入存储
- 保存成功后，表单区域替换为一张浅绿色模型信息卡片，展示 API Base URL、Model Name 和联通状态
- 卡片右上方提供刷新按钮，点击重新测试联通性：通过变绿色，失败变红色
- 卡片右下方提供编辑按钮，点击切换回编辑表单
- 编辑模式下保存逻辑同上：联通成功→写入存储→切卡片；联通失败→留在表单
- 已保存过配置的用户，进入设置页默认显示卡片，并自动检测联通性刷新状态

## Capabilities

### New Capabilities
- `model-config-card`: 模型配置信息卡片视图，在保存+联通成功后展示当前模型信息、联通状态，并提供刷新检测和编辑入口

### Modified Capabilities
- `model-connectivity-check`: 保存流程从"先存储后检测"改为"先检测后存储，仅联通成功才存储"，移除"已保存+开始聊天"链接行为

## Impact

- `chrome-extension/src/panel/config.js`: 保存流程重构（先检测后存储）、卡片渲染与双模式切换
- `chrome-extension/src/panel/panel.html`: 供应商模块 HTML 结构调整（新增卡片模板）
- `chrome-extension/src/panel/panel.css`: 新增卡片样式、联通状态颜色
- `chrome-extension/src/panel/i18n.js`: 新增卡片相关国际化文案
- `chrome-extension/src/panel/panel.js`: 设置页加载时根据已有配置决定显示模式
