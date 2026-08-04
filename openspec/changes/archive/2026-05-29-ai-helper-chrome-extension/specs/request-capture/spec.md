## 新增需求

### 需求：捕获活跃标签页的发出请求
系统应当使用 `chrome.webRequest` 监听器监控活跃标签页发出的所有 HTTP 请求（XHR、fetch），并缓冲请求方法、URL 路径和唯一请求 ID。

#### 场景：捕获 XHR 请求
- **WHEN** 活跃标签页执行 `fetch('https://example.com/api/user')`（GET）
- **THEN** service worker 捕获该请求，记录方法 `GET`、URL 路径 `/api/user` 和唯一 requestId

#### 场景：捕获 POST 请求
- **WHEN** 活跃标签页执行 `fetch('https://example.com/api/login', {method: 'POST'})`
- **THEN** service worker 捕获该请求，记录方法 `POST`、URL 路径 `/api/login`

#### 场景：忽略其他标签页的请求
- **WHEN** 非活跃标签页发出 HTTP 请求
- **THEN** 该请求不会被添加到捕获缓冲区

### 需求：捕获响应状态码
系统应当监听 `webRequest.onCompleted` 事件，通过 requestId 匹配已缓冲的请求，并附加 HTTP 状态码。

#### 场景：匹配响应到已缓冲请求
- **WHEN** 已捕获的 `GET /api/user` 请求以状态码 `200` 完成
- **THEN** 缓冲区更新该请求条目，包含 `status: 200`

#### 场景：请求以错误状态码完成
- **WHEN** 已捕获的 `POST /api/login` 请求以状态码 `401` 完成
- **THEN** 缓冲区更新该请求条目，包含 `status: 401`

#### 场景：处理无匹配请求的响应
- **WHEN** `onCompleted` 事件触发但 requestId 不在缓冲区中
- **THEN** 系统静默忽略（不报错）

### 需求：缓冲捕获的请求
系统应当在 service worker 中维护一个内存环形缓冲区，最多保留最近 200 条请求。

#### 场景：缓冲区未满
- **WHEN** 捕获了 50 条请求，缓冲区上限为 200
- **THEN** 所有 50 条请求都保留在缓冲区中

#### 场景：缓冲区溢出
- **WHEN** 捕获了 201 条请求，缓冲区上限为 200
- **THEN** 最旧的请求被逐出，仅保留最近 200 条

### 需求：向侧边栏面板推送请求
系统应当在请求完成（附带状态码）时，通过 `chrome.runtime.sendMessage` 将新请求条目推送到已连接的侧边栏面板。

#### 场景：推送已完成请求到面板
- **WHEN** 请求完成并带有状态码
- **THEN** service worker 发送包含 `{type: 'REQUEST_COMPLETED', data: {method, path, status, timestamp}}` 的消息到侧边栏面板

#### 场景：面板未连接
- **WHEN** 请求完成但侧边栏面板已关闭或未连接
- **THEN** 请求仍被缓冲但不发送消息（不报错）

### 需求：面板打开时查询已捕获请求
系统应当响应侧边栏面板发送的 `QUERY_REQUESTS` 消息，返回完整缓冲请求列表，以便面板在打开时初始化显示。

#### 场景：面板请求初始数据
- **WHEN** 侧边栏面板打开并发送 `{type: 'QUERY_REQUESTS'}`
- **THEN** service worker 响应 `{type: 'REQUESTS_DATA', data: [...]}`，包含所有已缓冲的请求
