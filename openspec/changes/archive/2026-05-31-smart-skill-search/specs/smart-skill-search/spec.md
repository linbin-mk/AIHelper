## ADDED Requirements

### Requirement: 智慧搜索入口展示条件
系统 SHALL 在用户切换到"技能"Tab 时检测 AI 模型联通性。仅当联通性检测通过时，在技能页面"收藏"卡片上方展示"智慧搜索"搜索框。联通性检测失败或未配置模型时，不展示搜索框。

#### Scenario: 模型联通时切换至技能 Tab 展示搜索框
- **WHEN** 用户切换到"技能"Tab
- **AND** 系统调用 `testConnectivity()` 检测联通性并返回成功
- **THEN** 搜索框在 `#favoritesContainer` 上方展示
- **AND** 搜索框内显示提示文字"输入你需要解决的场景"
- **AND** 右侧显示搜索按钮

#### Scenario: 模型未联通时不展示搜索框
- **WHEN** 用户切换到"技能"Tab
- **AND** 系统调用 `testConnectivity()` 检测联通性返回失败（网络不可达、超时或接口返回错误）
- **THEN** 不展示搜索框
- **AND** 技能页面正常展示收藏卡和分类列表

#### Scenario: 无配置模型时不展示搜索框
- **WHEN** 用户切换到"技能"Tab
- **AND** 大模型配置不完整（`apiBaseUrl`、`apiKey`、`modelName` 任一为空）
- **THEN** 不执行联通性检测
- **AND** 不展示搜索框

#### Scenario: 联通性检测中显示加载状态
- **WHEN** 用户切换到"技能"Tab
- **AND** 联通性检测请求尚未返回
- **THEN** 搜索框区域展示加载指示器（如加载图标或文字"检测中..."）

#### Scenario: 检测超时后隐藏加载状态
- **WHEN** 联通性检测请求在 5 秒内未返回
- **THEN** 加载状态消失
- **AND** 不展示搜索框

### Requirement: 智慧搜索框布局与样式
搜索框 SHALL 放置在 `#tab-skills` 容器内 `#favoritesContainer` 上方，具有与聊天输入框一致的视觉风格。搜索框为独立容器 `#smartSearchContainer`，内部包含输入框和搜索按钮。

#### Scenario: 搜索框位于收藏卡上方
- **WHEN** 联通性检测通过且搜索框展示
- **AND** 用户存在收藏夹
- **THEN** 搜索框出现在 `#favoritesContainer` 之前（DOM 顺序在先）
- **AND** 收藏卡紧接在搜索框下方

#### Scenario: 搜索框可见时收藏卡为空
- **WHEN** 联通性检测通过且搜索框展示
- **AND** 用户没有任何收藏夹
- **THEN** 搜索框仍然展示
- **AND** `#favoritesContainer` 隐藏，技能分类列表紧接搜索框下方

#### Scenario: 搜索框包含输入框和搜索按钮
- **WHEN** 搜索框展示
- **THEN** 搜索框内部包含一个文本输入框（`placeholder` 为"输入你需要解决的场景"）和一个搜索按钮（文字或图标为"搜索"）

#### Scenario: 搜索框支持回车触发搜索
- **WHEN** 用户在搜索输入框中按下 Enter 键
- **THEN** 触发与点击搜索按钮相同的搜索行为

#### Scenario: 搜索框输入为空时禁止搜索
- **WHEN** 用户点击搜索按钮或按 Enter
- **AND** 输入框内容为空或仅空白字符
- **THEN** 不执行搜索操作

### Requirement: 智慧搜索触发跳转与技能激活
用户输入场景描述后点击搜索按钮，系统 SHALL 执行以下操作：切换到"AI聊天"Tab、激活"推荐Skill"技能、将用户输入文本作为首条消息发送。

#### Scenario: 搜索触发完整跳转流程
- **WHEN** 用户在搜索框中输入"我想做UI测试"
- **AND** 用户点击搜索按钮
- **THEN** 系统调用 `switchTab('chat')`
- **AND** 系统调用 `activateSkill('recommend-skill')`
- **AND** 系统自动发送消息 `"我想做UI测试"` 到聊天

#### Scenario: 跳转后用户输入作为用户消息渲染
- **WHEN** 跳转完成且消息已发送
- **THEN** 聊天消息列表中出现用户的"我想做UI测试"消息气泡
- **AND** 状态栏显示"推荐Skill"的激活 tag
- **AND** 技能激活卡片展示在用户消息下方

#### Scenario: 当前聊天会话正常显示
- **WHEN** 跳转触发时当前存在活跃会话
- **THEN** 用户消息和技能激活卡片追加到当前会话末尾
- **AND** 不创建新会话

### Requirement: 搜索引擎记录用户输入文本大小写
用户输入的文本 SHALL 保持用户原始的文本大小写格式并传递给 AI，不做任何大小写转换。

#### Scenario: 保留原始文本大小写
- **WHEN** 用户在搜索框中输入 `"React Component Test"`
- **THEN** 发送给 AI 的消息内容为 `"React Component Test"`（保持原始大小写）

### Requirement: 多语言支持
搜索框的所有用户可见文本 SHALL 支持中英文。

#### Scenario: 中文环境
- **WHEN** 语言环境为中文
- **THEN** 搜索框输入框显示中文提示语"输入你需要解决的场景"
- **AND** 搜索按钮显示为"搜索"

#### Scenario: 英文环境
- **WHEN** 语言环境为英文
- **THEN** 搜索框输入框显示英文提示语"Describe your scenario"
- **AND** 搜索按钮显示为"Search"
