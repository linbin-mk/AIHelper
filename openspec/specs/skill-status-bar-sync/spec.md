## ADDED Requirements

### Requirement: 删除 skill 标签时同步清理输入框文本（仅文本清理）

当用户点击 `#skillStatusBar` 上 skill 标签的关闭按钮（×）时，系统 SHALL 仅仅移除聊天输入框中对应的 `/<skillId> ` 前缀文本，保留其余文字内容不变。点击 × 不取消 skill 激活，不重新渲染状态栏。

#### Scenario: 点击 × 删除 skill 前缀
- **WHEN** 输入框内容为 `/<skillId> 用户输入的文本`，且 `#skillStatusBar` 显示该 skill 标签
- **AND** 用户点击该 skill 标签的 × 按钮
- **THEN** 输入框内容变为 `用户输入的文本`（仅移除 `/<skillId> ` 前缀）
- **AND** skill 保持激活状态不变
- **AND** `#skillStatusBar` 显示不变（标签仍然存在）

#### Scenario: 输入框前缀不匹配时点击 ×
- **WHEN** 输入框内容不以 `/<skillId>` 开头（用户已手动修改了前缀或删除了skill文本）
- **AND** 用户点击 skill 标签的 × 按钮
- **THEN** 输入框内容保持不变
- **AND** skill 保持激活状态不变
- **AND** `#skillStatusBar` 不变

### Requirement: 发送消息后清空 skill 状态栏

当用户发送聊天消息后，系统 SHALL 清空 `#skillStatusBar` 上的所有 skill 标签，skill 不应在发送后保持激活状态。

#### Scenario: 发送带 skill 激活的消息
- **WHEN** 用户激活了某个 skill（`#skillStatusBar` 显示对应标签）
- **AND** 用户点击发送按钮或按 Enter 发送消息
- **THEN** 消息正常发送
- **AND** 所有激活的 skill 被反激活
- **AND** `#skillStatusBar` 隐藏
- **AND** skill 的 prompt 和 tools 仍正确注入到该次 LLM 请求中

#### Scenario: 发送后输入框也同步清空
- **WHEN** 用户激活 skill 后输入框内容为 `/<skillId> 帮我写代码`
- **AND** 用户点击发送
- **THEN** 输入框清空（当前已有行为）
- **AND** skill 反激活，`#skillStatusBar` 隐藏
- **AND** `registry.getActive()` 返回空数组
