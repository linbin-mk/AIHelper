## ADDED Requirements

### Requirement: 引导手指动画工具
系统 SHALL 提供 `showGuideHand(opts)` 通用工具函数，用于在页面上创建短暂的手指标识引导动画。

#### Scenario: 通用手指动画展示
- **WHEN** 调用 `showGuideHand({ emoji, left, top, cssClass })`
- **THEN** 在 `left`、`top` 坐标处创建一个 56px 的绝对定位 span 元素
- **AND** span 带有 `guide-hand` 基础类和指定的 `cssClass` 修饰器
- **AND** 元素持续 3 秒后淡出，3.5 秒后从 DOM 移除

#### Scenario: 向上弹跳方向
- **WHEN** `cssClass` 为 `guide-hand--bounce-y`
- **THEN** 手指以 0.6s 周期做垂直方向往复弹跳（`translateY(0)` ↔ `translateY(-14px)`）

#### Scenario: 向左弹跳方向
- **WHEN** `cssClass` 为 `guide-hand--bounce-x`
- **THEN** 手指以 0.6s 周期做水平方向往复弹跳（`translateX(0)` ↔ `translateX(-16px)`）

### Requirement: 发送按钮引导手指
点击推荐提示卡片后，系统 SHALL 在发送按钮上方展示向下手指（👇）引导动画。

#### Scenario: 推荐卡片点击后展示发送引导
- **WHEN** 用户点击推荐提示卡片后输入框被填充文本
- **THEN** 在发送按钮上方居中位置出现 👇 手指，做上下弹跳引导
- **AND** 手指持续弹跳 3 秒后淡出消失

### Requirement: 搜索框引导手指
用户触发搜索框聚焦时，系统 SHALL 在搜索框旁展示向左手指（👈）引导动画。

#### Scenario: 搜索框引导展示
- **WHEN** 系统执行搜索引导（侧边栏已展开、搜索框已聚焦）
- **THEN** 在搜索输入框右侧出现 👈 手指，做左右弹跳引导
- **AND** 手指持续弹跳 3 秒后淡出消失
