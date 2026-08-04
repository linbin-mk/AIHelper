## 新增需求

### 需求：配置请求头注入规则
系统应当允许用户通过侧边栏面板 UI 添加自定义请求头（名称和值对），持久化到 `chrome.storage.local` 并应用为 `declarativeNetRequest` 动态规则。

#### 场景：添加新请求头
- **WHEN** 用户输入请求头名称 `Authorization` 和值 `Bearer abc123`，点击"添加"
- **THEN** 请求头保存到 storage，并创建 DNR 规则向活跃标签页的所有请求注入 `Authorization: Bearer abc123`

#### 场景：更新已有请求头
- **WHEN** 用户将 `Authorization` 请求头值从 `Bearer abc123` 修改为 `Bearer xyz789`
- **THEN** DNR 规则更新，向后续请求注入新值

#### 场景：删除请求头
- **WHEN** 用户从列表中删除 `Authorization` 请求头
- **THEN** 请求头从 storage 中移除，对应的 DNR 规则也被移除

### 需求：按标签页应用请求头
系统应当通过在每个 DNR 规则上设置 `condition.tabIds`，将请求头注入规则限定到活跃标签页，并应当从非活跃标签页移除规则以防止请求头泄漏。

#### 场景：请求头仅应用于活跃标签页
- **WHEN** 用户配置了 `X-Token: secret`，活跃标签页 tabId 为 42
- **THEN** `X-Token` 的 DNR 规则 `condition.tabIds` 为 `[42]`

#### 场景：标签页切换时移除请求头
- **WHEN** 用户从 tabId 42 切换到 tabId 43
- **THEN** DNR 规则更新为目标 tabId 43（移除目标为 tabId 42 的规则）

#### 场景：标签页关闭时清除请求头
- **WHEN** 活跃标签页被关闭
- **THEN** 与该标签页关联的所有 DNR 规则被移除

### 需求：持久化请求头配置
系统应当将已配置的请求头持久化到 `chrome.storage.local`，以便在 service worker 重启后保留。

#### 场景：Service worker 重启后请求头保留
- **WHEN** service worker 被 Chrome 终止并重新启动
- **THEN** 之前配置的请求头从 storage 加载，并重新创建 DNR 规则

#### 场景：初始状态无已配置请求头
- **WHEN** 插件首次安装，没有任何已存储的请求头
- **THEN** 系统以空请求头列表加载（不报错）

### 需求：面板中显示请求头管理 UI
系统应当在侧边栏面板中渲染用于添加/删除请求头的输入表单，包含请求头名称和值的输入字段、添加按钮，以及带删除按钮的当前请求头列表。

#### 场景：通过 UI 添加请求头
- **WHEN** 用户在名称字段输入 `Authorization`，值字段输入 `Bearer token`，点击"添加"
- **THEN** 请求头列表中出现新行，显示 `Authorization: Bearer token` 并带有删除按钮

#### 场景：通过 UI 删除请求头
- **WHEN** 用户点击请求头列表中 `Authorization` 旁边的删除按钮
- **THEN** 该请求头行从列表和 DNR 规则中移除
