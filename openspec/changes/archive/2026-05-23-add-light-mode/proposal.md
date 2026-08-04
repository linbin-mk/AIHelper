## Why

当前 AI Helper Chrome 扩展仅支持暗色模式（Catppuccin Mocha），颜色全部硬编码在 `panel.css` 中，用户无法切换到亮色模式。在明亮环境下使用暗色界面可读性差，影响用户体验。需要添加亮色模式支持并提供切换功能。

## What Changes

- 引入 CSS 自定义属性（CSS Variables）作为主题颜色系统，替代硬编码颜色
- 定义两套主题：`dark`（现有 Catppuccin Mocha）和 `light`（Catppuccin Latte）
- 在 `<html>` 元素上通过 `data-theme` 属性控制当前主题
- 在 `panel.css` 中完成颜色 token 化重构
- 在 `panel.js` 中实现主题切换逻辑，通过 `chrome.storage.local` 持久化用户选择
- 在 `panel.html` 的 Tab 栏左侧添加主题切换按钮（太阳/月亮图标）
- 页面首次加载时自动检测 `chrome.storage` 中的主题偏好，默认跟随暗色模式

## Capabilities

### New Capabilities

- `theme-system`: 主题管理系统，包括 CSS 变量定义、亮/暗双主题 token、主题切换逻辑、偏好持久化
- `theme-toggle`: 主题切换 UI 按钮组件，位于 Tab 栏左侧，显示太阳/月亮图标

### Modified Capabilities

<!-- 无现有 spec 需要修改，此变更纯属 UI 层面新增功能 -->

## Impact

- **panel.css** (1136 行)：核心重构，所有硬编码颜色替换为 CSS 变量引用；新增 `[data-theme="light"]` 变量定义
- **panel.html**：在 `.header` 的 `.tab-bar` 左侧添加主题切换按钮
- **panel.js**：新增主题切换逻辑（读取/写入 `chrome.storage.local`，设置 `data-theme` 属性）
