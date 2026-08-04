## 1. 准备工作

- [x] 1.1 从 `dev-system-qa` 分支读取 `skill.cn.md` / `skill.en.md` 完整内容
- [x] 1.2 从 `dev-system-qa` 分支读取 4 份参考文档内容（modules.md, skills.md, troubleshooting.md, faq.md）
- [x] 1.3 确认当前系统 22 个公共工具清单
- [x] 1.4 确认 `manifest.json` 中 `"system-qa"` 待改为 `"product-expert"`

## 2. 技能目录重命名

- [x] 2.1 目录重命名 `chrome-extension/skills/system-qa/` → `chrome-extension/skills/product-expert/`
- [x] 2.2 更新 `chrome-extension/skills/manifest.json` 中 `"system-qa"` → `"product-expert"`

## 3. 技能内容合并与迁移

- [x] 3.1 编写 `skill.cn.md`：以 `dev-system-qa` 的 `skill.cn.md` 为主线，合并 4 份参考文档内容，更新身份为产品专家，删除不存在工具引用
- [x] 3.2 编写 `skill.en.md`：以 `dev-system-qa` 的 `skill.en.md` 为主线，合并 4 份参考文档英文内容，更新身份为 Product Expert，删除不存在工具引用
- [x] 3.3 正文开头使用新身份描述（产品专家，面向使用者/实施人员/开发者）
- [x] 3.4 合并 `modules.md` → 正文"核心功能模块"子章节（保留 9 大模块 + 架构分层图）
- [x] 3.5 合并 `skills.md` → 正文"内置技能一览"子章节（保留表格 + 协作场景）
- [x] 3.6 合并 `troubleshooting.md` → 正文"故障排查表"子章节（保留 5 类症状）
- [x] 3.7 合并 `faq.md` → 正文"常见配置 FAQ"子章节（保留 4 个主题 Q&A）
- [x] 3.8 删除以下不存在工具的引用：`get_extension_info`、`list_skills`、`get_config_summary`、`list_active_headers`
- [x] 3.9 删除 `diagnose.js`、脱敏（`maskSecret`）、`scripts/` 等全部描述
- [x] 3.10 验证 front matter：`id` 为 `product-expert`，`name` 为「产品专家」/「Product Expert」
- [x] 3.11 验证工具引用：每个工具名称均在 22 个现行工具列表中

## 4. 清理冗余文件

- [x] 4.1 删除 `product-expert/SKILL.md`（如存在）
- [x] 4.2 删除 `product-expert/references/` 目录（如存在）
- [x] 4.3 删除 `product-expert/scripts/` 目录（如存在）
- [x] 4.4 删除 `product-expert/evals/` 目录（如存在）
- [x] 4.5 清理 `.DS_Store` 等非必要文件

## 5. 最终验证

- [x] 5.1 确认 `product-expert/` 目录下仅保留：`skill.cn.md` + `skill.en.md`
- [x] 5.2 验证两份 skill MD 可被 `skill-md-loader` 正确解析
- [x] 5.3 确认 `manifest.json` 中注册项为 `"product-expert"`
- [x] 5.4 验证正文不包含任何外部文件链接、不存在工具名称
