## 1. 重命名技能清单文件

- [x] 1.1 创建 `chrome-extension/skills/skills.json`，内容为原 `manifest.json` 的技能 ID 数组
- [x] 1.2 确认旧文件 `chrome-extension/skills/manifest.json` 已删除

## 2. 更新代码引用

- [x] 2.1 修改 `chrome-extension/src/panel/skill-registry.js:55`，将 `skills/manifest.json` 改为 `skills/skills.json`

## 3. 验证

- [x] 3.1 确认 `chrome-extension/` 目录下仅存在根级别 `manifest.json`（无其他 `manifest.json` 文件）
- [x] 3.2 确认 `skills/skills.json` 为有效 JSON 数组，包含所有已注册技能 ID
