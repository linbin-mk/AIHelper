## Requirements
### Requirement: AI 可以调用 presentOutputFiles 工具展示产物集合
系统 SHALL 提供一个 `present_output_files` 工具，AI 模型可通过 function calling 调用此工具，在聊天面板中渲染一张产物集合卡片。卡片按目录树结构展示工作产物中的文件列表，提供文件预览和批量下载功能。

#### Scenario: AI 调用 presentOutputFiles 展示全部产物文件
- **WHEN** AI 调用 `present_output_files` 工具，参数为 `{}`（无过滤条件）
- **THEN** 聊天面板中插入一张产物集合卡片，标题显示"📦 工作产物"，下方列出工作产物中所有文件（按目录树结构展示），每个文件行显示文件名和"👁 预览"按钮，底部显示"[⬇ 下载全部] (N 个文件)"按钮

#### Scenario: AI 按路径前缀过滤展示文件
- **WHEN** AI 调用 `present_output_files` 工具，参数为 `{pathPrefix: "openspec/changes/add-auth/"}`
- **THEN** 卡片仅展示路径以 `openspec/changes/add-auth/` 开头的文件，标题可附加路径前缀信息

#### Scenario: AI 展示扁平文件列表
- **WHEN** AI 调用 `present_output_files` 工具，参数为 `{showTree: false}`
- **THEN** 卡片以扁平列表展示文件（不按目录分组），每行显示完整文件路径

#### Scenario: 工作产物中无文件时展示空状态
- **WHEN** AI 调用 `present_output_files` 工具且工作产物中无任何文件
- **THEN** 卡片显示空状态提示："📭 暂无产物文件"，不显示下载按钮

#### Scenario: AI 自定义空状态提示
- **WHEN** AI 调用 `present_output_files` 工具，参数为 `{emptyMessage: "还没有生成任何代码文件"}`
- **THEN** 卡片在无文件时显示自定义空状态消息："📭 还没有生成任何代码文件"

### Requirement: 产物集合卡片支持文件预览
用户 SHALL 能够点击产物集合卡片中的文件预览按钮，在模态框中查看文件完整内容。

#### Scenario: 用户点击文件预览按钮查看内容
- **WHEN** 用户在产物集合卡片中点击文件 `proposal.md` 旁的"👁 预览"按钮
- **THEN** 系统调用 `getOutputFile("openspec/changes/add-auth/proposal.md")` 从 IndexedDB 读取文件内容，并在模态框中展示（最大 8000 字符）

#### Scenario: 预览加载中显示状态反馈
- **WHEN** 用户点击预览按钮，从 IndexedDB 读取文件内容的短时间内
- **THEN** 预览按钮显示加载中状态（如文字变为"... 加载中"），加载完成后打开模态框

#### Scenario: 预览文件不存在时的错误处理
- **WHEN** 用户点击预览按钮，但对应文件在 IndexedDB 中不存在
- **THEN** 模态框显示错误提示"文件未找到"，不崩溃

### Requirement: 产物集合卡片支持一键下载全部文件
用户 SHALL 能够通过产物集合卡片底部的下载按钮，一键下载卡片中展示的所有文件。

#### Scenario: 用户点击下载全部按钮批量下载
- **WHEN** 用户在产物集合卡片中点击"[⬇ 下载全部] (3 个文件)"按钮
- **THEN** 系统遍历文件列表，对每个文件调用 `getOutputFile(path)` 读取内容，通过 Blob + URL.createObjectURL + 隐藏 `<a>` 触发浏览器下载，按钮文字变为"⬇ 下载中..."

#### Scenario: 下载完成后按钮状态更新
- **WHEN** 所有文件下载触发完成
- **THEN** 下载按钮文字变为"✓ 下载完成"，按钮变灰不可再次点击

#### Scenario: 文件数量为零时不显示下载按钮
- **WHEN** 产物集合卡片中无文件（空状态）
- **THEN** 卡片不显示下载全部按钮

### Requirement: 产物集合卡片应符合 Catppuccin 主题风格
产物集合卡片 SHALL 在视觉风格上与现有的文件卡片、询问卡片保持一致，使用 Catppuccin 配色变量，支持深色/浅色主题自动切换。

#### Scenario: 深色主题下渲染产物集合卡片
- **WHEN** 当前主题为深色模式
- **THEN** 产物集合卡片使用深色背景 (`var(--ctp-mantle)`)、文字颜色 (`var(--ctp-text)`)，左边框为绿色 (`3px solid var(--ctp-green)`)，文件列表区域使用 (`var(--ctp-crust)`) 背景，下载按钮使用绿色主题 (`var(--ctp-green-btn)`)

#### Scenario: 浅色主题下渲染产物集合卡片
- **WHEN** 当前主题为浅色模式
- **THEN** 产物集合卡片使用浅色背景和对应 Catppuccin 浅色变量，文字对比度足够

### Requirement: 产物集合卡片不阻塞 Agent 循环
产物集合卡片 SHALL 在渲染后立即返回确认信息，不阻塞 Agent 继续执行。

#### Scenario: 卡片渲染后 Agent 自动继续
- **WHEN** AI 调用 `present_output_files` 且卡片已渲染
- **THEN** `executeToolCall` 立即返回 `{displayed: true, fileCount: N}`，Agent 循环不阻塞

### Requirement: presentOutputFiles 工具定义需发送给 AI 模型
系统 SHALL 在 TOOLS 数组中包含 `present_output_files` 的工具定义。

#### Scenario: AI 在系统提示中找到 presentOutputFiles 工具
- **WHEN** 构建 `/v1/chat/completions` 请求时
- **THEN** 请求的 `tools` 数组包含 `present_output_files` 工具定义，其 `parameters` 包含 `pathPrefix`（type: string, optional）、`showTree`（type: boolean, optional, default true）、`emptyMessage`（type: string, optional）

### Requirement: 产物集合卡片国际化支持
产物集合卡片的 UI 文本 SHALL 支持中英文国际化。

#### Scenario: 中文环境下渲染卡片
- **WHEN** 系统语言设置为中文
- **THEN** 卡片标题显示"📦 工作产物"，预览按钮显示"👁 预览"，下载按钮显示"⬇ 下载全部 ({n}个文件)"

#### Scenario: 英文环境下渲染卡片
- **WHEN** 系统语言设置为英文
- **THEN** 卡片标题显示"📦 Output Files"，预览按钮显示"👁 Preview"，下载按钮显示"⬇ Download All ({n} files)"

### Requirement: 历史会话中恢复产物集合卡片
当 `renderChatMessages` 重建聊天历史时，遇到 `present_output_files` 工具调用的消息 SHALL 从工具调用参数中提取过滤条件并重新调用 `createOutputCollectionCard` 重建产物集合卡片。

#### Scenario: 切换历史会话时看到之前的产物集合卡片
- **WHEN** 用户切换到包含 `present_output_files` 工具调用的历史会话
- **AND** `renderChatMessages` 处理该消息的 tool_calls
- **THEN** 渲染一张产物集合卡片
- **AND** 卡片使用 IndexedDB 中当前实际存在的文件（按 `pathPrefix` 过滤）
- **AND** 文件预览和批量下载功能可用

#### Scenario: 历史产物文件已被删除
- **WHEN** 历史会话中的 `present_output_files` 引用的文件已从 IndexedDB 中删除
- **THEN** 卡片展示空状态提示
- **AND** 不显示下载按钮

#### Scenario: 部分历史产物文件仍存在
- **WHEN** 历史会话中的 `present_output_files` 引用的文件部分存在、部分已删除
- **THEN** 卡片仅展示仍存在的文件
- **AND** 文件计数和下载功能对应实际存在的文件

