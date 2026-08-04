## Why

用户点击「+ 新建会话」按钮后，内存中的 `currentSessionId` 被清空但 `chrome.storage.local` 中的 `ai_helper_active_session_id` 未被清除。导致离开页面后回来时，旧会话被自动恢复，而非展示预期的欢迎页。这是一个内存状态与持久化状态不一致的 bug。

## What Changes

- 修改 `createNewSessionAndShow()` 函数，在清空内存状态时同步清空持久化的活跃会话 ID
- 更新 `multi-session-management` 规格：「手动创建会话」场景增加清空持久化活跃会话 ID 的断言
- 更新 `multi-session-management` 规格：「刷新后恢复」场景增加无活跃会话时展示欢迎页的行为

## Capabilities

### New Capabilities
<!-- No new capabilities - bug fix to existing behavior -->

### Modified Capabilities
- `multi-session-management`: 「手动创建会话」和「会话持久化」两个需求的规格行为需要补充

## Impact

- 受影响文件：`chrome-extension/src/panel/panel.js`（`createNewSessionAndShow` 函数，约第 1159 行）
- 受影响规格：`openspec/specs/multi-session-management/spec.md`
