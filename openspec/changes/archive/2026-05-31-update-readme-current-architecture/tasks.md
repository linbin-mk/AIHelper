## 1. 调研当前架构

- [x] 1.1 遍历 chrome-extension/src/ 所有文件，确认实际目录结构
- [x] 1.2 读取 skills/manifest.json 和所有技能文件 frontmatter，确认 11 个技能及其分类
- [x] 1.3 确认所有 chrome.storage.local 键名和 IndexedDB 数据库名
- [x] 1.4 确认 chat.js 中已注册的工具数量（27 个 tool）

## 2. 重写 README

- [x] 2.1 重写项目定位和核心能力章节（AI 对话、技能系统、请求监控、请求头管理、知识管理、记忆管理、高级配置）
- [x] 2.2 重绘架构 ASCII 框图，补充缺失模块（content scripts 全量、agents-md-cache、output-files、favorites-manager）
- [x] 2.3 更新目录结构，与 chrome-extension/ 实际文件一致
- [x] 2.4 更新技能列表，按分类分组展示 11 个技能，补充收藏夹功能
- [x] 2.5 更新安装步骤（确认步骤可执行）
- [x] 2.6 更新使用说明（补充技能收藏夹、输出产物、通用记忆域等新功能）
- [x] 2.7 更新技术栈章节，补充 Kilo/OpenSpec 工作流工具
- [x] 2.8 更新注意事项，移除过时内容，补充当前实际考量
- [x] 2.9 移除致谢章节（非技术内容）

## 3. 验证

- [x] 3.1 对比 README 目录结构与 chrome-extension/ 实际文件，确保一致
- [x] 3.2 对比 README 技能列表与 skills/manifest.json，确保 11 个技能无误
- [x] 3.3 通读完整 README，确保语句通顺、格式正确
