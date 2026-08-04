# thinking-process-indicator

## ADDED Requirements

### Requirement: 思考中标签文案动态切换
当 AI 正在流式推理（产生 reasoning_content）时，思考过程卡片 SHALL 将标签文案动态切换：中文从 `💭 思考过程` 切换为 `💭 正在思考`，英文从 `💭 Thought Process` 切换为 `💭 Thinking`。动画效果让用户感知到系统正在处理中。

#### Scenario: 推理开始时标签切换为正在思考
- **WHEN** AI 开始流式输出 reasoning_content
- **THEN** 思考过程卡片被创建
- **AND** 标签文案显示为 `💭 正在思考`（中文）或 `💭 Thinking`（英文）
- **AND** 标签文字 SHALL 应用 CSS 呼吸渐变动画

#### Scenario: 推理完成后标签恢复为静态文案
- **WHEN** AI 推理完成（reasoning_content 流结束）
- **THEN** 标签文案 SHALL 恢复为静态 `💭 思考过程`（中文）或 `💭 Thought Process`（英文）
- **AND** 呼吸渐变动画 SHALL 停止

#### Scenario: 推理发生错误时动画自然移除
- **WHEN** 推理过程中发生错误导致思考卡片被移除
- **THEN** 思考卡片及其动画 SHALL 从 DOM 中消失

### Requirement: 思考标签呼吸渐变动画
思考中状态下的标签文字 SHALL 呈现 CSS 呼吸渐变效果，文字透明度在 60% 和 100% 之间循环交替，让用户直观感知 AI 正在处理中。

#### Scenario: 呼吸动画循环播放
- **WHEN** 思考卡片处于"正在思考"活跃状态
- **THEN** 标签文字透明度 SHALL 在 0.6 和 1.0 之间平滑过渡
- **AND** 动画周期 SHALL 为 1.5 秒，使用 ease-in-out 缓动
- **AND** 动画 SHALL 无限循环直到状态切换

#### Scenario: 动画通过 CSS 类控制
- **WHEN** 思考卡片需要显示"正在思考"状态
- **THEN** JavaScript SHALL 为思考卡片元素添加 `.thinking-active` CSS 类
- **AND** `.thinking-active` 类 SHALL 触发 `.thinking-label` 上的 `@keyframes thinking-breathe` 动画
- **WHEN** 推理完成
- **THEN** JavaScript SHALL 移除 `.thinking-active` 类，动画停止

### Requirement: 国际化支持
"正在思考"状态文案 SHALL 支持中英文国际化，与现有 i18n 体系一致。

#### Scenario: 中文环境显示中文正在思考文案
- **WHEN** 当前语言设置为中文
- **THEN** 思考中标签 SHALL 显示 `💭 正在思考`

#### Scenario: 英文环境显示英文正在思考文案
- **WHEN** 当前语言设置为英文
- **THEN** 思考中标签 SHALL 显示 `💭 Thinking`

### Requirement: 历史恢复场景不受影响
从存储恢复历史消息时重建的思考卡片 SHALL NOT 包含动画效果，且标签文案 SHALL 为静态文案。

#### Scenario: 历史消息恢复的思考卡片无动画
- **WHEN** `renderChatMessages()` 从存储中恢复包含 `reasoning_content` 的助手消息
- **THEN** 重建的思考卡片 SHALL 处于折叠状态
- **AND** 标签文案 SHALL 为 `💭 思考过程` 或 `💭 Thought Process`（静态文案）
- **AND** 卡片 SHALL NOT 带有 `.thinking-active` 类
- **AND** 标签文字 SHALL NOT 有呼吸渐变动画
