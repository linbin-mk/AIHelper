## Why

当前测试数据生成 Skill 采用"捕获请求→执行"交互模型，依赖浏览器请求捕获后分析接口并直接构造 API 调用。该模式存在以下问题：(1) 过度依赖页面交互触发请求捕获，用户操作繁琐；(2) 遇到业务前置条件错误时缺乏智能分析能力，反复重试浪费 token；(3) 缺少字段语义推断机制，数据生成质量依赖 AI 的随机性。本次升级将模型转变为"Schema + 业务规则 → 生成合规数据"，引入智能错误分类、字段生成策略表和业务约束分析能力，从根本上提升造数效率和数据质量。

## What Changes

- Skill prompt 完全重写：AI 角色从"请求分析执行器"变为"规则驱动的正向测试数据生成器"
- 新增字段生成策略表：根据字段名称语义自动推断合适的测试数据值
- 新增智能错误分类系统：将接口错误分为业务前置条件错误、字段校验错误、接口不存在、未知错误四类，每类有不同处理策略
- 新增接口发现与探测策略：当捕获请求中无目标接口时，通过 URL 模式推断、查询响应字段提取、主动探测、兜底四步获取接口定义
- 输出格式变更：从 taskCard JSON 变为"纯 JSON 数据 + `--- 生成逻辑 ---` 分隔 + 自然语言解释"
- 新增多轮对话记忆规则：支持修改字段、追加生成、新增字段等交互
- Skill 描述文本更新：体现规则驱动和正向测试数据生成的核心定位

## Capabilities

### New Capabilities
- `skill-test-data-rules-engine`: 基于字段语义推断和智能错误分类的测试数据生成规则引擎，包括字段生成策略表、四类错误分类决策树、接口探测四步法

### Modified Capabilities
- `skill-test-data-generation`: Skill 的 prompt 规则、工作流程和输出格式发生根本性变化，从"请求捕获驱动"变为"规则驱动"

## Impact

- 受影响文件：`chrome-extension/skills/test-data-generation/skill.cn.md`、`chrome-extension/skills/test-data-generation/skill.en.md`
- 受影响 UI：`chrome-extension/skills/test-data-generation/index.js` 中的 `parseDataFromText` 和 `renderDataPreview` 函数需适配新的输出格式
- Skill 工具集可能需调整（当前工具集不变，但 AI 对工具的使用方式变化）
- `openspec/specs/skill-test-data-generation/spec.md` 中的 taskCard 相关需求可能需更新为数据预览卡片模式
