## 1. HTML 结构调整

- [x] 1.1 在 `#settings-provider` 内将表单区域包裹为 `#configFormArea`，新增 `#configCardArea` 卡片容器
- [x] 1.2 卡片区域内放置：信息行 (API Base URL)、信息行 (Model Name)、状态行 (连接状态文字)、刷新按钮 (右上角)、编辑按钮 (右下角)

## 2. CSS 卡片样式

- [x] 2.1 添加卡片基础样式：`config-card`（圆角、内边距、边框）
- [x] 2.2 添加卡片联通成功样式：浅绿色背景 (`.config-card--connected`)
- [x] 2.3 添加卡片联通失败样式：浅红色背景 (`.config-card--disconnected`)
- [x] 2.4 添加卡片内信息行样式（key-value 布局）
- [x] 2.5 添加刷新按钮和编辑按钮的定位与样式 (绝对定位右上/右下)

## 3. i18n 国际化文案

- [x] 3.1 添加中文文案：已连接、连接失败、连接中、刷新检测、编辑配置
- [x] 3.2 添加英文文案：Connected、Connection Failed、Connecting、Refresh、Edit Configuration

## 4. config.js 核心逻辑重构

- [x] 4.1 定义 `currentCardConfig` 变量，保存当前卡片展示的配置 `{ apiBaseUrl, modelName, connected }`
- [x] 4.2 实现 `showCard(config, connected)` 函数：渲染卡片 HTML 并切换到卡片模式
- [x] 4.3 实现 `showEditMode()` 函数：切换到编辑表单模式，预填当前 storage 中的配置值
- [x] 4.4 重构保存按钮点击逻辑：验证 → `testConnectivity()` → 成功才 `saveModelConfig()` + `showCard()`（绿色）；失败则 `showSaveError()` + 保持在表单，不写 storage
- [x] 4.5 实现卡片刷新按钮逻辑：从 storage 读取配置 → `testConnectivity()` → 更新卡片颜色和状态文字（绿/红）→ 防重复点击（检测中禁用按钮）
- [x] 4.6 实现卡片编辑按钮逻辑：调用 `showEditMode()` 并预填表单
- [x] 4.7 实现页面加载时的模式判断：若 storage 有配置 → `loadModelConfig()` → `showCard()` + 自动 `testConnectivity()` 更新颜色；无配置 → `showEditMode()` 展示空表单

## 5. 遗留代码清理

- [x] 5.1 移除 `showSaveSuccess()` 函数和 `saveStatusEl` 事件委托（"开始聊天"链接跳转）
- [x] 5.2 移除对 `switchTab` 的依赖引用
- [x] 5.3 清除 `saveStatus` 相关 HTML 和 CSS 代码（保留 `saveStatusEl` 用于错误展示）
- [x] 5.4 移除 i18n.js 中 `config.saved` 相关键
