## Why

README 内容已严重过时——技能数量、功能列表、架构图、目录结构均不反映当前第 8 天迭代的实际状态。迭代每一天都有大量新功能和重构，README 停留在最初版本，无法作为准确的项目文档帮助新开发者快速理解项目。

## What Changes

- 重写 README 全部内容，基于当前最新架构和功能清单
- 更新核心能力描述：技能系统从 7 个扩展为 11 个，新增收藏夹、智能搜索、输出产物等模块
- 更新架构图：反映扩充后的 content scripts（page-css/page-source/page-js/element-click/interactive-elements）、新增的 AGENTS.md 缓存模块
- 更新目录结构：与当前 `chrome-extension/src/` 实际文件完全一致
- 更新使用说明：补充技能收藏夹、输出产物、通用记忆域等新功能的用法
- 更新技术栈列表：移除不必要的 "纯 HTML/CSS/JS" 等过时描述，补充 Kilo/OpenSpec 开发工作流工具
- 更新注意事项：反映当前安全性和稳定性考量

## Capabilities

### New Capabilities

- `readme-documentation`: 项目 README 文档，准确描述项目整体架构、功能清单、使用方式和技术栈

### Modified Capabilities

<!-- 纯文档变更，不修改任何现有功能规格 -->

## Impact

- 仅影响 `README.md` 文件
- 无代码变更，无 API 变更
- 无依赖变更
