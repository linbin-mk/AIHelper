## Why

Chrome 扩展上传时，`skills/manifest.json` 被识别为第二个清单文件，与根目录的 `manifest.json` 冲突，导致上传失败。需要重命名技能注册文件以避免冲突。

## What Changes

- 将 `chrome-extension/skills/manifest.json` 重命名为 `chrome-extension/skills/skills.json`
- 更新 `skill-registry.js` 中的引用路径：`skills/manifest.json` → `skills/skills.json`

## Capabilities

### New Capabilities

无新增能力。

### Modified Capabilities

- `skill-md-loader`: 技能清单文件的加载路径从 `skills/manifest.json` 变更为 `skills/skills.json`
- `recommend-skill`: 技能注册清单文件引用路径更新
- `product-expert-skill-content`: 技能注册清单文件引用路径更新

## Impact

- `chrome-extension/skills/manifest.json` — 重命名为 `skills.json`（内容不变）
- `chrome-extension/src/panel/skill-registry.js:55` — 更新 `getURL` 路径
- `openspec/specs/skill-md-loader/spec.md` — 更新文档中的路径引用
- `openspec/specs/recommend-skill/spec.md` — 更新文档中的路径引用
- `openspec/specs/product-expert-skill-content/spec.md` — 更新文档中的路径引用
