## REMOVED Requirements

### Requirement: AIC 填时之眼内置技能
**Reason**: 该技能自创建以来一直处于"待完善"占位状态，从未实现实际功能。移除后保持技能列表的整洁和可用性。
**Migration**: 无需迁移。该技能从未被实际使用，不依赖其他系统。

系统不再将 `aic-time-eye` 作为内置技能注册。`manifest.json` 中移除该条目，技能不再出现在技能目录面板中。

#### Scenario: 技能目录不包含 AIC 填时之眼
- **WHEN** 用户打开"技能"Tab 查看可用技能列表
- **THEN** "业务"分类下不再显示 "AIC 填时之眼" 技能行
