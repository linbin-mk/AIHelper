## MODIFIED Requirements

### Requirement: YAML Front Matter 字段合规
`skill.cn.md` 和 `skill.en.md` 的 YAML front matter SHALL 包含 `id`（`product-expert`）、`name`（「产品专家」/「Product Expert」）、`description`（非空字符串，体现通用产品专家定位）、`category`（`产品`）。

#### Scenario: front matter 字段正确
- **WHEN** 解析 skill MD 的 front matter
- **THEN** `id` 为 `product-expert`，`name` 为对应语言名称，`category` 为 `产品`
