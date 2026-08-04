## MODIFIED Requirements

### Requirement: YAML Front Matter 元数据字段
技能 MD 文件的 YAML front matter SHALL 包含以下字段：
- `id`（必填）：技能唯一标识，kebab-case 格式，与目录名一致
- `name`（必填）：技能显示名称，中文
- `description`（必填）：技能简短描述，用于技能列表展示和 AI 目录
- `category`（可选）：技能分类，值为 `业务`、`产品`、`开发`、`测试` 之一。未提供时归入 `其他`

#### Scenario: 必填字段完整
- **WHEN** 技能 MD 文件的 front matter 包含 `id: "test-skill"`、`name: "测试技能"`、`description: "这是一个测试技能"`
- **THEN** 该技能被成功解析，所有字段值正确读取
