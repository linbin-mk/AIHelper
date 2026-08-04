## ADDED Requirements

### Requirement: README 准确描述项目定位

README SHALL 在开篇用一句话准确描述项目的定位和核心价值，使新开发者即刻理解项目用途。

#### Scenario: 项目定位清晰
- **WHEN** 新开发者打开 README
- **THEN** 首段明确表述 AI Helper 是一个面向开发者的 Chrome 浏览器扩展，集 AI 对话、请求监控、技能系统、知识管理与记忆管理于一体

### Requirement: README 列出完整核心功能

README SHALL 按功能模块分组列出所有核心能力，每个模块包含功能点描述。覆盖：AI 对话、技能系统、请求监控、知识管理、记忆管理、高级配置。

#### Scenario: 核心功能清单完整
- **WHEN** 开发者阅读核心能力章节
- **THEN** 至少包含 6 个功能模块（AI 对话、技能系统、请求监控、请求头管理、知识管理、记忆管理、配置），每个模块不少于 2 个子功能点

### Requirement: README 包含准确的架构图

README SHALL 包含 ASCII 架构框图，展示 Side Panel、Service Worker、Content Scripts、持久化存储四层架构及其通信关系，覆盖所有当前存在的模块。

#### Scenario: 架构图覆盖所有模块
- **WHEN** 开发者查看架构图
- **THEN** 图中展示 content scripts 包含 request-interceptor、request-interceptor-bridge、page-context、page-interactive-elements、page-css、page-source、page-js、auth-extractor、element-click、execute-request-inject
- **AND** panel 中包含 agents-md-cache、output-files、favorites-manager 模块
- **AND** 展示 chrome.storage.local 和 IndexedDB 两层存储

### Requirement: README 目录结构与实际文件一致

README SHALL 包含目录结构章节，所列文件和目录与 `chrome-extension/` 下实际存在的文件完全一致。

#### Scenario: 目录结构准确
- **WHEN** 对比 README 目录结构与实际文件系统
- **THEN** README 中列出的每个文件路径在 `chrome-extension/` 下均存在
- **AND** `chrome-extension/src/panel/` 下所有 .js 文件均被列出

### Requirement: README 技能列表与 skills/manifest.json 一致

README SHALL 列出所有已注册的技能，按分类（Testing/Product/Development）分组，与 `skills/manifest.json` 中的技能 ID 一致。

#### Scenario: 技能列表准确
- **WHEN** 开发者查看技能系统章节
- **THEN** 列出 11 个技能且包含收藏夹功能说明
- **AND** 技能分类与 skill 文件 frontmatter 中的 category 字段一致

### Requirement: README 安装步骤可执行

README SHALL 包含清晰的安装步骤，使开发者能在第一次接触时成功加载扩展。

#### Scenario: 安装步骤完整
- **WHEN** 开发者按 README 安装步骤操作
- **THEN** 包含：打开扩展管理页 → 开启开发者模式 → 加载已解压 → 选择目录 → 完成

### Requirement: README 技术栈列表准确

README SHALL 列出项目使用的全部关键技术，包括 Chrome 扩展运行时、AI API 协议、存储方案、开发工作流工具。

#### Scenario: 技术栈完整
- **WHEN** 开发者查看技术栈章节
- **THEN** 列出 Manifest V3、OpenAI 兼容 API、SSE 流式响应、chrome.storage.local、IndexedDB、marked、isomorphic-git、Catppuccin 主题、Kilo/OpenSpec 开发工作流

### Requirement: README 注意事项准确

README SHALL 包含当前实际存在的注意事项和安全提醒。

#### Scenario: 注意事项实用
- **WHEN** 开发者阅读注意事项
- **THEN** 包含 API Key 存储方式提醒、Service Worker 生命周期说明、发布审核提示
