## 1. 提取收藏夹管理模块

- [x] 1.1 新建 `chrome-extension/src/panel/favorites-manager.js`，将 `panel.js` 中的 `FAVORITES_KEY`、`loadFavorites()`、`saveFavorites()`、`generateUUID()` 移入，新增 `createCollection`、`deleteCollection`、`addSkills`、`removeSkills` 四个方法
- [x] 1.2 在 `panel.html` 的 `config.js` 之后、`chat.js` 之前插入 `<script src="favorites-manager.js"></script>`
- [x] 1.3 重构 `panel.js`：将原来直接操作 `chrome.storage.local` 的收藏代码改为调用 `FavoritesManager` 方法（`handleAddToFavorite`、`renderFavorites`、收藏卡右键删除等）

## 2. 新增四个收藏管理 AI 工具

- [x] 2.1 在 `chat.js` 的 `buildMergedTools()` 中定义四个工具声明：`create_skill_collection`（参数 name/description/skillIds）、`delete_skill_collection`（参数 collectionId）、`add_skills_to_collection`（参数 collectionId/skillIds）、`remove_skills_from_collection`（参数 collectionId/skillIds）
- [x] 2.2 在 `chat.js` 的 `executeToolCall()` 中添加四个工具的处理分支，handler 均调用 `FavoritesManager` 对应方法并返回结果 JSON

## 3. "推荐Skill"技能定义

- [x] 3.1 创建 `skills/recommend-skill/skill.cn.md`，编写中文 prompt，指导 AI 通过 `ask_user` 提问澄清场景、通过 `ask_user`（multiSelect）展示推荐技能、调用 `create_skill_collection` 创建收藏夹
- [x] 3.2 创建 `skills/recommend-skill/skill.en.md`，编写英文 prompt
- [x] 3.3 在 `skills/manifest.json` 中注册 `recommend-skill`（id、category 为"业务"、支持 cn/en）

## 4. 技能页面搜索框 HTML 与 CSS

- [x] 4.1 在 `panel.html` 的 `#tab-skills` 中 `#favoritesContainer` 之前添加 `#smartSearchContainer` 容器，包含输入框（`#smartSearchInput`）和搜索按钮（`#smartSearchBtn`）
- [x] 4.2 在 `panel.css` 中添加搜索框样式（与聊天输入框风格一致，`.smart-search-container`、`.smart-search-input`、`.smart-search-btn`），添加加载状态样式

## 5. 联通性检测与搜索框展示逻辑

- [x] 5.1 在 `panel.js` 的 `switchTab` 函数中，当切换到 `skills` Tab 时调用联通性检测函数 `checkConnectivityForSkills()`
- [x] 5.2 实现 `checkConnectivityForSkills()` 函数：读取模型配置 → 配置不完整则隐藏搜索框 → 调用 `testConnectivity()`（5秒超时）→ 成功显示搜索框/失败隐藏搜索框
- [x] 5.3 添加加载状态：检测请求未返回时，搜索框显示加载指示器

- [x] 6.1 绑定搜索按钮点击事件（`#smartSearchBtn` 和 Enter 键）→ 获取 `#smartSearchInput` 的值，为空则忽略
- [x] 6.2 实现 `triggerSmartSearch(query)` 函数：调用 `switchTab('chat')` → 调用 `activateSkill('recommend-skill')` → 调用 `doSendMessage(query)` 自动发送用户输入

## 7. 多语言支持

- [x] 7.1 在 `i18n.js` 中添加中英文文本：搜索框 placeholder（"输入你需要解决的场景" / "Describe your scenario"）、搜索按钮（"搜索" / "Search"）、加载状态（"检测中..." / "Checking..."）、四个收藏管理工具描述

## 8. 验证与测试

- [x] 8.1 验证 `FavoritesManager` 四个方法的创建、删除、添加、移除操作正确
- [x] 8.2 验证 `panel.js` 收藏交互（右键收藏、收藏卡操作）通过 `FavoritesManager` 正常工作
- [x] 8.3 验证模型联通时搜索框正常展示，未联通时隐藏
- [x] 8.4 验证输入场景描述后点击搜索，自动跳转聊天 Tab 并激活"推荐Skill"
- [x] 8.5 验证 AI 通过 `ask_user` 执行引导式对话并最终输出多选推荐
- [x] 8.6 验证用户勾选确认后 `create_skill_collection` 创建成功，在技能页面正常展示
- [x] 8.7 验证四个 AI 工具均可正常调用
- [x] 8.8 验证中英文环境文本正确
