## Why

用户无法在 UI 中删除不需要的技能或编辑技能内容（名称、描述、提示）。目前技能是扩展包内静态 Markdown 文件，用户如需定制技能只能手动编辑源文件并重新加载扩展，操作门槛高、体验差。

## What Changes

- 技能右键菜单新增「删除」选项，用户可移除不需要的内置技能
- 技能详情弹窗新增「编辑」按钮，点击后进入编辑模式，可修改技能名称、描述、提示内容并保存。编辑按当前 UI 语言区分版本（中文模式下编辑中文版，英文模式下编辑英文版），两个语言版本的编辑互不影响
- SkillRegistry 新增 `unregister()`、`update()` 方法，支持运行时动态移除和更新技能
- 删除/编辑状态持久化到 `chrome.storage.local`，扩展重启后保持生效
- 用户编辑过的技能以自定义技能形式存储，被删除的技能在列表中隐藏
- shared/ 目录修改后通过 sync.sh 同步到 Chrome 和 Firefox 扩展目录

## Capabilities

### New Capabilities

- `skill-delete`: 用户通过右键菜单删除技能，技能从列表中隐藏，操作可持久化
- `skill-edit`: 用户通过详情弹窗的编辑按钮进入编辑模式，可修改技能名称、描述和提示内容，保存后即时生效并持久化

### Modified Capabilities

<!-- 无现有 capability 需要修改 -->

## Impact

- `shared/skill-registry.js` — 新增 `unregister()`、`update()` 方法
- `chrome-extension/src/panel/panel.js` / `firefox-extension/src/popup/popup.js` — 上下文菜单增加删除选项，详情弹窗增加编辑按钮和编辑模式 UI
- `chrome-extension/src/panel/panel.html` / `firefox-extension/src/popup/popup.html` — 详情弹窗 HTML 增加编辑模式表单
- `sync.sh` — 无需修改（panel/popup 为平台专属目录，但当前两个平台代码一致，编辑后需同步）
